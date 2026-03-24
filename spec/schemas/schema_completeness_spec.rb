# frozen_string_literal: true

RSpec.describe "Schema definitions" do
  let(:schema_dir) { RSpec.configuration.schemas_dir }
  let(:schema_files) { Dir.glob(File.join(schema_dir, "*.yml")) }

  it "schema directory exists" do
    expect(File.directory?(schema_dir)).to be true
  end

  it "has schema files" do
    expect(schema_files).not_to be_empty
  end

  describe "each schema file" do
    schema_files_list = Dir.glob(File.join(
      File.expand_path("../../..", __dir__), "_data", "schemas", "*.yml"
    ))

    schema_files_list.each do |schema_path|
      basename = File.basename(schema_path)

      context basename do
        let(:schema) { load_yaml(schema_path) }

        it "is valid YAML" do
          expect(schema_path).to be_valid_yaml
        end

        it "has a collection name" do
          expect(schema["collection"]).to be_a(String)
        end

        it "has a description" do
          expect(schema["description"]).to be_a(String)
        end

        it "has fields defined" do
          expect(schema["fields"]).to be_an(Array)
          expect(schema["fields"]).not_to be_empty
        end

        it "has valid field types" do
          expect(schema).to have_valid_field_types
        end

        it "requires 'title'" do
          expect(schema).to have_required_fields("title")
        end

        it "each field has a name and type" do
          schema["fields"].each do |field|
            expect(field["name"]).to be_a(String), "field missing name: #{field.inspect}"
            expect(field["type"]).to be_a(String), "field '#{field['name']}' missing type"
          end
        end

        it "each field has a description" do
          schema["fields"].each do |field|
            expect(field["description"]).to be_a(String),
              "field '#{field['name']}' missing description"
          end
        end

        it "enum values are arrays when present" do
          schema["fields"].select { |f| f.key?("enum") }.each do |field|
            expect(field["enum"]).to be_an(Array),
              "field '#{field['name']}' enum should be an array"
          end
        end
      end
    end
  end
end
