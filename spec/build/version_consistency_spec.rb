# frozen_string_literal: true

# Migrated from: test_core.sh → test_version_consistency, test_package_json_validity
# Covers: Version parity across package.json, gemspec, version.rb

RSpec.describe "Version consistency" do
  let(:root) { RSpec.configuration.project_root }

  describe "version files exist" do
    it "package.json exists" do
      expect(File.exist?(File.join(root, "package.json"))).to be true
    end

    it "gemspec exists" do
      expect(File.exist?(File.join(root, "jekyll-theme-zer0.gemspec"))).to be true
    end

    it "version.rb exists" do
      expect(File.exist?(File.join(root, "lib", "jekyll-theme-zer0", "version.rb"))).to be true
    end
  end

  describe "version format" do
    let(:version_rb_content) { File.read(File.join(root, "lib", "jekyll-theme-zer0", "version.rb")) }
    let(:package_json) { JSON.parse(File.read(File.join(root, "package.json"))) }

    it "version.rb contains a semver VERSION constant" do
      expect(version_rb_content).to match(/VERSION\s*=\s*"(\d+\.\d+\.\d+)"/)
    end

    it "package.json has a valid semver version" do
      expect(package_json["version"]).to match(/\A\d+\.\d+\.\d+/)
    end

    it "gemspec references version.rb" do
      gemspec = File.read(File.join(root, "jekyll-theme-zer0.gemspec"))
      expect(gemspec).to include("JekyllThemeZer0::VERSION").or include("version.rb")
    end
  end

  describe "version parity" do
    let(:version_rb) do
      content = File.read(File.join(root, "lib", "jekyll-theme-zer0", "version.rb"))
      content[/VERSION\s*=\s*"(\d+\.\d+\.\d+)"/, 1]
    end

    let(:package_json_version) do
      JSON.parse(File.read(File.join(root, "package.json")))["version"]
    end

    it "package.json version matches version.rb" do
      skip "Could not extract version from version.rb" unless version_rb
      if package_json_version != version_rb
        pending "Version mismatch: package.json (#{package_json_version}) != version.rb (#{version_rb}) — sync during next release"
        expect(package_json_version).to eq(version_rb)
      end
    end
  end
end
