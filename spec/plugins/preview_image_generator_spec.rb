# frozen_string_literal: true

RSpec.describe "Preview Image Generator Plugin" do
  let(:plugin_path) { File.join(RSpec.configuration.plugins_dir, "preview_image_generator.rb") }
  let(:plugin_content) { File.read(plugin_path) }

  it "exists" do
    expect(File.exist?(plugin_path)).to be true
  end

  it "has a @zer0-component header" do
    expect(plugin_path).to have_component_header
  end

  it "references feature ZER0-004" do
    expect(plugin_content).to include("ZER0-004")
  end

  it "defines DEFAULTS hash" do
    expect(plugin_content).to include("DEFAULTS")
  end

  it "defaults to openai provider" do
    expect(plugin_content).to include("'openai'")
  end

  it "defaults to dall-e-3 model" do
    expect(plugin_content).to include("'dall-e-3'")
  end

  it "supports auto_generate config" do
    expect(plugin_content).to include("auto_generate")
  end

  it "handles preview image path normalization" do
    expect(plugin_content).to include("normalize_preview_path")
  end

  it "checks if preview file exists on disk" do
    expect(plugin_content).to include("File.exist?")
  end

  it "supports external URLs for previews" do
    expect(plugin_content).to include("http")
  end
end
