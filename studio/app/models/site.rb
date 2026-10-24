# frozen_string_literal: true

# A registered consumer checkout. The row is an index of a directory under
# SITES_DIR — its name, how it consumes the theme, when it was last audited —
# and the directory stays the truth: the studio reads the site's files on
# every page and writes only the handful Site::WRITABLE names, through
# ConfinedPath and AtomicWrite.
class Site < ApplicationRecord
  MODES = %w[remote_theme_pinned remote_theme_floating gem path unknown].freeze

  # Consumer files the studio may rewrite.
  WRITABLE = %w[
    _config.yml
    assets/css/user-overrides.css
    assets/js/user-overrides.js
    _includes/custom/*.html
    .theme-overrides.yml
  ].freeze

  has_many :jobs, dependent: :nullify

  before_validation :confine_path, :derive_from_disk

  validates :name, presence: true
  validates :path, presence: true, uniqueness: true
  validates :mode, inclusion: { in: MODES }

  scope :named, -> { order(:name) }

  def root
    Pathname.new(path)
  end

  def confined
    ConfinedPath.new(root, writable: WRITABLE)
  end

  def config_text
    confined.read("_config.yml").first
  end

  def theme_pin
    config = config_text
    remote = BlockRewriter.scalar(config, "remote_theme").to_s.delete('"').delete("'")
    return remote unless remote.empty? || remote == "false"

    gemfile = root.join("Gemfile")
    return nil unless gemfile.file?

    gemfile.read[/gem\s+["']jekyll-theme-zer0["'][^\n]*/]
  rescue ConfinedPath::Refused
    nil
  end

  def consumer
    @consumer ||= ConsumerRegistry.load.find(repo.presence || name)
  rescue ArgumentError
    nil
  end

  def audit_summary
    last_audit_summary.is_a?(Hash) ? last_audit_summary : {}
  end

  private

  def confine_path
    return if path.blank?

    self.path = SitesRoot.confine!(path).to_s
  rescue ConfinedPath::Refused => e
    errors.add(:path, e.message)
  end

  def derive_from_disk
    return if path.blank? || errors[:path].any?

    self.name = File.basename(path) if name.blank?
    self.mode = detect_mode if mode.blank? || mode == "unknown"
    self.source_subdir = BlockRewriter.scalar(config_text, "source").to_s.delete('"') if source_subdir.blank?
  rescue ConfinedPath::Refused
    self.mode ||= "unknown"
  end

  def detect_mode
    config = config_text
    remote = BlockRewriter.scalar(config, "remote_theme").to_s.delete('"').delete("'")
    if remote.include?("zer0-mistakes")
      remote.include?("@") ? "remote_theme_pinned" : "remote_theme_floating"
    elsif (gemfile = root.join("Gemfile")).file? && (line = gemfile.read[/gem\s+["']jekyll-theme-zer0["'][^\n]*/])
      line.include?("path:") ? "path" : "gem"
    else
      "unknown"
    end
  end
end
