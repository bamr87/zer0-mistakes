#!/usr/bin/env ruby
# frozen_string_literal: true
#
# test_ruby_converter.rb — Standalone unit test for _plugins/obsidian_links.rb
#
# Invokes the converter directly (without booting Jekyll) so we can validate
# the regex-driven transformations in isolation. This matters because the
# `github-pages` gem prevents the plugin from running inside the default
# Jekyll build (`safe: true` + overridden `plugins_dir`), but the same
# converter is reused by anyone self-building without `github-pages`.
#

require 'minitest/autorun'

# Stub out Jekyll just enough that requiring the plugin doesn't crash.
module Jekyll
  module Hooks
    def self.register(*); end
  end

  class Logger
    def info(*); end
    def warn(*); end
  end

  def self.logger
    @logger ||= Logger.new
  end
end

require_relative '../_plugins/obsidian_links'

# Fake document just rich enough for the Index to consume.
FakeDoc = Struct.new(:data, :url, :relative_path, :collection_label) do
  def collection
    return nil unless collection_label
    Struct.new(:label).new(collection_label)
  end
end

class ObsidianConverterTest < Minitest::Test
  def setup
    @docs = [
      FakeDoc.new(
        { 'title' => 'Markdown Formatting Tips', 'aliases' => ['Markdown Tips'] },
        '/notes/markdown-tips/',
        '_notes/markdown-tips.md',
        'notes'
      ),
      FakeDoc.new(
        { 'title' => 'Docker Commands', 'aliases' => [] },
        '/notes/docker-commands/',
        '_notes/docker-commands.md',
        'notes'
      ),
    ]
    site_double = Struct.new(:documents, :pages, :config).new(@docs, [], {})
    @index = Jekyll::Obsidian::Index.new(site_double)
    @config = Jekyll::Obsidian::DEFAULT_CONFIG.dup
    @converter = Jekyll::Obsidian::Converter.new(nil, @index, @config)
  end

  def convert(md)
    @converter.convert(md)
  end

  # ---- Wiki-links --------------------------------------------------------
  def test_resolved_wiki_link
    out = convert('See [[Markdown Formatting Tips]] for details.')
    assert_match(/class="wiki-link"/, out)
    assert_match(%r{href="/notes/markdown-tips/"}, out)
    assert_match(/data-wiki-target="Markdown Formatting Tips"/, out)
  end

  def test_alias_wiki_link
    out = convert('See [[Markdown Formatting Tips|the cheatsheet]].')
    assert_match(/>the cheatsheet</, out)
    assert_match(%r{href="/notes/markdown-tips/"}, out)
  end

  def test_alias_lookup_via_aliases
    out = convert('Resolves via alias key: [[Markdown Tips]]')
    assert_match(%r{href="/notes/markdown-tips/"}, out)
  end

  def test_header_anchor
    out = convert('Jump to [[Markdown Formatting Tips#Basic Formatting]].')
    assert_match(/#basic-formatting/, out)
  end

  def test_unresolved_wiki_link
    out = convert('Broken [[Definitely Not Real]] link.')
    assert_match(/class="wiki-link wiki-link-broken"/, out)
    assert_match(/data-wiki-target="Definitely Not Real"/, out)
  end

  def test_wiki_link_inside_code_block_is_preserved
    md = "Plain text\n\n```\nliteral [[Markdown Formatting Tips]] inside fence\n```\n"
    out = convert(md)
    assert_match(/literal \[\[Markdown Formatting Tips\]\] inside fence/, out)
    refute_match(/href="\/notes\/markdown-tips\/" class="wiki-link" data-wiki-target="Markdown Formatting Tips"[^>]*>inside fence/, out)
  end

  def test_wiki_link_inside_inline_code_is_preserved
    out = convert('See `[[Markdown Formatting Tips]]` literally.')
    assert_match(/`\[\[Markdown Formatting Tips\]\]`/, out)
  end

  # ---- Embeds ------------------------------------------------------------
  def test_image_embed_with_width
    out = convert('![[diagram.png|320]]')
    assert_match(/<img /, out)
    assert_match(/ width="320"/, out)
    assert_match(/class="obsidian-embed obsidian-embed-image"/, out)
  end

  def test_image_embed_default_attachments_path
    out = convert('![[diagram.png]]')
    assert_match(%r{src="/assets/images/notes/diagram\.png"}, out)
  end

  def test_note_embed_resolved
    out = convert('![[Docker Commands]]')
    assert_match(/include content\/transclude\.html/, out)
    assert_match(/url="\/notes\/docker-commands\/"/, out)
  end

  def test_note_embed_missing
    out = convert('![[ghost-note]]')
    assert_match(/obsidian-embed-broken/, out)
  end

  # ---- Callouts ----------------------------------------------------------
  def test_callout_note
    out = convert("> [!note] Heads up\n> body line one\n> body line two\n")
    assert_match(/obsidian-callout obsidian-callout-note/, out)
    assert_match(/alert alert-primary/, out)
    assert_match(/Heads up/, out)
    assert_match(/role="alert"/, out)
  end

  def test_callout_warning_with_fold_marker
    out = convert("> [!warning]+ Foldable\n> body\n")
    assert_match(/obsidian-callout-warning/, out)
    refute_match(/data-collapsed="true"/, out, 'plus marker should NOT collapse')
  end

  def test_callout_collapsed
    out = convert("> [!tip]- Closed by default\n> hidden body\n")
    assert_match(/data-collapsed="true"/, out)
  end

  def test_callout_unknown_type_falls_back_to_note
    out = convert("> [!nonsense] Title\n> body\n")
    assert_match(/obsidian-callout-nonsense/, out)
    assert_match(/alert alert-primary/, out)
  end

  # ---- Tags --------------------------------------------------------------
  def test_inline_tag
    out = convert('Tagged with #obsidian and #fixture/example.')
    assert_match(/class="obsidian-tag">#obsidian/, out)
    assert_match(/class="obsidian-tag">#fixture\/example/, out)
  end

  def test_tag_inside_code_skipped
    out = convert('See `#not-a-tag` and a real #real-tag.')
    assert_match(/`#not-a-tag`/, out)
    assert_match(/class="obsidian-tag">#real-tag/, out)
  end

  # ---- Regression: plain markdown is unchanged ---------------------------
  def test_plain_markdown_unchanged
    plain = "## Heading\n\nA regular paragraph with [a link](https://example.com) and **bold**.\n\n> a normal quote\n"
    assert_equal plain, convert(plain)
  end
end
