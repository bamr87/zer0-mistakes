#!/usr/bin/env ruby
# frozen_string_literal: true

# ---------------------------------------------------------------------------
# lint-liquid-raw — guard the Markdown the Pages build renders through Liquid
#
# `github-pages` ships jekyll-optional-front-matter, so EVERY non-excluded
# Markdown file in the repo becomes a page — CHANGELOG.md and the
# _design-system/ mirror included — and every one of them is run through Liquid
# before Markdown. Two failure modes follow, and neither is loud:
#
#   1. An unbalanced `{% raw %}`. Liquid's raw block swallows everything up to
#      the FIRST `{% endraw %}`, so a stray opener silently eats the rest of the
#      document. CHANGELOG.md carried one that consumed 945 lines while the
#      build stayed green.
#
#   2. A literal `{% raw %}` / `{% endraw %}` written as documentation prose.
#      It reads like text but parses as a tag, which is how (1) happens. To show
#      the tag, escape it: `{% raw %}{% raw %}{% endraw %}`.
#
# A Liquid *syntax* error (e.g. `{{…}}`) is caught by the Pages workflow, which
# fails on "Liquid Warning" in the build output. This script catches the class
# the build cannot report, because swallowed text is not an error to Liquid.
#
# Usage:
#   scripts/lint-liquid-raw.rb            # scan the rendered Markdown surface
#   scripts/lint-liquid-raw.rb PATH...    # scan specific files
#   scripts/lint-liquid-raw.rb --verbose  # list every file scanned
# ---------------------------------------------------------------------------

ROOT = File.expand_path('..', __dir__)
TAG = /\{%-?\s*(raw|endraw)\s*-?%\}/.freeze

# The escape form: a raw block whose entire body is one raw/endraw tag, which
# is how you render the tag as text. Blanked before scanning so the literal it
# carries is not mistaken for a real tag.
ESCAPED = /\{%-?\s*raw\s*-?%\}\{%-?\s*(?:raw|endraw)\s*-?%\}\{%-?\s*endraw\s*-?%\}/.freeze

# Directories Jekyll never reads, plus the ones _config.yml excludes. Kept in
# sync with the `exclude:` list; a path missing here only costs a false
# positive, never a missed one.
SKIP_DIRS = %w[
  .git .github .claude .cursor .devcontainer .frontmatter .vscode .obsidian
  .jekyll-cache .sass-cache _site node_modules vendor pkg logs
  docs scripts templates test tests examples submodules gemfiles docker lib
].freeze

# True when `pos` sits inside a single-backtick code span: an odd number of
# backtick runs precede it on its own line.
def in_code_span?(text, pos)
  bol = text.rindex("\n", pos - 1)
  line = text[(bol ? bol + 1 : 0)...pos]
  line.scan(/`+/).size.odd?
end

def scan(path)
  # Blank the escape form (keeping byte offsets and newlines) so the literal
  # tag it renders is not read as a tag itself.
  text = File.read(path, encoding: 'UTF-8')
             .gsub(ESCAPED) { |m| ' ' * m.length }
  problems = []
  in_raw = false
  opened_at = nil
  opened_in_span = false

  text.to_enum(:scan, TAG).each do
    match = Regexp.last_match
    line = text[0, match.begin(0)].count("\n") + 1
    if in_raw
      # Inside a raw block every tag is literal text — nothing to check.
      if match[1] == 'endraw'
        if opened_in_span && line != opened_at
          problems << "#{path}:#{opened_at}: `{% raw %}` inside a code span " \
                      "opens a block that only closes at line #{line} — " \
                      'escape it to show the tag as text'
        end
        in_raw = false
        opened_at = nil
        opened_in_span = false
      end
      next
    end

    if match[1] == 'raw'
      in_raw = true
      opened_at = line
      # `{% raw %}` inside an inline code span is the documentation-mention
      # trap: it reads as text but opens a real block. Legitimate inline use
      # (`{% raw %}{{ x }}{% endraw %}`) closes on the same line; a mention
      # does not, and swallows everything up to the next `{% endraw %}`.
      opened_in_span = in_code_span?(text, match.begin(0))
    else
      problems << "#{path}:#{line}: `{% endraw %}` with no matching `{% raw %}`"
    end
  end

  if in_raw
    problems << "#{path}:#{opened_at}: `{% raw %}` is never closed — " \
                'Liquid will swallow the rest of the file'
  end
  problems
rescue ArgumentError, Encoding::InvalidByteSequenceError => e
  ["#{path}: could not read as UTF-8 (#{e.class})"]
end

def markdown_files
  Dir.chdir(ROOT) do
    Dir.glob('**/*.{md,markdown}', File::FNM_DOTMATCH).reject do |p|
      p.split(File::SEPARATOR).any? { |seg| SKIP_DIRS.include?(seg) }
    end.sort
  end
end

verbose = ARGV.delete('--verbose')
targets = ARGV.empty? ? markdown_files : ARGV

problems = []
Dir.chdir(ROOT) do
  targets.each do |path|
    next unless File.file?(path)

    warn "  scanning #{path}" if verbose
    problems.concat(scan(path))
  end
end

if problems.empty?
  puts "✓ lint-liquid-raw: #{targets.size} Markdown files, all " \
       '`{% raw %}` blocks balanced'
  exit 0
end

warn '✗ lint-liquid-raw: unbalanced Liquid raw blocks'
problems.each { |p| warn "  #{p}" }
warn ''
warn 'To display a literal tag, escape it: `{% raw %}{% raw %}{% endraw %}`'
exit 1
