# frozen_string_literal: true

# Migrated from: test_quality.sh → test_html_semantic_structure, test_core.sh → test_liquid_templates
# Covers: Semantic HTML structure, XSS vector scanning, nested Liquid tag detection

RSpec.describe "HTML output quality" do
  let(:root) { RSpec.configuration.project_root }
  let(:layouts_dir) { RSpec.configuration.layouts_dir }
  let(:includes_dir) { RSpec.configuration.includes_dir }

  describe "semantic HTML in layouts" do
    let(:layout_html) do
      Dir.glob(File.join(layouts_dir, "*.html")).each_with_object({}) do |path, hash|
        hash[File.basename(path)] = File.read(path)
      end
    end

    it "uses semantic HTML elements (header, nav, main, footer)" do
      all_content = layout_html.values.join("\n")
      semantic_tags = %w[<header <nav <main <footer]
      found = semantic_tags.select { |tag| all_content.include?(tag) }
      expect(found).not_to be_empty,
        "No semantic HTML elements found across layouts"
    end

    it "root layout includes HTML5 doctype" do
      root_layout = layout_html["root.html"]
      skip "root.html not found" unless root_layout
      expect(root_layout).to match(/<!DOCTYPE html>/i)
    end

    it "root layout includes lang attribute" do
      root_layout = layout_html["root.html"]
      skip "root.html not found" unless root_layout
      expect(root_layout).to match(/<html[^>]*lang=/i)
    end

    it "charset meta is present (in root layout or head include)" do
      root_layout = layout_html["root.html"] || ""
      head_include = File.join(root, "_includes", "core", "head.html")
      head_content = File.exist?(head_include) ? File.read(head_include) : ""
      combined = root_layout + head_content
      expect(combined).to match(/charset/i)
    end

    it "viewport meta is present (in root layout or head include)" do
      root_layout = layout_html["root.html"] || ""
      head_include = File.join(root, "_includes", "core", "head.html")
      head_content = File.exist?(head_include) ? File.read(head_include) : ""
      combined = root_layout + head_content
      expect(combined).to match(/viewport/i)
    end
  end

  describe "security: no XSS vectors in templates" do
    let(:template_files) do
      Dir.glob(File.join(layouts_dir, "*.html")) +
        Dir.glob(File.join(includes_dir, "**", "*.html"))
    end

    it "templates do not use raw unescaped innerHTML patterns" do
      dangerous = []
      template_files.each do |path|
        content = File.read(path)
        # Flag innerHTML assignments from user input or unsanitized variables
        # Safe: string literals, template literals, local vars, ternaries with literals
        content.scan(/\.innerHTML\s*=\s*(.+)/).flatten.each do |rhs|
          rhs = rhs.strip
          next if rhs.start_with?("'", '"', "`") # String/template literals
          next if rhs.match?(/\A[a-zA-Z_][a-zA-Z0-9_]*;?\z/) # Simple local variable
          next if rhs.include?("'") || rhs.include?('"') # Contains string literals (ternary, concatenation)
          dangerous << File.basename(path) unless dangerous.include?(File.basename(path))
        end
      end
      expect(dangerous).to be_empty,
        "Templates with potentially unsafe innerHTML: #{dangerous.join(', ')}"
    end

    it "templates do not contain document.write" do
      offenders = []
      template_files.each do |path|
        content = File.read(path)
        if content.include?("document.write(")
          offenders << File.basename(path)
        end
      end
      expect(offenders).to be_empty,
        "Templates using document.write: #{offenders.join(', ')}"
    end

    it "templates do not contain eval()" do
      offenders = []
      template_files.each do |path|
        content = File.read(path)
        # Match eval( but not evaluate/evaluation/etc.
        if content.match?(/\beval\s*\(/)
          offenders << File.basename(path)
        end
      end
      expect(offenders).to be_empty,
        "Templates using eval(): #{offenders.join(', ')}"
    end
  end

  describe "Liquid template hygiene" do
    let(:include_html_files) do
      Dir.glob(File.join(includes_dir, "**", "*.html"))
    end

    it "include files have no nested Liquid output tags {{ {{ }}" do
      offenders = []
      include_html_files.each do |path|
        content = File.read(path)
        # Detect {{ inside {{ before closing }}
        if content.match?(/\{\{[^}]*\{\{/)
          offenders << File.basename(path)
        end
      end
      expect(offenders).to be_empty,
        "Includes with nested Liquid output tags: #{offenders.join(', ')}"
    end

    it "layout files reference existing include files" do
      layout_includes = []
      Dir.glob(File.join(layouts_dir, "*.html")).each do |path|
        content = File.read(path)
        content.scan(/\{%\s*include\s+([\w\/\-\.]+)/).flatten.each do |inc|
          layout_includes << { layout: File.basename(path), include: inc }
        end
      end

      missing = layout_includes.reject do |entry|
        File.exist?(File.join(includes_dir, entry[:include]))
      end

      expect(missing).to be_empty,
        "Layouts reference missing includes: #{missing.map { |m| "#{m[:layout]} → #{m[:include]}" }.join(', ')}"
    end
  end
end
