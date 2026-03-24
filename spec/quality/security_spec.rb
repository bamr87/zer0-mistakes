# frozen_string_literal: true

# Migrated from: test_quality.sh → test_sensitive_files, test_hardcoded_secrets, test_secure_configurations
# Covers: Sensitive file detection, hardcoded secret scanning, secure config validation

RSpec.describe "Security" do
  let(:root) { RSpec.configuration.project_root }

  describe "sensitive file detection" do
    let(:sensitive_patterns) { %w[*.key *.pem *.p12 *.pfx id_rsa* *.crt] }

    it "no private key or certificate files in repository" do
      found = []
      sensitive_patterns.each do |pattern|
        Dir.glob(File.join(root, "**", pattern)).each do |path|
          next if path.include?("/.git/")
          next if path.include?("/node_modules/")
          next if path.include?("/_site/")
          found << path.sub("#{root}/", "")
        end
      end
      expect(found).to be_empty,
        "Potentially sensitive files found: #{found.join(', ')}"
    end

    it "no .env files committed" do
      env_files = Dir.glob(File.join(root, "**", ".env*")).reject do |p|
        p.include?("/.git/") || p.include?("/_site/") ||
          p.include?("/node_modules/") || File.basename(p) == ".env.example" ||
          File.basename(p) == ".env" # Root .env is gitignored for local dev
      end
      expect(env_files).to be_empty,
        ".env files found: #{env_files.map { |f| f.sub("#{root}/", "") }.join(', ')}"
    end
  end

  describe "hardcoded secrets in source" do
    let(:source_files) do
      Dir.glob(File.join(root, "**", "*.{rb,js,yml,yaml}")).reject do |p|
        p.include?("/.git/") || p.include?("/_site/") ||
          p.include?("/node_modules/") || p.include?("/spec/") ||
          p.include?("/test/") || p.include?("/vendor/")
      end
    end

    it "no hardcoded API keys in source files" do
      offenders = []
      source_files.each do |path|
        content = File.read(path)
        # Look for common API key patterns (long hex/base64 strings assigned to key-like variables)
        next if File.basename(path) == "features.yml"
        next if path.include?("_about/settings") # Example/settings config files
        next if File.basename(path) =~ /\A_config/ # Jekyll config files mention keys
        if content.match?(/api[_-]?key\s*[:=]\s*['"][a-zA-Z0-9]{20,}['"]/)
          offenders << path.sub("#{root}/", "")
        end
      end
      expect(offenders).to be_empty,
        "Potential hardcoded API keys: #{offenders.join(', ')}"
    end
  end

  describe "secure configuration" do
    let(:config) { load_yaml(File.join(root, "_config.yml")) }

    it "site URL uses HTTPS" do
      url = config["url"]
      skip "No url configured in _config.yml" unless url
      expect(url).to start_with("https://"),
        "Site URL should use HTTPS: #{url}"
    end
  end

  describe "template output escaping" do
    let(:template_files) do
      Dir.glob(File.join(root, "_includes", "**", "*.html")) +
        Dir.glob(File.join(root, "_layouts", "*.html"))
    end

    it "user-facing includes use escape filter where appropriate" do
      # Spot-check that search-data.json uses jsonify (safe serialization)
      search_data = File.join(root, "_includes", "search-data.json")
      if File.exist?(search_data)
        content = File.read(search_data)
        expect(content).to include("jsonify"),
          "search-data.json should use jsonify filter for safe JSON output"
      end
    end
  end
end
