# frozen_string_literal: true

require "open3"
require "tempfile"

# A unified diff of two texts, for the "what would this save change" preview
# under every editor. The system `diff` does the work (it is in every image
# and runner the studio uses); without it the diff is a plain before/after.
module UnifiedDiff
  module_function

  def of(before, after, label)
    return "" if before == after

    a = Tempfile.new("studio-a")
    b = Tempfile.new("studio-b")
    a.write(before)
    b.write(after)
    a.flush
    b.flush
    out, _status = Open3.capture2("diff", "-u", "--label", "a/#{label}", "--label", "b/#{label}", a.path, b.path)
    out.force_encoding(Encoding::UTF_8).scrub
  rescue Errno::ENOENT
    "--- a/#{label}\n+++ b/#{label}\n(diff is not installed; before and after follow)\n#{before}\n=====\n#{after}"
  ensure
    a&.close!
    b&.close!
  end
end
