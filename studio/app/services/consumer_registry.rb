# frozen_string_literal: true

require "yaml"

# _data/consumers.yml, read: every site that renders with the theme, how it
# consumes it and where its pin lives. The studio joins these rows to the
# checkouts it has registered by repository basename, and never writes the
# file.
class ConsumerRegistry
  FILE = "_data/consumers.yml"

  Entry = Struct.new(:repo, :mode, :site_url, :dispatch, :risk, :pins, :stack, keyword_init: true) do
    def name
      repo.to_s.split("/").last
    end

    def pinned?
      mode.to_s == "remote_theme_pinned" || mode.to_s == "gem"
    end
  end

  attr_reader :entries, :defaults

  def self.load(theme: ThemeRoot)
    new(theme.confined.read(FILE).first)
  rescue ConfinedPath::NotFound
    new("")
  end

  def initialize(text)
    data = YAML.safe_load(text) || {}
    @defaults = data["defaults"] || {}
    @entries = Array(data["consumers"]).map do |row|
      Entry.new(repo: row["repo"], mode: row["mode"], site_url: row["site"], dispatch: row["dispatch"],
                risk: row["risk"].to_s.strip, pins: Array(row["pins"]), stack: row["stack"] || {})
    end
  rescue Psych::SyntaxError => e
    raise ArgumentError, "#{FILE}: #{e.message}"
  end

  def find(name_or_repo)
    key = name_or_repo.to_s
    entries.find { |e| e.repo == key || e.name == key }
  end

  def by_mode
    entries.group_by { |e| e.mode.to_s }
  end
end
