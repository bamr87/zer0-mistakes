# frozen_string_literal: true

RSpec.describe "Content front matter validation" do
  let(:schemas) { load_schemas }

  # Test each collection that has a schema
  schemas_dir = File.join(File.expand_path("../../..", __dir__), "_data", "schemas")
  pages_dir = File.join(File.expand_path("../../..", __dir__), "pages")

  Dir.glob(File.join(schemas_dir, "*.yml")).each do |schema_path|
    schema_data = YAML.safe_load_file(schema_path, permitted_classes: [Date, Time])
    next unless schema_data.is_a?(Hash) && schema_data["collection"]

    collection_name = schema_data["collection"]
    collection_dir = File.join(pages_dir, "_#{collection_name}")
    next unless File.directory?(collection_dir)

    context "#{collection_name} collection" do
      content_files = Dir.glob(File.join(collection_dir, "**", "*.{md,markdown,html}"))

      content_files.each do |file_path|
        relative = file_path.sub(File.expand_path("../../..", __dir__) + "/", "")

        context relative do
          let(:front_matter) { parse_front_matter(file_path) }
          let(:schema) { load_yaml(schema_path) }

          it "has front matter" do
            expect(front_matter).not_to be_empty,
              "#{relative} has no front matter"
          end

          it "validates against schema" do
            skip "No front matter" if front_matter.empty?
            expect(front_matter).to validate_against_schema(schema)
          end
        end
      end
    end
  end
end
