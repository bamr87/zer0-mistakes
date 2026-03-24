# frozen_string_literal: true

RSpec.describe "Feature Registry" do
  let(:features_data) { load_yaml(RSpec.configuration.features_file) }
  let(:features) { features_data["features"] }

  it "features.yml exists" do
    expect(File.exist?(RSpec.configuration.features_file)).to be true
  end

  it "is valid YAML" do
    expect(RSpec.configuration.features_file).to be_valid_yaml
  end

  it "has a features array" do
    expect(features).to be_an(Array)
    expect(features).not_to be_empty
  end

  describe "each feature" do
    it "has a unique ZER0-XXX id" do
      ids = features.map { |f| f["id"] }
      expect(ids).to all(match(/\AZER0-\d{3}\z/))
      expect(ids.uniq.size).to eq(ids.size), "Duplicate feature IDs found: #{ids.group_by(&:itself).select { |_, v| v.size > 1 }.keys}"
    end

    it "has required fields: id, title, description, implemented" do
      features.each do |feature|
        expect(feature["id"]).not_to be_nil, "Feature missing id"
        expect(feature["title"]).to be_a(String), "#{feature['id']} missing title"
        expect(feature["description"]).to be_a(String), "#{feature['id']} missing description"
        expect([true, false]).to include(feature["implemented"]),
          "#{feature['id']} missing or invalid 'implemented' field"
      end
    end

    it "has tags array" do
      features.each do |feature|
        expect(feature["tags"]).to be_an(Array), "#{feature['id']} missing tags"
      end
    end

    it "has a version string" do
      features.each do |feature|
        expect(feature["version"]).to be_a(String), "#{feature['id']} missing version"
        expect(feature["version"]).to match(/\A\d+\.\d+\.\d+\z/),
          "#{feature['id']} version '#{feature['version']}' not semver"
      end
    end
  end

  describe "ID sequence" do
    it "IDs are sequential with no large gaps" do
      ids = features.map { |f| f["id"][/\d+/].to_i }.sort
      max_gap = ids.each_cons(2).map { |a, b| b - a }.max
      expect(max_gap).to be <= 5, "Large gap in feature IDs (max gap: #{max_gap})"
    end
  end
end
