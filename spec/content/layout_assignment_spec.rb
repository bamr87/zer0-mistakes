# frozen_string_literal: true

RSpec.describe "Layout assignment" do
  let(:schemas) { load_schemas }
  let(:root) { RSpec.configuration.project_root }
  let(:available_layouts) { layout_files.map { |f| File.basename(f, ".html") } }

  it "all layouts referenced in schemas exist" do
    schemas.each do |collection_name, schema|
      layout_field = schema["fields"]&.find { |f| f["name"] == "layout" }
      next unless layout_field && layout_field["enum"]

      layout_field["enum"].each do |layout_name|
        expect(available_layouts).to include(layout_name),
          "Schema '#{collection_name}' references missing layout: #{layout_name}"
      end
    end
  end

  it "content files reference existing layouts" do
    schemas.each do |collection_name, _schema|
      collection_files(collection_name).each do |file_path|
        fm = parse_front_matter(file_path)
        next unless fm["layout"]

        expect(available_layouts).to include(fm["layout"]),
          "#{file_path} references missing layout: #{fm['layout']}"
      end
    end
  end
end
