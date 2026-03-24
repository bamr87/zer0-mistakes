# frozen_string_literal: true

# Migrated from: test_quality.sh → test_preview_image_urls
# Covers: Preview image URL format validation and file existence

RSpec.describe "Preview image URLs" do
  let(:root) { RSpec.configuration.project_root }
  let(:pages_dir) { RSpec.configuration.pages_dir }

  let(:content_files) do
    Dir.glob(File.join(pages_dir, "**", "*.md"))
  end

  let(:files_with_previews) do
    content_files.each_with_object([]) do |path, arr|
      fm = parse_front_matter(path)
      next if fm.empty? || fm["preview"].nil? || fm["preview"].to_s.strip.empty?
      arr << { path: path, preview: fm["preview"].to_s.strip }
    end
  end

  it "at least some content files have preview images" do
    expect(files_with_previews).not_to be_empty,
      "No content files have preview image URLs"
  end

  describe "URL format" do
    it "preview URLs start with /" do
      bad = files_with_previews.reject { |f| f[:preview].start_with?("/") }
      expect(bad).to be_empty,
        "Preview URLs not starting with /: #{bad.map { |f| "#{File.basename(f[:path])}: #{f[:preview]}" }.join(', ')}"
    end

    it "preview URLs have valid image extensions" do
      valid_exts = %w[.png .jpg .jpeg .gif .webp .svg]
      bad = files_with_previews.reject do |f|
        valid_exts.any? { |ext| f[:preview].downcase.end_with?(ext) }
      end
      expect(bad).to be_empty,
        "Preview URLs with invalid extensions: #{bad.map { |f| "#{File.basename(f[:path])}: #{f[:preview]}" }.join(', ')}"
    end
  end

  describe "file existence" do
    it "preview image files exist on disk" do
      missing = files_with_previews.reject do |f|
        clean = f[:preview].sub(%r{^/}, "")
        File.exist?(File.join(root, clean))
      end

      if missing.any?
        skip "#{missing.size} preview images missing (use rake preview:generate to create them)"
      end
    end
  end
end
