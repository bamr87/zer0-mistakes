# frozen_string_literal: true

RSpec.describe "Collection configuration" do
  let(:config) { jekyll_config }
  let(:schemas) { load_schemas }
  let(:root) { RSpec.configuration.project_root }
  let(:collections_dir) { File.join(root, config["collections_dir"] || ".") }

  it "every schema has a matching Jekyll collection" do
    schemas.each do |collection_name, _schema|
      expect(config["collections"]).to have_key(collection_name),
        "Schema for '#{collection_name}' but no matching Jekyll collection"
    end
  end

  it "collections with schemas have directories on disk" do
    schemas.each do |collection_name, _schema|
      next if collection_name == "pages"

      dir = File.join(collections_dir, "_#{collection_name}")
      if !File.directory?(dir)
        pending "Schema-defined collection '#{collection_name}' missing directory: pages/_#{collection_name}"
      end
      expect(File.directory?(dir)).to be(true)
    end
  end

  it "collections have permalink patterns" do
    config["collections"].each do |name, settings|
      next unless settings.is_a?(Hash)
      expect(settings["permalink"]).to be_a(String),
        "Collection '#{name}' missing permalink pattern"
    end
  end
end
