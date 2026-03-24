# Token coverage tests
# Validates that SCSS files use token variables rather than hardcoded values,
# and that component includes reference token-based classes.

RSpec.describe "Token coverage" do
  let(:root) { RSpec.configuration.project_root }
  let(:sass_dir) { File.join(root, "_sass") }
  let(:scss_files) do
    Dir.glob(File.join(sass_dir, "**", "*.scss"))
      .reject { |f| f.include?("generated/") } # Skip auto-generated files
  end

  let(:tokens_dir) { File.join(root, "_data", "tokens") }
  let(:color_tokens) do
    file = File.join(tokens_dir, "colors.yml")
    data = YAML.safe_load(File.read(file), permitted_classes: [Date]) || {}
    (data["tokens"] || []).select { |t| t["value"].to_s.start_with?("#") }
  end

  # Extract all hex colors from SCSS content (excluding comments and token references)
  def extract_hardcoded_colors(content)
    # Remove single-line comments
    clean = content.gsub(%r{//.*$}m, "")
    # Remove multi-line comments
    clean = clean.gsub(%r{/\*.*?\*/}m, "")
    # Remove strings
    clean = clean.gsub(/"[^"]*"|'[^']*'/, "")

    # Find hex colors
    clean.scan(/#[0-9a-fA-F]{3,8}\b/).uniq
  end

  describe "hardcoded color detection" do
    # These are known Bootstrap or standard colors that are acceptable
    let(:allowed_hardcoded) do
      %w[
        #000 #fff #ffffff #000000
      ]
    end

    it "reports hardcoded colors in custom SCSS" do
      custom_file = File.join(sass_dir, "custom.scss")
      next unless File.exist?(custom_file)

      content = File.read(custom_file)
      hardcoded = extract_hardcoded_colors(content) - allowed_hardcoded

      # This is informational — we track progress toward full token adoption
      if hardcoded.any?
        pending "#{hardcoded.length} hardcoded colors in custom.scss: #{hardcoded.first(5).join(', ')}..."
      end
    end

    it "reports hardcoded colors in theme SCSS" do
      theme_file = File.join(sass_dir, "core", "_theme.scss")
      next unless File.exist?(theme_file)

      content = File.read(theme_file)
      hardcoded = extract_hardcoded_colors(content) - allowed_hardcoded

      if hardcoded.any?
        pending "#{hardcoded.length} hardcoded colors in _theme.scss: #{hardcoded.first(5).join(', ')}..."
      end
    end
  end

  describe "token file completeness" do
    it "maps all Bootstrap theme colors" do
      bootstrap_theme_colors = %w[primary secondary success info warning danger light dark]
      token_names = color_tokens.map { |t| t["name"] }

      bootstrap_theme_colors.each do |color|
        expect(token_names).to include(color),
          "Missing Bootstrap theme color token: #{color}"
      end
    end

    it "maps all Bootstrap gray scale" do
      gray_shades = (1..9).map { |n| "gray-#{n}00" }
      token_names = color_tokens.map { |t| t["name"] }

      gray_shades.each do |shade|
        expect(token_names).to include(shade),
          "Missing gray scale token: #{shade}"
      end
    end

    it "has dark mode variant for body-bg" do
      body_bg = color_tokens.find { |t| t["name"] == "body-bg" }
      expect(body_bg).not_to be_nil
      expect(body_bg["dark"]).not_to be_nil,
        "body-bg token should have a dark mode variant"
    end

    it "has dark mode variant for body-color" do
      body_color = color_tokens.find { |t| t["name"] == "body-color" }
      expect(body_color).not_to be_nil
      expect(body_color["dark"]).not_to be_nil,
        "body-color token should have a dark mode variant"
    end
  end

  describe "SCSS variable mapping" do
    let(:variables_content) do
      file = File.join(sass_dir, "core", "_variables.scss")
      File.exist?(file) ? File.read(file) : ""
    end

    it "token scss-var references exist in _variables.scss" do
      all_tokens = Dir.glob(File.join(tokens_dir, "*.yml"))
        .reject { |f| File.basename(f).start_with?("_") }
        .flat_map do |file|
          data = YAML.safe_load(File.read(file), permitted_classes: [Date]) || {}
          data["tokens"] || []
        end

      # Only check tokens with scss-var that reference project variables,
      # not Bootstrap variables (e.g., $blue-400, $blue-600)
      bootstrap_var_pattern = /^\$(red|orange|yellow|green|teal|blue|indigo|purple|pink|cyan|white|gray|black)-?\d*$/
      tokens_with_vars = all_tokens
        .select { |t| t["scss-var"]&.start_with?("$") }
        .reject { |t| t["scss-var"].match?(bootstrap_var_pattern) }
      missing = []

      tokens_with_vars.each do |token|
        var_name = token["scss-var"].delete_prefix("$")
        unless variables_content.include?("$#{var_name}")
          missing << "#{token['name']} → #{token['scss-var']}"
        end
      end

      expect(missing).to be_empty,
        "#{missing.length} tokens reference SCSS vars not in _variables.scss: #{missing.first(3).join(', ')}"
    end
  end
end
