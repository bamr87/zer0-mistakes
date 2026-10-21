# frozen_string_literal: true

# Where consumer sites may live: SITES_DIR, else the theme's examples/. A
# site is a directory strictly inside it (one or two levels down) that holds
# a _config.yml; registration confines the path with realpath so a symlink
# cannot point the studio elsewhere.
module SitesRoot
  module_function

  def path
    Pathname.new(File.expand_path(ENV["SITES_DIR"].presence || ThemeRoot.path.join("examples").to_s))
  end

  def real
    Pathname.new(File.realpath(path.to_s))
  rescue SystemCallError
    nil
  end

  # Site directories under the root that are not yet registered.
  def discover(registered = [])
    root = real or return []
    known = registered.map(&:to_s).to_set
    configs = Pathname.glob(root.join("*/_config.yml")) + Pathname.glob(root.join("*/*/_config.yml"))
    configs.map { |cfg| cfg.dirname.to_s }.uniq.reject { |p| known.include?(p) }.sort
  end

  # The realpath of a candidate site directory, or raises ConfinedPath::Refused.
  def confine!(candidate)
    root = real or raise ConfinedPath::Refused, "SITES_DIR #{path} does not exist"
    text = candidate.to_s
    raise ConfinedPath::Refused, "a site path must be absolute" unless text.start_with?("/")

    real_path = Pathname.new(File.realpath(text))
    raise ConfinedPath::Refused, "#{text} is not inside #{root}" unless real_path.to_s.start_with?("#{root}/")
    raise ConfinedPath::Refused, "#{text} has no _config.yml" unless real_path.join("_config.yml").file?

    real_path
  rescue SystemCallError
    raise ConfinedPath::Refused, "#{candidate} is not reachable"
  end
end
