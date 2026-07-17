#!/usr/bin/env ruby
# Feature: ZER0-078
# frozen_string_literal: true

# ===================================================================
# translate.rb — AI translation pipeline for multilingual content
# ===================================================================
#
# Purpose: Generate alternate-language versions of the site's English
#          content WITHOUT storing hand-written translations in source.
#          English (pages/**, _data/ui-text.yml `en`) is the only
#          human-maintained language; every other language is a build
#          artifact produced by this utility and committed by the
#          `translate.yml` workflow (never edited by hand).
#
# What it produces:
#   fr/<area>/<file>.md         Translated page files (plain Jekyll pages
#                               with explicit permalink /fr<en-url>, so the
#                               GitHub Pages safe-mode build needs no plugin)
#   _data/i18n/<lang>.yml       Translated UI strings (from ui-text.yml en)
#   _data/i18n/manifest.yml     Source-of-truth map: en URL -> per-language
#                               output URL + content SHA (drives the
#                               language toggle, hreflang tags, and
#                               incremental change detection)
#
# Modes:
#   (default)      Incremental — translate only new/changed sources
#   --full         Retranslate everything
#   --check        Report stale/missing translations; exit 1 if any (no API)
#   --dry-run      Plan only; no API calls, no writes
#
# Providers:
#   claude (default)  Anthropic Messages API. Credential precedence mirrors
#                     the chat proxy (templates/deploy/chat-proxy/worker.js):
#                       CLAUDE_CODE_OAUTH_TOKEN  Bearer + oauth beta header
#                       ANTHROPIC_AUTH_TOKEN     Bearer + oauth beta header
#                       ANTHROPIC_API_KEY        x-api-key
#                     OAuth tokens require the first system block to carry the
#                     Claude Code identity (same rule as the chat proxy).
#                     For local runs, credentials are auto-loaded from the
#                     repo-root .env (gitignored; `claude setup-token` output
#                     goes there — same file the chat dev proxy reads).
#                     Real environment variables always win over .env.
#   stub              Deterministic offline pseudo-translation (tests/demo):
#                     appends " [<lang>]" to every segment. No network.
#
# Safety model (how markdown survives translation):
#   - Fenced code blocks, {% highlight %}/{% raw %} regions and the YAML
#     front matter are never sent to the model.
#   - Inline code, Liquid tags/outputs, wiki-links, HTML tags and link
#     destinations are masked as ⟦N⟧ placeholders before the request and
#     restored after; a response that loses or invents placeholders, or
#     changes the segment set/line shape, is rejected and retried once.
#   - Translation is per-line ("one paragraph per line" house rule), sent
#     as a JSON segment map — the file's structure is reassembled from the
#     source, so code, blank lines and ordering are preserved by
#     construction and the markdown-oneline CI check stays green.
#
# Usage:
#   ruby scripts/translate.rb                 # incremental, configured langs
#   ruby scripts/translate.rb --full --langs fr
#   ruby scripts/translate.rb --dry-run --verbose
#   ruby scripts/translate.rb --provider stub --root /tmp/sandbox   # tests
#
# Configuration: `translation:` block in _config.yml (see there for keys).
# ===================================================================

require "date"
require "digest"
require "fileutils"
require "json"
require "net/http"
require "optparse"
require "time"
require "uri"
require "yaml"

