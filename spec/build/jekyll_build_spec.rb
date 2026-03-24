# frozen_string_literal: true

RSpec.describe "Jekyll build prerequisites" do
  let(:root) { RSpec.configuration.project_root }

  describe "required configuration files" do
    %w[_config.yml _config_dev.yml Gemfile docker-compose.yml].each do |file|
      it "#{file} exists" do
        expect(File.exist?(File.join(root, file))).to be true
      end
    end
  end

  # Migrated from: test_core.sh → test_file_structure
  describe "required project files" do
    %w[README.md LICENSE jekyll-theme-zer0.gemspec package.json].each do |file|
      it "#{file} exists" do
        expect(File.exist?(File.join(root, file))).to be true
      end
    end
  end

  describe "required directories" do
    %w[_layouts _includes _plugins _sass _data assets pages].each do |dir|
      it "#{dir}/ exists" do
        expect(File.directory?(File.join(root, dir))).to be true
      end
    end
  end

  describe "Jekyll configuration" do
    let(:config) { load_yaml(File.join(root, "_config.yml")) }

    it "is valid YAML" do
      expect(File.join(root, "_config.yml")).to be_valid_yaml
    end

    it "defines collections" do
      expect(config["collections"]).to be_a(Hash)
    end

    it "defines standard collections" do
      %w[posts docs notes notebooks quests].each do |col|
        expect(config["collections"]).to have_key(col),
          "Missing collection: #{col}"
      end
    end

    it "all collections output to HTML" do
      config["collections"].each do |name, settings|
        next unless settings.is_a?(Hash)
        expect(settings["output"]).to be(true),
          "Collection '#{name}' has output: false"
      end
    end

    it "defines collections_dir" do
      expect(config["collections_dir"]).to eq("pages")
    end
  end

  describe "development configuration" do
    let(:dev_config) { load_yaml(File.join(root, "_config_dev.yml")) }

    it "is valid YAML" do
      expect(File.join(root, "_config_dev.yml")).to be_valid_yaml
    end
  end

  describe "layout files" do
    let(:layouts) { layout_files }

    it "has layout files" do
      expect(layouts).not_to be_empty
    end

    %w[root.html default.html home.html].each do |required_layout|
      it "includes #{required_layout}" do
        basenames = layouts.map { |f| File.basename(f) }
        expect(basenames).to include(required_layout)
      end
    end

    it "layouts have balanced Liquid tags" do
      layouts.each do |layout_path|
        content = File.read(layout_path)
        expect(content).to have_balanced_liquid_tags,
          "Unbalanced Liquid tags in #{File.basename(layout_path)}"
      end
    end
  end

  describe "include files" do
    let(:includes) { include_files }

    it "has include files" do
      expect(includes).not_to be_empty
    end

    it "includes have balanced Liquid tags" do
      includes.each do |include_path|
        content = File.read(include_path)
        expect(content).to have_balanced_liquid_tags,
          "Unbalanced Liquid tags in #{File.basename(include_path)}"
      end
    end
  end
end
