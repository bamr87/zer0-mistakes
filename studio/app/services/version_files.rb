# frozen_string_literal: true

# The files that must carry the same version string. lib/.../version.rb is
# the source of truth (scripts/bin/release bumps it); release-please and the
# manifest script keep the others in step, and this table shows when one
# falls behind.
module VersionFiles
  CANONICAL = ThemeRoot::VERSION_FILE
  FILES = [
    [ "lib/jekyll-theme-zer0/version.rb", /VERSION\s*=\s*"([^"]+)"/ ],
    [ "package.json", /"version":\s*"([^"]+)"/ ],
    [ "package-lock.json", /"version":\s*"([^"]+)"/ ],
    [ ".release-please-manifest.json", /"\.":\s*"([^"]+)"/ ],
    [ "_data/theme-manifest.yml", /^version:\s*"?([^"\s]+)"?/ ],
    [ "CHANGELOG.md", /^## \[?(\d+\.\d+\.\d+)/ ]
  ].freeze

  Row = Struct.new(:file, :version, :present, :canonical, keyword_init: true) do
    def ok?
      present && version == canonical
    end
  end

  module_function

  def read(theme: ThemeRoot)
    canonical = theme.version
    FILES.map do |file, pattern|
      text = theme.confined.read(file).first
      Row.new(file: file, version: text[pattern, 1], present: true, canonical: canonical)
    rescue ConfinedPath::Refused
      Row.new(file: file, version: nil, present: false, canonical: canonical)
    end
  end
end
