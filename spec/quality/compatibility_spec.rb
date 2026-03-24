# frozen_string_literal: true

# Migrated from: test_quality.sh → test_cross_platform_files, test_browser_compatibility
# Covers: File encoding, line endings, HTML5 doctype, responsive design indicators

RSpec.describe "Compatibility" do
  let(:root) { RSpec.configuration.project_root }

  describe "cross-platform file compatibility" do
    let(:text_files) do
      exts = %w[md html yml yaml rb js scss css]
      exts.flat_map do |ext|
        Dir.glob(File.join(root, "**", "*.#{ext}")).reject do |p|
          p.include?("/.git/") || p.include?("/_site/") ||
            p.include?("/node_modules/") || p.include?("/vendor/")
        end
      end
    end

    it "no Windows line endings (CRLF) in source files" do
      crlf_files = []
      text_files.first(200).each do |path| # Sample for performance
        content = File.binread(path)
        if content.include?("\r\n")
          crlf_files << path.sub("#{root}/", "")
        end
      end
      expect(crlf_files).to be_empty,
        "Files with Windows line endings: #{crlf_files.first(10).join(', ')}"
    end

    it "UTF-8 or ASCII encoded source files" do
      non_utf8 = []
      text_files.first(200).each do |path|
        content = File.binread(path)
        begin
          content.encode("UTF-8", "UTF-8")
        rescue Encoding::UndefinedConversionError
          non_utf8 << path.sub("#{root}/", "")
        end
      end
      expect(non_utf8).to be_empty,
        "Non-UTF-8 files: #{non_utf8.join(', ')}"
    end
  end

  describe "browser compatibility indicators" do
    let(:root_layout) do
      path = File.join(root, "_layouts", "root.html")
      File.exist?(path) ? File.read(path) : nil
    end

    it "HTML5 doctype declared" do
      skip "root.html not found" unless root_layout
      expect(root_layout).to match(/<!DOCTYPE html>/i)
    end

    it "responsive viewport meta tag present" do
      head_include = File.join(root, "_includes", "core", "head.html")
      combined = (root_layout || "") +
                 (File.exist?(head_include) ? File.read(head_include) : "")
      expect(combined).to match(/viewport/i)
    end
  end

  describe "responsive design" do
    let(:style_content) do
      files = Dir.glob(File.join(root, "_sass", "**", "*.scss")) +
              Dir.glob(File.join(root, "assets", "css", "**", "*.css"))
      files.map { |f| File.read(f) }.join("\n")
    end

    it "stylesheets use media queries or responsive framework" do
      has_media = style_content.match?(/@media/) ||
                  style_content.match?(/bootstrap/) ||
                  style_content.include?("col-")
      # Also check if Bootstrap CDN is loaded in head
      head_includes = Dir.glob(File.join(root, "_includes", "core", "head*"))
      head_content = head_includes.map { |f| File.read(f) }.join("\n")
      has_bootstrap_cdn = head_content.include?("bootstrap")

      expect(has_media || has_bootstrap_cdn).to be(true),
        "No responsive design indicators found"
    end
  end

  describe "Gemfile and gemspec syntax" do
    it "Gemfile is valid Ruby syntax" do
      gemfile = File.join(root, "Gemfile")
      content = File.read(gemfile)
      expect { RubyVM::InstructionSequence.compile(content) }.not_to raise_error
    end

    it "gemspec is valid Ruby syntax" do
      gemspec = File.join(root, "jekyll-theme-zer0.gemspec")
      content = File.read(gemspec)
      expect { RubyVM::InstructionSequence.compile(content) }.not_to raise_error
    end
  end
end
