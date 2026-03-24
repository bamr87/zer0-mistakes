# frozen_string_literal: true

RSpec.describe "Post schema" do
  let(:schema) { load_yaml(File.join(RSpec.configuration.schemas_dir, "post.yml")) }

  it "targets the posts collection" do
    expect(schema["collection"]).to eq("posts")
  end

  it "specifies article layout" do
    expect(schema["layout"]).to eq("article")
  end

  it "requires title and date" do
    expect(schema).to have_required_fields("title", "date")
  end

  it "defines layout enum with article as option" do
    layout_field = schema["fields"].find { |f| f["name"] == "layout" }
    expect(layout_field["enum"]).to include("article")
  end

  it "defines post_type enum" do
    post_type = schema["fields"].find { |f| f["name"] == "post_type" }
    expect(post_type).not_to be_nil
    expect(post_type["enum"]).to include("standard", "featured")
  end

  it "has SEO fields (description, preview, excerpt)" do
    field_names = schema["fields"].map { |f| f["name"] }
    expect(field_names).to include("description", "preview", "excerpt")
  end

  it "enforces max_length on description" do
    desc_field = schema["fields"].find { |f| f["name"] == "description" }
    expect(desc_field["max_length"]).to be_a(Integer)
  end
end