module Zer0Translate
  VERSION = "1.0.0"
  PROMPT_VERSION = 1
  MANIFEST_REL = File.join("_data", "i18n", "manifest.yml")
  UI_TEXT_REL = File.join("_data", "ui-text.yml")
  PLACEHOLDER_RE = /⟦\d+⟧/ # ⟦N⟧

  FRONT_MATTER_FIELDS = %w[title sub-title subtitle description excerpt tagline].freeze
  # Front-matter keys that must NOT be copied onto a generated translation
  # (they would collide with the English page: duplicate redirects, wrong
  # permalink, wiki aliases, stale translation metadata).
  FRONT_MATTER_DROP = %w[
    permalink redirect_from redirect_to aliases lang
    translation_of translation_source_url machine_translated translated_from_sha
  ].freeze

  DEFAULT_CONFIG = {
    "enabled" => false,
    "source_lang" => "en",
    "languages" => [],
    "provider" => "claude",
    "model" => "claude-opus-4-8",
    "max_tokens" => 8192,
    "max_chunk_chars" => 4000,
    "max_chunk_segments" => 60,
    "ui_text" => true,
    "sources" => [
      { "path" => "pages/_posts", "output" => "posts" },
      { "path" => "pages/_docs", "output" => "docs" },
      { "path" => "pages/_about", "output" => "about" },
      { "path" => "pages/_quickstart", "output" => "quickstart" },
      { "path" => "pages/_notes", "output" => "notes" },
    ],
    "exclude" => ["**/README.md", "**/_templates/**"],
  }.freeze

  # ----------------------------------------------------------------
  # Small logging helpers (kept dependency-free; mirror scripts/lib tone)
  # ----------------------------------------------------------------
  module Log
    class << self
      attr_accessor :verbose

      def info(msg)  = puts(msg)
      def debug(msg) = (puts("  [debug] #{msg}") if verbose)
      def warn(msg)  = Kernel.warn("  [warn] #{msg}")
      def error(msg) = Kernel.warn("[error] #{msg}")
    end
  end

  Segment = Struct.new(:key, :text, :placeholders, keyword_init: true)

  # ----------------------------------------------------------------
  # Masking: protect non-translatable spans inside a prose line
  # ----------------------------------------------------------------
  class Masker
    # Order matters: coarser spans first so finer patterns never split them.
    INLINE_PATTERNS = [
      /\{%.*?%\}/m,                  # Liquid tags {% ... %}
      /\{\{.*?\}\}/m,                # Liquid output {{ ... }}
      /!?\[\[[^\]]+\]\]/,            # Obsidian wiki-links / embeds
      /`[^`]*`/,                     # inline code spans
      /\]\([^()\s]+\)/,              # markdown link destinations "](url)"
      /<https?:[^>\s]+>/,            # autolinks
      /<\/?[A-Za-z][^>]*>/,          # inline HTML tags
    ].freeze

    def initialize
      @map = {}
      @counter = 0
    end

    attr_reader :map

    def mask_line(line)
      masked = line.dup
      INLINE_PATTERNS.each do |pattern|
        masked = masked.gsub(pattern) do |match|
          @counter += 1
          token = "⟦#{@counter}⟧"
          @map[token] = match
          token
        end
      end
      masked
    end

    def unmask(text)
      text.gsub(PLACEHOLDER_RE) { |token| @map.fetch(token, token) }
    end
  end

  # ----------------------------------------------------------------
  # Splits a markdown body into translatable segments + verbatim lines
  # ----------------------------------------------------------------
  class Segmenter
    FENCE_RE = /\A(\s*)(`{3,}|~{3,})/
    PURE_LIQUID_RE = /\A\s*\{[%{].*[%}]\}\s*\z/
    PURE_HTML_RE = %r{\A\s*</?[A-Za-z][^>]*/?>\s*\z}
    HR_RE = /\A\s*(?:[-*_]\s*){3,}\z/
    TABLE_RULE_RE = /\A\s*\|?[\s:|-]+\|?\s*\z/

    attr_reader :lines, :segments, :masker

    def initialize(body)
      @lines = body.split("\n", -1)
      @masker = Masker.new
      @segments = []
      scan
    end

    # Rebuild the body with translated segments swapped in.
    def reassemble(translations)
      out = @lines.dup
      @segments.each do |seg|
        translated = translations.fetch(seg.key)
        out[seg.key.delete_prefix("s").to_i] = @masker.unmask(translated)
      end
      out.join("\n")
    end

    private

    def scan
      in_fence = false
      fence_marker = nil
      in_liquid_block = false

      @lines.each_with_index do |line, idx|
        if in_fence
          in_fence = false if line.lstrip.start_with?(fence_marker)
          next
        end
        if (m = line.match(FENCE_RE))
          in_fence = true
          fence_marker = m[2][0] * m[2].length
          next
        end
        if in_liquid_block
          in_liquid_block = false if line =~ /\{%-?\s*(endhighlight|endraw)\s*-?%\}/
          next
        end
        if line =~ /\{%-?\s*(highlight|raw)\b/ && line !~ /\{%-?\s*end(highlight|raw)/
          in_liquid_block = true
          next
        end

        next if line.strip.empty?
        next if line =~ PURE_LIQUID_RE || line =~ PURE_HTML_RE
        next if line =~ HR_RE
        next if line =~ TABLE_RULE_RE && line.include?("|")

        masked = @masker.mask_line(line)
        # Nothing human-readable left after masking → keep the line verbatim.
        next unless masked =~ /\p{L}/

        @segments << Segment.new(
          key: "s#{idx}",
          text: masked,
          placeholders: masked.scan(PLACEHOLDER_RE).sort,
        )
      end
    end
  end

  # ----------------------------------------------------------------
  # Jekyll URL resolution for this repo's permalink patterns
  # ----------------------------------------------------------------
  class UrlBuilder
    def initialize(site_config)
      @config = site_config
    end

    # Returns the pretty URL ("/posts/2026/01/01/foo/") for a source file,
    # or nil when the permalink template contains a placeholder we cannot
    # resolve (the caller skips the file with a warning).
    #
    # Resolution matches the OBSERVED Jekyll 3.10 behavior for this repo's
    # collection documents (verified against a real build): an explicit
    # front-matter `permalink` wins, otherwise the collection's permalink
    # template applies. Front-matter *defaults* permalinks do not affect
    # collection documents on this Jekyll version.
    def url_for(rel_path, front_matter, collection)
      template = front_matter["permalink"] || collection_permalink(collection)
      return nil unless template
      return prettify(template) unless template.include?(":")

      fill_template(template, rel_path, front_matter, collection)
    end

    private

    def collections_dir = @config["collections_dir"] || ""

    def collection_permalink(collection)
      cols = @config["collections"]
      return nil unless cols.is_a?(Hash)

      entry = cols[collection]
      entry.is_a?(Hash) ? entry["permalink"] : nil
    end

    def fill_template(template, rel_path, front_matter, collection)
      basename = File.basename(rel_path).sub(/\.[^.]+\z/, "")
      date = resolve_date(front_matter, basename)
      slug_base = basename
      if (m = basename.match(/\A(\d{4})-(\d{2})-(\d{2})-(.+)\z/))
        slug_base = m[4]
      end
      slug = front_matter["slug"] || slugify(slug_base)

      categories = Array(front_matter["categories"] || front_matter["category"])
                   .flatten.compact.map { |c| slugify(c.to_s) }

      in_collection = collection_relative(rel_path, collection)
      subdir = File.dirname(in_collection)
      subdir = "" if subdir == "."

      url = template.dup
      url = url.gsub(":collection", collection.to_s)
      url = url.gsub(":categories", categories.join("/"))
      url = url.gsub(":year", date ? format("%04d", date.year) : ":year")
      url = url.gsub(":month", date ? format("%02d", date.month) : ":month")
      url = url.gsub(":day", date ? format("%02d", date.day) : ":day")
      url = url.gsub(":slug", slug)
      url = url.gsub(":name", slugify(slug_base))
      url = url.gsub(":title", slug)
      url = url.gsub(":path", subdir)
      url = url.gsub(":output_ext", "")

      return nil if url.include?(":") # unresolved placeholder

      prettify(url)
    end

    def collection_relative(rel_path, collection)
      prefix = File.join(*[collections_dir, "_#{collection}"].reject(&:empty?))
      rel_path.delete_prefix("#{prefix}/")
    end

    def resolve_date(front_matter, basename)
      raw = front_matter["date"]
      case raw
      when Date, Time then return raw
      when String
        begin
          return Time.parse(raw)
        rescue ArgumentError
          nil
        end
      end
      m = basename.match(/\A(\d{4})-(\d{2})-(\d{2})-/)
      m ? Date.new(m[1].to_i, m[2].to_i, m[3].to_i) : nil
    end

    def slugify(str)
      str.to_s.downcase.gsub(/[^a-z0-9]+/, "-").gsub(/\A-+|-+\z/, "")
    end

    # `permalink: pretty` — collapse duplicate slashes, ensure trailing slash.
    def prettify(url)
      url = "/#{url}".gsub(%r{/+}, "/")
      url.end_with?("/") ? url : "#{url}/"
    end
  end

  # ----------------------------------------------------------------
  # Providers
  # ----------------------------------------------------------------
  class StubProvider
    def name = "stub"

    # Deterministic, structure-preserving pseudo-translation: appends a
    # visible marker to every segment. Placeholders survive by construction.
    def translate(segments, target_lang, _context)
      segments.to_h { |key, text| [key, "#{text} [#{target_lang}]"] }
    end
  end

  class ClaudeProvider
    ENDPOINT = URI("https://api.anthropic.com/v1/messages")
    API_VERSION = "2023-06-01"
    OAUTH_BETA = "oauth-2025-04-20"
    # Claude Code OAuth tokens are gated to Claude Code: the FIRST system
    # block must carry this identity or the API rejects the request (same
    # rule the chat proxy implements — see chat-proxy/worker.js).
    CLAUDE_CODE_IDENTITY = "You are Claude Code, Anthropic's official CLI for Claude."
    MAX_ATTEMPTS = 4

    def initialize(model:, max_tokens:)
      @model = model
      @max_tokens = max_tokens
      @auth = resolve_auth
      raise "No Anthropic credential found. Set CLAUDE_CODE_OAUTH_TOKEN " \
            "(from `claude setup-token`), ANTHROPIC_AUTH_TOKEN, or ANTHROPIC_API_KEY." unless @auth
    end

    def name = "claude (#{@model})"

    def translate(segments, target_lang, context)
      payload = build_payload(segments, target_lang, context)
      body = request_with_retries(payload)
      text = (body["content"] || []).select { |b| b["type"] == "text" }
                                    .map { |b| b["text"] }.join("\n")
      parsed = extract_json(text)
      raise ProviderError, "response was not a JSON object" unless parsed.is_a?(Hash)

      parsed
    end

    class ProviderError < StandardError; end

    private

    def resolve_auth
      if (token = ENV["CLAUDE_CODE_OAUTH_TOKEN"] || ENV["ANTHROPIC_AUTH_TOKEN"])
        return { mode: :oauth, token: token } unless token.empty?
      end
      if (key = ENV["ANTHROPIC_API_KEY"])
        return { mode: :api_key, token: key } unless key.empty?
      end
      nil
    end

    def system_blocks(target_lang)
      instructions = <<~PROMPT
        You are a professional technical translator for a software documentation website (Jekyll theme, Docker tooling, developer blog).
        Translate the values of the JSON object the user provides from English into the language with IETF code "#{target_lang}".

        Rules:
        - Respond with ONLY a JSON object — no prose, no markdown fences — containing exactly the same keys; each value is the translation of the source value.
        - Values are Markdown fragments. Preserve all Markdown/HTML syntax characters (#, *, -, >, |, [ ], ( ), :, emphasis markers) in their structural roles.
        - Tokens like ⟦12⟧ are protected placeholders. Reproduce every placeholder EXACTLY as it appears, positioned where its content belongs in the translated sentence. Never translate, alter, merge, or drop a placeholder.
        - Do not translate: code, shell commands, file paths, URLs, configuration keys, or product/proper names (Jekyll, Docker, Bootstrap, GitHub, Ruby, Obsidian, zer0-mistakes, ...).
        - Every value must stay on a single line (no newline characters) because the site enforces one paragraph per line.
        - Keys prefixed "fm:" are page metadata (title, description); keys prefixed "ui:" are short UI labels — translate them concisely. Keys prefixed "s" are body lines.
        - Use natural, idiomatic phrasing in the target language with a professional technical register.
      PROMPT

      blocks = []
      blocks << { type: "text", text: CLAUDE_CODE_IDENTITY } if @auth[:mode] == :oauth
      blocks << { type: "text", text: instructions }
      blocks
    end

    def build_payload(segments, target_lang, context)
      user_text = +"Context: #{context}\n\nTranslate these segments:\n"
      user_text << JSON.pretty_generate(segments)
      {
        model: @model,
        max_tokens: @max_tokens,
        system: system_blocks(target_lang),
        messages: [{ role: "user", content: user_text }],
      }
    end

    def headers
      base = { "content-type" => "application/json", "anthropic-version" => API_VERSION }
      if @auth[:mode] == :oauth
        base["authorization"] = "Bearer #{@auth[:token]}"
        base["anthropic-beta"] = OAUTH_BETA
      else
        base["x-api-key"] = @auth[:token]
      end
      base
    end

    def request_with_retries(payload)
      attempt = 0
      begin
        attempt += 1
        response = post(payload)
        code = response.code.to_i
        if [429, 500, 502, 503, 529].include?(code) && attempt < MAX_ATTEMPTS
          delay = (response["retry-after"]&.to_i&.positive? ? response["retry-after"].to_i : 2**attempt)
          Log.warn "API #{code}; retrying in #{delay}s (attempt #{attempt}/#{MAX_ATTEMPTS})"
          sleep delay
          raise RetryableError
        end
        body = JSON.parse(response.body)
        unless code == 200
          message = body.dig("error", "message") || response.body[0, 300]
          raise ProviderError, "Anthropic API #{code}: #{message}"
        end
        body
      rescue RetryableError
        retry
      rescue Errno::ECONNRESET, Net::OpenTimeout, Net::ReadTimeout, SocketError => e
        raise ProviderError, "network error: #{e.message}" unless attempt < MAX_ATTEMPTS

        sleep 2**attempt
        retry
      end
    end

    class RetryableError < StandardError; end

    def post(payload)
      http = Net::HTTP.new(ENDPOINT.host, ENDPOINT.port)
      http.use_ssl = true
      http.open_timeout = 30
      http.read_timeout = 300
      request = Net::HTTP::Post.new(ENDPOINT.request_uri, headers)
      request.body = JSON.generate(payload)
      http.request(request)
    end

    # Tolerate fences / stray prose around the JSON object: slicing from the
    # first "{" to the last "}" covers fenced responses too, without any
    # backtracking-prone regex over model-controlled text.
    def extract_json(text)
      clean = text.to_s
      first = clean.index("{")
      last = clean.rindex("}")
      return nil if first.nil? || last.nil? || last < first

      JSON.parse(clean[first..last])
    rescue JSON::ParserError
      nil
    end
  end

  # ----------------------------------------------------------------
  # Chunked, validated translation of a segment map
  # ----------------------------------------------------------------
  class Translator
    def initialize(provider, chunk_chars:, chunk_segments:)
      @provider = provider
      @chunk_chars = chunk_chars
      @chunk_segments = chunk_segments
    end

    # segments: { key => masked text }; returns { key => translated text }.
    # Raises TranslationError when a chunk cannot be validated after a retry.
    def translate_map(segments, target_lang, context)
      result = {}
      each_chunk(segments) do |chunk|
        result.merge!(translate_chunk(chunk, target_lang, context))
      end
      result
    end

    class TranslationError < StandardError; end

    private

    def each_chunk(segments)
      chunk = {}
      size = 0
      segments.each do |key, text|
        if !chunk.empty? && (size + text.length > @chunk_chars || chunk.size >= @chunk_segments)
          yield chunk
          chunk = {}
          size = 0
        end
        chunk[key] = text
        size += text.length
      end
      yield chunk unless chunk.empty?
    end

    def translate_chunk(chunk, target_lang, context, retried: false)
      output = @provider.translate(chunk, target_lang, context)
      validate!(chunk, output)
      output
    rescue TranslationError, ClaudeProvider::ProviderError => e
      raise TranslationError, e.message if retried

      Log.warn "chunk rejected (#{e.message}); retrying once"
      translate_chunk(chunk, target_lang, "#{context} | RETRY — previous attempt failed validation: #{e.message}. Follow the placeholder and single-line rules exactly.", retried: true)
    end

    def validate!(input, output)
      raise TranslationError, "provider returned #{output.class}" unless output.is_a?(Hash)

      missing = input.keys - output.keys
      raise TranslationError, "missing keys: #{missing.first(5).join(', ')}" unless missing.empty?

      input.each do |key, source|
        value = output[key]
        raise TranslationError, "#{key}: non-string value" unless value.is_a?(String)
        raise TranslationError, "#{key}: empty translation" if value.strip.empty? && !source.strip.empty?
        raise TranslationError, "#{key}: line break introduced" if value.include?("\n")

        expected = source.scan(PLACEHOLDER_RE).sort
        actual = value.scan(PLACEHOLDER_RE).sort
        raise TranslationError, "#{key}: placeholder mismatch" unless expected == actual
      end
    end
  end

  # ----------------------------------------------------------------
  # Manifest — generated map read by Liquid (toggle/hreflang) and by
  # this script for incremental change detection.
  # ----------------------------------------------------------------
  class Manifest
    attr_reader :data

    def initialize(root)
      @path = File.join(root, MANIFEST_REL)
      @data = load_data
    end

    def load_data
      if File.file?(@path)
        raw = File.read(@path, encoding: "bom|utf-8")
        loaded = YAML.safe_load(raw, permitted_classes: [Date, Time], aliases: true)
        return loaded if loaded.is_a?(Hash) && loaded["pages"].is_a?(Hash)
      end
      { "version" => 1, "pages" => {}, "ui_text" => {} }
    end

    def pages = @data["pages"]
    def ui_text = @data["ui_text"] ||= {}

    def entry_for(url)
      pages[url] ||= {}
    end

    def save(source_lang, languages)
      @data["version"] = 1
      @data["source_lang"] = source_lang
      @data["languages"] = languages
      @data["updated_at"] = Time.now.utc.iso8601
      @data["pages"] = pages.sort.to_h
      FileUtils.mkdir_p(File.dirname(@path))
      header = <<~HEADER
        # ================================================================
        # GENERATED FILE — do not edit by hand.
        # Maintained by scripts/translate.rb (see .github/workflows/translate.yml).
        # Maps each English page URL to its generated translations; read by
        # _includes/components/language-toggle.html and _includes/core/hreflang.html.
        # ================================================================
      HEADER
      File.write(@path, header + @data.to_yaml.sub(/\A---\n/, ""))
    end
  end

  # ----------------------------------------------------------------
  # A single translatable source page
  # ----------------------------------------------------------------
  class SourceFile
    FRONT_MATTER_RE = /\A---\s*\n(.*?)\n---\s*\n?/m

    attr_reader :rel_path, :collection, :output_area, :error

    def initialize(root, rel_path, collection:, output_area:)
      @root = root
      @rel_path = rel_path
      @collection = collection
      @output_area = output_area
      @raw = File.read(File.join(root, rel_path), encoding: "bom|utf-8")
      if (m = @raw.match(FRONT_MATTER_RE))
        @front_matter = YAML.safe_load(m[1], permitted_classes: [Date, Time], aliases: true) || {}
        @body = m.post_match
      else
        @front_matter = nil
        @body = @raw
      end
    rescue Psych::Exception => e
      @front_matter = nil
      @error = "front matter parse error: #{e.message}"
    end

    def front_matter = @front_matter || {}
    def body = @body.to_s

    def translatable?
      return false unless @front_matter.is_a?(Hash)
      return false if front_matter["published"] == false
      return false if front_matter["translate"] == false
      return false if front_matter["lang"] && front_matter["lang"].to_s[0, 2] != "en"

      true
    end

    def sha
      @sha ||= Digest::SHA256.hexdigest(@raw)
    end

    # Path of the generated translation, mirroring subfolders within the
    # collection: pages/_posts/a.md -> <lang>/posts/a.md
    def output_rel_path(lang, collections_dir)
      prefix = File.join(*[collections_dir, "_#{collection}"].reject(&:empty?))
      inner = rel_path.delete_prefix("#{prefix}/")
      File.join(lang, output_area, inner)
    end
  end

  # ----------------------------------------------------------------
  # Local credential wiring: load KEY=VALUE pairs from the repo-root
  # .env (gitignored) so `claude setup-token` credentials work for
  # local runs — the same file the chat dev proxy reads. Real
  # environment variables always win; values are never logged.
  # ----------------------------------------------------------------
  module DotEnv
    def self.load(root)
      path = File.join(root, ".env")
      return unless File.file?(path)

      File.foreach(path, encoding: "bom|utf-8") do |line|
        line = line.strip
        next if line.empty? || line.start_with?("#")

        key, _, value = line.partition("=")
        key = key.sub(/\Aexport\s+/, "").strip
        next unless key.match?(/\A[A-Za-z_][A-Za-z0-9_]*\z/)
        next if ENV.key?(key) # real environment always wins

        ENV[key] = value.strip.gsub(/\A["']|["']\z/, "")
      end
    end
  end

  # ----------------------------------------------------------------
  # CLI / orchestration
  # ----------------------------------------------------------------
  class CLI
    def initialize(argv)
      @options = {
        root: Dir.pwd, mode: :incremental, dry_run: false, check: false,
        provider: nil, model: nil, langs: nil, limit: nil, verbose: false
      }
      parse(argv)
      Log.verbose = @options[:verbose]
      @root = File.expand_path(@options[:root])
      DotEnv.load(@root)
      @site_config = load_yaml(File.join(@root, "_config.yml")) || {}
      @config = DEFAULT_CONFIG.merge(@site_config["translation"] || {})
      @config["languages"] = @options[:langs] if @options[:langs]
      @url_builder = UrlBuilder.new(@site_config)
      @manifest = Manifest.new(@root)
      @stats = Hash.new(0)
    end

    def run
      languages = Array(@config["languages"]).map(&:to_s)
      source_lang = @config["source_lang"] || "en"
      if languages.empty?
        Log.info "No target languages configured (translation.languages) — nothing to do."
        return 0
      end
      bad = languages.reject { |l| l.match?(/\A[a-z]{2}(-[A-Za-z]{2})?\z/) }
      raise "invalid language code(s): #{bad.join(', ')}" unless bad.empty?

      sources = discover_sources
      plan = build_plan(sources, languages)
      report_plan(plan, sources.size, languages)

      return check_result(plan) if @options[:check]
      if plan.empty? && !prune_needed?(sources, languages)
        Log.info "Everything is up to date."
        return 0
      end
      if @options[:dry_run]
        Log.info "Dry run — no API calls made, no files written."
        return 0
      end

      translator = build_translator
      execute(plan, translator)
      prune(sources, languages)
      @manifest.save(source_lang, languages)
      summary
      @stats[:failed].positive? ? 1 : 0
    end

    private

    # -- planning ---------------------------------------------------

    Job = Struct.new(:type, :source, :lang, :url, keyword_init: true)

    def discover_sources
      collections_dir = @site_config["collections_dir"].to_s
      list = []
      Array(@config["sources"]).each do |src|
        dir = src["path"].to_s
        area = src["output"] || File.basename(dir).delete_prefix("_")
        collection = File.basename(dir).delete_prefix("_")
        Dir.glob(File.join(@root, dir, "**", "*.{md,markdown}")).sort.each do |abs|
          rel = abs.delete_prefix("#{@root}/")
          next if excluded?(rel)

          next unless matches_only_filter?(rel)

          file = SourceFile.new(@root, rel, collection: collection, output_area: area)
          if file.error
            Log.warn "#{rel}: #{file.error} — skipped"
            next
          end
          next unless file.translatable?

          list << file
        end
      end
      @collections_dir = collections_dir
      list
    end

    def excluded?(rel)
      Array(@config["exclude"]).any? do |pattern|
        File.fnmatch?(pattern, rel, File::FNM_PATHNAME | File::FNM_DOTMATCH) ||
          File.fnmatch?(pattern, rel)
      end
    end

    # --only accepts a glob or plain substring of the source path.
    def matches_only_filter?(rel)
      pattern = @options[:only]
      return true unless pattern

      File.fnmatch?(pattern, rel) || rel.include?(pattern)
    end

    def build_plan(sources, languages)
      plan = []
      sources.each do |file|
        url = @url_builder.url_for(file.rel_path, file.front_matter, file.collection)
        unless url
          Log.warn "#{file.rel_path}: could not resolve permalink template — skipped"
          next
        end
        entry = @manifest.pages[url]
        languages.each do |lang|
          state = entry && entry[lang]
          out_path = file.output_rel_path(lang, @collections_dir)
          stale = @options[:mode] == :full ||
                  state.nil? ||
                  state["sha"] != file.sha ||
                  !File.file?(File.join(@root, out_path))
          plan << Job.new(type: :page, source: file, lang: lang, url: url) if stale
        end
      end
      plan.concat(ui_text_jobs(languages))
      plan = plan.first(@options[:limit]) if @options[:limit]
      plan
    end

    def ui_text_jobs(languages)
      return [] unless @config["ui_text"]

      strings = ui_text_strings
      return [] if strings.empty?

      sha = Digest::SHA256.hexdigest(JSON.generate(strings.sort.to_h))
      languages.filter_map do |lang|
        state = @manifest.ui_text[lang]
        out = File.join(@root, "_data", "i18n", "#{lang}.yml")
        next if @options[:mode] != :full && state && state["sha"] == sha && File.file?(out)

        Job.new(type: :ui_text, source: sha, lang: lang, url: nil)
      end
    end

    def ui_text_strings
      @ui_text_strings ||= begin
        path = File.join(@root, UI_TEXT_REL)
        data = File.file?(path) ? load_yaml(path) : nil
        en = data && (data[@config["source_lang"]] || data["en"])
        en.is_a?(Hash) ? en.select { |_k, v| v.is_a?(String) && !v.strip.empty? } : {}
      end
    end

    def report_plan(plan, source_count, languages)
      pages = plan.count { |j| j.type == :page }
      ui = plan.count { |j| j.type == :ui_text }
      Log.info "Translation plan: #{source_count} source page(s) × #{languages.join(', ')} → " \
               "#{pages} page translation(s) + #{ui} UI-string set(s) needed " \
               "(mode: #{@options[:mode]}#{@options[:limit] ? ", limit: #{@options[:limit]}" : ''})"
      plan.first(20).each do |job|
        label = job.type == :page ? job.source.rel_path : "_data/ui-text.yml"
        Log.debug "→ [#{job.lang}] #{label}"
      end
    end

    def check_result(plan)
      if plan.empty?
        Log.info "--check: translations are up to date."
        0
      else
        Log.info "--check: #{plan.size} translation job(s) pending. Run the translate workflow."
        1
      end
    end

    # -- execution --------------------------------------------------

    def build_translator
      provider_name = @options[:provider] || @config["provider"] || "claude"
      provider =
        case provider_name
        when "stub" then StubProvider.new
        when "claude"
          ClaudeProvider.new(
            model: @options[:model] || ENV["TRANSLATE_MODEL"] || @config["model"],
            max_tokens: @config["max_tokens"].to_i,
          )
        else
          raise "unknown provider: #{provider_name}"
        end
      Log.info "Provider: #{provider.name}"
      Translator.new(provider,
                     chunk_chars: @config["max_chunk_chars"].to_i,
                     chunk_segments: @config["max_chunk_segments"].to_i)
    end

    def execute(plan, translator)
      plan.each do |job|
        case job.type
        when :page then translate_page(job, translator)
        when :ui_text then translate_ui_text(job, translator)
        end
      rescue Translator::TranslationError, ClaudeProvider::ProviderError => e
        label = job.type == :page ? job.source.rel_path : "ui-text"
        Log.error "[#{job.lang}] #{label}: #{e.message}"
        @stats[:failed] += 1
      end
    end

    def translate_page(job, translator)
      file = job.source
      segmenter = Segmenter.new(file.body)
      segments = segmenter.segments.to_h { |s| [s.key, s.text] }

      fm_masker = Masker.new
      FRONT_MATTER_FIELDS.each do |field|
        value = file.front_matter[field]
        segments["fm:#{field}"] = fm_masker.mask_line(value) if value.is_a?(String) && !value.strip.empty?
      end

      context = "Page \"#{file.front_matter['title']}\" (#{file.rel_path}) from the zer0-mistakes Jekyll theme site."
      translated = segments.empty? ? {} : translator.translate_map(segments, job.lang, context)

      out_rel = file.output_rel_path(job.lang, @collections_dir)
      write_page(file, job, translated, segmenter, fm_masker, out_rel)

      entry = @manifest.entry_for(job.url)
      entry["source"] = file.rel_path
      entry["sha"] = file.sha
      entry[job.lang] = {
        "url" => "/#{job.lang}#{job.url}",
        "path" => out_rel,
        "sha" => file.sha,
        "translated_at" => Time.now.utc.iso8601,
        "prompt_version" => PROMPT_VERSION,
      }
      @stats[:pages] += 1
      Log.info "  ✓ [#{job.lang}] #{file.rel_path} → #{out_rel}"
    end

    def write_page(file, job, translated, segmenter, fm_masker, out_rel)
      fm = file.front_matter.reject { |k, _| FRONT_MATTER_DROP.include?(k) }
      FRONT_MATTER_FIELDS.each do |field|
        key = "fm:#{field}"
        fm[field] = fm_masker.unmask(translated[key]) if translated.key?(key)
      end
      fm["lang"] = job.lang
      fm["permalink"] = "/#{job.lang}#{job.url}"
      fm["translation_of"] = file.rel_path
      fm["translation_source_url"] = job.url
      fm["machine_translated"] = true
      fm["translated_from_sha"] = file.sha[0, 12]

      body_out = segmenter.reassemble(
        segmenter.segments.to_h { |s| [s.key, translated.fetch(s.key, s.text)] },
      )

      abs = File.join(@root, out_rel)
      FileUtils.mkdir_p(File.dirname(abs))
      File.write(abs, "#{fm.to_yaml}---\n\n#{body_out.sub(/\A\n+/, '')}")
    end

    def translate_ui_text(job, translator)
      strings = ui_text_strings
      masker = Masker.new
      segments = strings.transform_values { |v| masker.mask_line(v) }
                        .transform_keys { |k| "ui:#{k}" }
      context = "Short UI labels for the zer0-mistakes Jekyll theme (navigation, search, footer)."
      translated = translator.translate_map(segments, job.lang, context)

      out = strings.keys.to_h { |k| [k, masker.unmask(translated.fetch("ui:#{k}"))] }
      path = File.join(@root, "_data", "i18n", "#{job.lang}.yml")
      FileUtils.mkdir_p(File.dirname(path))
      header = <<~HEADER
        # ================================================================
        # GENERATED FILE — do not edit by hand.
        # Machine-translated UI strings (#{job.lang}) produced by
        # scripts/translate.rb from _data/ui-text.yml (en). Regenerate via
        # the Translate workflow or: ruby scripts/translate.rb --langs #{job.lang}
        # ================================================================
      HEADER
      File.write(path, header + out.to_yaml.sub(/\A---\n/, ""))

      @manifest.ui_text[job.lang] = {
        "sha" => job.source,
        "translated_at" => Time.now.utc.iso8601,
        "prompt_version" => PROMPT_VERSION,
      }
      @stats[:ui] += 1
      Log.info "  ✓ [#{job.lang}] UI strings → _data/i18n/#{job.lang}.yml"
    end

    # -- pruning ----------------------------------------------------

    def orphaned_urls(sources, _languages)
      live = sources.filter_map { |f| @url_builder.url_for(f.rel_path, f.front_matter, f.collection) }
      @manifest.pages.keys - live
    end

    def prune_needed?(sources, languages)
      orphaned_urls(sources, languages).any?
    end

    def prune(sources, languages)
      orphaned_urls(sources, languages).each do |url|
        entry = @manifest.pages.delete(url)
        languages.each do |lang|
          path = entry.dig(lang, "path")
          next unless path

          abs = File.join(@root, path)
          # Only ever delete inside a language output root.
          if abs.start_with?(File.join(@root, lang, "")) && File.file?(abs)
            File.delete(abs)
            Log.info "  ✗ pruned #{path} (source removed)"
            @stats[:pruned] += 1
          end
        end
      end
    end

    def summary
      Log.info "Done: #{@stats[:pages]} page(s), #{@stats[:ui]} UI set(s) translated; " \
               "#{@stats[:pruned]} pruned; #{@stats[:failed]} failed."
    end

    # -- plumbing ---------------------------------------------------

    def load_yaml(path)
      YAML.safe_load(File.read(path, encoding: "bom|utf-8"),
                     permitted_classes: [Date, Time], aliases: true)
    rescue Psych::Exception => e
      raise "failed to parse #{path}: #{e.message}"
    end

    def parse(argv)
      OptionParser.new do |o|
        o.banner = "Usage: ruby scripts/translate.rb [options]"
        o.on("--full", "Retranslate everything (ignore manifest state)") { @options[:mode] = :full }
        o.on("--incremental", "Translate only new/changed sources (default)") { @options[:mode] = :incremental }
        o.on("--check", "Report pending translations; exit 1 if any (no API calls)") { @options[:check] = true }
        o.on("-n", "--dry-run", "Plan only; no API calls, no writes") { @options[:dry_run] = true }
        o.on("--langs LANGS", "Comma-separated target languages (overrides config)") { |v| @options[:langs] = v.split(",").map(&:strip) }
        o.on("--only PATTERN", "Only sources matching this glob/substring") { |v| @options[:only] = v }
        o.on("--limit N", Integer, "Cap the number of translation jobs this run") { |v| @options[:limit] = v }
        o.on("--provider NAME", "claude | stub (overrides config)") { |v| @options[:provider] = v }
        o.on("--model MODEL", "Override the Claude model") { |v| @options[:model] = v }
        o.on("--root PATH", "Repo root (default: cwd; used by tests)") { |v| @options[:root] = v }
        o.on("-V", "--verbose", "Extra logging") { @options[:verbose] = true }
        o.on("-v", "--version", "Print version") { puts VERSION; exit 0 }
        o.on("-h", "--help", "Show this help") { puts o; exit 0 }
      end.parse!(argv)
    end
  end
end

if $PROGRAM_NAME == __FILE__
  begin
    exit Zer0Translate::CLI.new(ARGV).run
  rescue StandardError => e
    Zer0Translate::Log.error e.message
    Zer0Translate::Log.debug e.backtrace.join("\n") if Zer0Translate::Log.verbose
    exit 1
  end
end
