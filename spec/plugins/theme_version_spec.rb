# frozen_string_literal: true

RSpec.describe "Theme Version Plugin" do
  let(:plugin_path) { File.join(RSpec.configuration.plugins_dir, "theme_version.rb") }
  let(:plugin_content) { File.read(plugin_path) }

  it "exists" do
    expect(File.exist?(plugin_path)).to be true
  end

  it "has a @zer0-component header" do
    expect(plugin_path).to have_component_header
  end

  it "references feature ZER0-021" do
    expect(plugin_content).to include("ZER0-021")
  end

  it "is a Generator subclass" do
    expect(plugin_content).to include("class ThemeVersionGenerator < Generator")
  end

  it "marks itself as safe" do
    expect(plugin_content).to include("safe true")
  end

  it "handles remote_theme config" do
    expect(plugin_content).to include("remote_theme")
  end

  it "handles local gem theme config" do
    expect(plugin_content).to match(/site\.config\[.theme.\]/)
  end

  it "sets theme_specs on site" do
    expect(plugin_content).to include("theme_specs")
  end
end
