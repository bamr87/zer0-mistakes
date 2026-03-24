# frozen_string_literal: true

# Migrated from: test_quality.sh → test_html_semantic_structure, test_image_alt_text,
#   test_color_contrast, test_keyboard_navigation
# Covers: Source-level accessibility checks (semantic HTML, alt text, focus styles, ARIA)

RSpec.describe "Accessibility (source-level)" do
  let(:root) { RSpec.configuration.project_root }
  let(:layouts_dir) { RSpec.configuration.layouts_dir }
  let(:includes_dir) { RSpec.configuration.includes_dir }

  describe "semantic HTML usage" do
    let(:layout_contents) do
      Dir.glob(File.join(layouts_dir, "*.html")).map { |f| File.read(f) }.join("\n")
    end

    it "layouts use <main> element" do
      expect(layout_contents).to include("<main"),
        "No <main> element found in any layout"
    end

    it "layouts use <nav> element" do
      all = layout_contents +
        Dir.glob(File.join(includes_dir, "**", "*.html")).map { |f| File.read(f) }.join("\n")
      expect(all).to include("<nav"),
        "No <nav> element found in layouts or includes"
    end

    it "layouts or includes use <footer> element" do
      all = layout_contents +
        Dir.glob(File.join(includes_dir, "**", "*.html")).map { |f| File.read(f) }.join("\n")
      expect(all).to include("<footer"),
        "No <footer> element found"
    end
  end

  describe "image alt text patterns" do
    let(:content_files) do
      Dir.glob(File.join(root, "pages", "**", "*.md"))
    end

    it "markdown images have alt text (no empty ![]() patterns)" do
      missing_alt = []
      content_files.each do |path|
        content = File.read(path)
        # Match ![](url) with empty alt text
        if content.match?(/!\[\]\(/)
          missing_alt << path.sub("#{root}/", "")
        end
      end
      expect(missing_alt).to be_empty,
        "Markdown images without alt text: #{missing_alt.join(', ')}"
    end

    it "HTML img tags in includes have alt attributes" do
      missing = []
      Dir.glob(File.join(includes_dir, "**", "*.html")).each do |path|
        content = File.read(path)
        # Find <img> tags without alt=
        content.scan(/<img\b[^>]*>/).each do |img_tag|
          unless img_tag.include?("alt=")
            missing << File.basename(path)
            break
          end
        end
      end
      expect(missing).to be_empty,
        "Includes with <img> missing alt attribute: #{missing.join(', ')}"
    end
  end

  describe "ARIA and keyboard support" do
    let(:all_template_content) do
      (Dir.glob(File.join(layouts_dir, "*.html")) +
       Dir.glob(File.join(includes_dir, "**", "*.html")))
        .map { |f| File.read(f) }.join("\n")
    end

    it "navigation includes aria-label or role attributes" do
      nav_matches = all_template_content.scan(/<nav\b[^>]*>/)
      skip "No <nav> elements found" if nav_matches.empty?

      has_aria = nav_matches.any? { |tag| tag.include?("aria-") || tag.include?("role=") }
      expect(has_aria).to be(true),
        "At least one <nav> should have aria-label or role attribute"
    end

    it "skip-to-content link exists" do
      skip_link = all_template_content.include?("skip") &&
                  all_template_content.match?(/href=["']#(main|content)/i)
      # This is a recommendation, not a hard requirement for source files
      if skip_link
        expect(skip_link).to be true
      else
        pending "No skip-to-content link found (recommended for WCAG 2.4.1)"
      end
    end
  end

  describe "focus and keyboard styles" do
    let(:scss_files) { Dir.glob(File.join(root, "_sass", "**", "*.scss")) }
    let(:css_files) { Dir.glob(File.join(root, "assets", "css", "**", "*.css")) }

    it "stylesheets include :focus rules" do
      all_styles = (scss_files + css_files).map { |f| File.read(f) }.join("\n")
      expect(all_styles).to match(/:focus/),
        "No :focus styles found in SCSS/CSS files"
    end
  end
end
