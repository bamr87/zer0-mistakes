# frozen_string_literal: true

RSpec.describe "Asset compilation prerequisites" do
  let(:root) { RSpec.configuration.project_root }

  describe "SCSS files" do
    let(:sass_dir) { File.join(root, "_sass") }
    let(:scss_files) { Dir.glob(File.join(sass_dir, "**", "*.scss")) }

    it "_sass/ directory exists" do
      expect(File.directory?(sass_dir)).to be true
    end

    it "has SCSS files" do
      expect(scss_files).not_to be_empty
    end

    it "custom.scss exists as main entry point" do
      expect(File.exist?(File.join(sass_dir, "custom.scss"))).to be true
    end

    it "SCSS files have no syntax-breaking issues" do
      scss_files.each do |scss_path|
        content = File.read(scss_path)
        # Check balanced braces
        opens = content.count("{")
        closes = content.count("}")
        expect(opens).to eq(closes),
          "Unbalanced braces in #{File.basename(scss_path)}: #{opens} { vs #{closes} }"
      end
    end
  end

  describe "JavaScript files" do
    let(:js_dir) { File.join(root, "assets", "js") }
    let(:js_files) { Dir.glob(File.join(js_dir, "**", "*.js")) }

    it "assets/js/ directory exists" do
      expect(File.directory?(js_dir)).to be true
    end

    it "has JavaScript files" do
      expect(js_files).not_to be_empty
    end

    it "JS files are non-empty" do
      js_files.each do |js_path|
        expect(File.size(js_path)).to be > 0,
          "Empty JavaScript file: #{File.basename(js_path)}"
      end
    end

    # Migrated from: test_core.sh → test_javascript_syntax
    it "JS files have balanced braces" do
      js_files.each do |js_path|
        content = File.read(js_path)
        opens = content.count("{")
        closes = content.count("}")
        expect(opens).to eq(closes),
          "Unbalanced braces in #{File.basename(js_path)}: #{opens} { vs #{closes} }"
      end
    end
  end

  describe "CSS assets" do
    let(:css_dir) { File.join(root, "assets", "css") }

    it "assets/css/ directory exists" do
      expect(File.directory?(css_dir)).to be true
    end
  end
end
