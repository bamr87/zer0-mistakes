# frozen_string_literal: true

RSpec.describe "Doc schema" do
  let(:schema) { load_yaml(File.join(RSpec.configuration.schemas_dir, "doc.yml")) }

  it "targets the docs collection" do
    expect(schema["collection"]).to eq("docs")
  end

  it "specifies default layout" do
    expect(schema["layout"]).to eq("default")
  end

  it "requires title" do
    expect(schema).to have_required_fields("title")
  end

  it "defines layout enum" do
    layout_field = schema["fields"].find { |f| f["name"] == "layout" }
    expect(layout_field["enum"]).to include("default")
  end

  it "has SEO fields" do
    field_names = schema["fields"].map { |f| f["name"] }
    expect(field_names).to include("description", "preview")
  end
end
