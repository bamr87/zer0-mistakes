# frozen_string_literal: true

require "digest"
require "securerandom"

# The one way the studio changes a file. The caller passes the bytes it read
# (`original`) and the bytes it wants; the write refuses when the file no
# longer holds the original (someone saved it in an editor meanwhile), writes
# a temp file beside it with the same mode, fsyncs, re-checks, and renames.
# A `Stale` is a 409 to the browser; `Refused` a 422.
#
# Copied from zer0-CMS's PageEditor#write_atomically.
module AtomicWrite
  class Error < StandardError; end
  class Stale < Error; end
  class Refused < Error; end

  module_function

  def replace(path, original:, text:)
    path = Pathname.new(path)
    return if text.b == original.b

    ensure_unchanged!(path, original)
    mode = File.stat(path).mode & 0o7777
    tmp = path.dirname.join(".#{path.basename}.zer0-studio-#{SecureRandom.hex(6)}.tmp")
    File.open(tmp, File::WRONLY | File::CREAT | File::EXCL | File::BINARY, mode) do |file|
      file.binmode
      file.write(text.b)
      file.flush
      file.fsync
    end
    ensure_unchanged!(path, original)
    File.rename(tmp, path)
    tmp = nil
  rescue SystemCallError => e
    raise Refused, "could not write #{path.basename}: #{e.message}"
  ensure
    File.unlink(tmp) if tmp && File.exist?(tmp)
  end

  def ensure_unchanged!(path, original)
    return if File.binread(path) == original.b

    raise Stale, "#{path.basename} changed on disk while saving. Reload the page and make the edit again."
  end

  # The form carries the digest of the text it was rendered from; a submission
  # against a file that has since changed is refused before anything is parsed.
  def check_base!(name, base_digest, current_digest)
    return if base_digest.to_s == current_digest

    raise Stale, "#{name} changed since this form was opened. Reload the page and make the edit again."
  end

  def digest(text)
    Digest::SHA256.hexdigest(text.b)
  end
end
