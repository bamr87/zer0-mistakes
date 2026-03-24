# frozen_string_literal: true

RSpec.describe "Navigation data" do
  let(:root) { RSpec.configuration.project_root }
  let(:nav_dir) { File.join(root, "_data", "navigation") }

  it "navigation directory exists" do
    expect(File.directory?(nav_dir)).to be true
  end

  it "has navigation YAML files" do
    nav_files = Dir.glob(File.join(nav_dir, "*.yml"))
    expect(nav_files).not_to be_empty
  end

  describe "each navigation file" do
    Dir.glob(File.join(
      File.expand_path("../../..", __dir__), "_data", "navigation", "*.yml"
    )).each do |nav_path|
      basename = File.basename(nav_path)

      context basename do
        it "is valid YAML" do
          expect(nav_path).to be_valid_yaml
        end

        it "is non-empty" do
          data = YAML.safe_load_file(nav_path, permitted_classes: [Date, Time])
          expect(data).not_to be_nil, "#{basename} is empty"
        end
      end
    end
  end

  it "main.yml exists for primary navigation" do
    expect(File.exist?(File.join(nav_dir, "main.yml"))).to be true
  end
end
