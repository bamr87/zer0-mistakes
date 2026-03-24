# Token consistency tests
# Validates design token definitions follow the schema, use correct naming
# conventions, and maintain consistency between light/dark modes.

RSpec.describe "Token consistency" do
  let(:root) { RSpec.configuration.project_root }
  let(:tokens_dir) { File.join(root, "_data", "tokens") }
  let(:schema_path) { File.join(tokens_dir, "_schema.yml") }
  let(:schema) { YAML.safe_load(File.read(schema_path), permitted_classes: [Date]) }

  let(:token_files) do
    Dir.glob(File.join(tokens_dir, "*.yml"))
      .reject { |f| File.basename(f).start_with?("_") }
  end

  let(:all_tokens) do
    token_files.flat_map do |file|
      data = YAML.safe_load(File.read(file), permitted_classes: [Date]) || {}
      (data["tokens"] || []).map { |t| t.merge("_file" => File.basename(file)) }
    end
  end

  describe "schema file" do
    it "exists" do
      expect(File.exist?(schema_path)).to be true
    end

    it "defines required_fields" do
      expect(schema["token_schema"]["required_fields"]).to include("name", "value", "category")
    end

    it "defines naming convention" do
      expect(schema["token_schema"]["name_pattern"]).to be_a(String)
    end

    it "lists all token files" do
      expected_files = schema["token_schema"]["files"]
      actual_files = token_files.map { |f| File.basename(f) }.sort
      expect(actual_files).to eq(expected_files.sort)
    end
  end

  describe "token files" do
    it "all parse as valid YAML" do
      token_files.each do |file|
        expect { YAML.safe_load(File.read(file), permitted_classes: [Date]) }
          .not_to raise_error, "#{File.basename(file)} is not valid YAML"
      end
    end

    it "all have a tokens array" do
      token_files.each do |file|
        data = YAML.safe_load(File.read(file), permitted_classes: [Date])
        expect(data["tokens"]).to be_an(Array), "#{File.basename(file)} missing tokens array"
      end
    end
  end

  describe "token naming" do
    let(:name_pattern) { Regexp.new(schema["token_schema"]["name_pattern"]) }

    it "all names follow kebab-case convention" do
      all_tokens.each do |token|
        expect(token["name"]).to match(name_pattern),
          "Token '#{token['name']}' in #{token['_file']} doesn't follow kebab-case"
      end
    end

    it "all names are unique" do
      names = all_tokens.map { |t| t["name"] }
      duplicates = names.group_by(&:itself).select { |_, v| v.length > 1 }.keys
      expect(duplicates).to be_empty,
        "Duplicate token names: #{duplicates.join(', ')}"
    end
  end

  describe "required fields" do
    let(:required) { schema["token_schema"]["required_fields"] }

    it "all tokens have required fields" do
      all_tokens.each do |token|
        required.each do |field|
          expect(token).to have_key(field),
            "Token '#{token['name']}' in #{token['_file']} missing required field '#{field}'"
        end
      end
    end
  end

  describe "categories" do
    let(:valid_categories) do
      schema["token_schema"]["categories"].values.flatten
    end

    it "all tokens use valid categories" do
      all_tokens.each do |token|
        expect(valid_categories).to include(token["category"]),
          "Token '#{token['name']}' has unknown category '#{token['category']}'"
      end
    end
  end

  describe "dark mode tokens" do
    let(:dark_tokens) { all_tokens.select { |t| t["dark"] } }

    it "dark values are valid hex colors or CSS values" do
      dark_tokens.each do |token|
        # Allow hex colors and CSS values
        expect(token["dark"]).to match(/^#[0-9a-fA-F]{3,8}$|^[a-z]/),
          "Token '#{token['name']}' has invalid dark value '#{token['dark']}'"
      end
    end
  end

  describe "color values" do
    let(:color_tokens) do
      colors_file = File.join(tokens_dir, "colors.yml")
      data = YAML.safe_load(File.read(colors_file), permitted_classes: [Date]) || {}
      data["tokens"] || []
    end

    it "hex values are valid format" do
      color_tokens.each do |token|
        value = token["value"]
        next unless value.start_with?("#")
        expect(value).to match(/^#[0-9a-fA-F]{3,8}$/),
          "Color '#{token['name']}' has invalid hex '#{value}'"
      end
    end
  end

  describe "generated SCSS" do
    let(:generated_path) { File.join(root, "_sass", "generated", "_tokens.scss") }

    it "exists" do
      expect(File.exist?(generated_path)).to be true
    end

    it "is up to date" do
      skip "Run 'ruby scripts/generate-tokens.rb' to regenerate" unless File.exist?(generated_path)
      result = system("ruby", File.join(root, "scripts", "generate-tokens.rb"), "--check")
      expect(result).to be true
    end

    it "contains SCSS variables for all tokens" do
      content = File.read(generated_path)
      all_tokens.each do |token|
        expect(content).to include("$zer0-#{token['name']}:"),
          "Missing SCSS variable for token '#{token['name']}'"
      end
    end

    it "contains CSS custom properties for literal-value tokens" do
      content = File.read(generated_path)
      literal_tokens = all_tokens.reject { |t| t["value"].to_s.start_with?("$") }
      literal_tokens.each do |token|
        expect(content).to include("--zer0-#{token['name']}:"),
          "Missing CSS custom property for token '#{token['name']}'"
      end
    end
  end
end
