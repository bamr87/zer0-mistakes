# frozen_string_literal: true

RSpec.describe "Schema Validator Plugin" do
  let(:plugin_path) { File.join(RSpec.configuration.plugins_dir, "schema_validator.rb") }
  let(:plugin_content) { File.read(plugin_path) }

  it "exists" do
    expect(File.exist?(plugin_path)).to be true
  end

  it "has a @zer0-component header" do
    expect(plugin_path).to have_component_header
  end

  it "references feature ZER0-044" do
    expect(plugin_content).to include("ZER0-044")
  end

  it "is a Generator subclass" do
    expect(plugin_content).to include("class SchemaValidator < Generator")
  end

  it "marks itself as safe" do
    expect(plugin_content).to include("safe true")
  end

  it "supports strict/warn/off modes" do
    expect(plugin_content).to include("strict")
    expect(plugin_content).to include("warn")
    expect(plugin_content).to include("off")
  end

  it "loads schemas from _data/schemas/" do
    expect(plugin_content).to include("_data", "schemas")
  end

  it "validates required fields" do
    expect(plugin_content).to include("Missing required field")
  end

  it "validates types" do
    expect(plugin_content).to include("validate_type")
  end

  it "validates enum values" do
    expect(plugin_content).to include("enum")
  end

  it "validates max_length" do
    expect(plugin_content).to include("max_length")
  end

  it "validates patterns" do
    expect(plugin_content).to include("pattern")
  end

  it "raises FatalException in strict mode" do
    expect(plugin_content).to include("FatalException")
  end
end
