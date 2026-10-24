# frozen_string_literal: true

require "digest"

# Resolves a root-relative path inside one directory for a read or a write.
#
# The path must name an existing regular file, reached without `..`, without
# an absolute prefix, and without a symlink at ANY component below the root;
# its realpath must then be inside the root's realpath. A write additionally
# needs the relative path to match one of the root's `writable` globs — the
# theme and a site each declare the handful of files the studio may rewrite,
# and everything else stays read-only whatever a form submits.
#
# Copied from zer0-CMS's SitePath and given the allow-list.
class ConfinedPath
  class Refused < StandardError; end
  class NotFound < Refused; end

  attr_reader :root, :writable

  def initialize(root, writable: [])
    @root = Pathname.new(File.realpath(root.to_s))
    @writable = writable.map(&:to_s)
  rescue SystemCallError
    raise NotFound, "the directory is not reachable"
  end

  def file!(relative)
    parts = segments!(relative)
    current = root
    parts.each do |part|
      current = current.join(part)
      raise Refused, "#{relative} goes through a symlink" if File.lstat(current).symlink?
    end
    raise Refused, "#{relative} is not a regular file" unless File.lstat(current).file?

    real = current.realpath
    raise Refused, "#{relative} resolves outside the directory" unless inside?(real)

    real
  rescue Errno::ENOENT, Errno::ENOTDIR
    raise NotFound, "#{relative} does not exist"
  rescue SystemCallError => e
    raise Refused, "#{relative} cannot be read (#{e.class.name.split('::').last})"
  end

  # True when the relative path names a directory inside the root, reached
  # with the same rules as file! (no symlink at any component).
  def directory?(relative)
    parts = segments!(relative)
    current = root
    parts.each do |part|
      current = current.join(part)
      return false if File.lstat(current).symlink?
    end
    File.lstat(current).directory? && inside?(current.realpath)
  rescue Refused, SystemCallError
    false
  end

  def writable!(relative)
    real = file!(relative)
    unless writable.any? { |pattern| File.fnmatch?(pattern, relative.to_s, File::FNM_PATHNAME) }
      raise Refused, "#{relative} is not a file the studio edits"
    end

    real
  end

  def exist?(relative)
    file!(relative)
    true
  rescue Refused
    false
  end

  # [text, sha256 digest] of a confined file, as UTF-8.
  def read(relative)
    text = File.binread(file!(relative))
    text.force_encoding(Encoding::UTF_8)
    raise Refused, "#{relative} is not valid UTF-8" unless text.valid_encoding?

    [text, Digest::SHA256.hexdigest(text.b)]
  end

  # The root-relative path for an absolute path under the root, or nil.
  def relative_for(absolute)
    text = absolute.to_s
    prefix = "#{root}/"
    text.start_with?(prefix) ? text.delete_prefix(prefix) : nil
  end

  def inside?(real)
    real.to_s.start_with?("#{root}/")
  end

  private

  def segments!(relative)
    text = relative.to_s
    parts = text.split("/", -1)
    if text.empty? || text.start_with?("/") || text.include?("\0") || parts.any? { |p| p.empty? || p == "." || p == ".." }
      raise Refused, "#{text.inspect} is not a plain path inside the directory"
    end

    parts
  end
end
