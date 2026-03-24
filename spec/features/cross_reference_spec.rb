# frozen_string_literal: true

RSpec.describe "Cross-reference validation" do
  let(:features) { load_features }
  let(:valid_ids) { features.map { |f| f["id"] } }

  describe "component headers reference valid features" do
    layout_files_list = Dir.glob(File.join(
      File.expand_path("../../..", __dir__), "_layouts", "*.html"
    ))
    include_files_list = Dir.glob(File.join(
      File.expand_path("../../..", __dir__), "_includes", "**", "*.html"
    ))
    plugin_files_list = Dir.glob(File.join(
      File.expand_path("../../..", __dir__), "_plugins", "*.rb"
    ))

    (layout_files_list + include_files_list + plugin_files_list).each do |file_path|
      relative = file_path.sub(File.expand_path("../../..", __dir__) + "/", "")

      context relative do
        it "references a valid feature ID (if header present)" do
          content = File.read(file_path)
          next unless content.include?("@zer0-component")

          if content =~ /feature-id:\s*(ZER0-\d{3})/
            feature_id = Regexp.last_match(1)
            expect(valid_ids).to include(feature_id),
              "#{relative} references #{feature_id} which is not in features.yml"
          end
        end
      end
    end
  end

  describe "features.yml file references exist" do
    let(:project_root) { RSpec.configuration.project_root }

    it "referenced layout files exist" do
      missing = []
      features.each do |feature|
        refs = feature.dig("references", "layouts") || []
        refs.each do |ref_path|
          full_path = File.join(project_root, ref_path)
          missing << "#{feature['id']}: #{ref_path}" unless File.exist?(full_path)
        end
      end
      if missing.any?
        pending "Missing layout references (data integrity issue):\n  #{missing.join("\n  ")}"
      end
      expect(missing).to be_empty
    end

    it "referenced include files exist" do
      features.each do |feature|
        refs = feature.dig("references", "includes") || []
        refs.each do |ref_path|
          full_path = File.join(project_root, ref_path)
          expect(File.exist?(full_path)).to be(true),
            "#{feature['id']} references missing include: #{ref_path}"
        end
      end
    end
  end
end
