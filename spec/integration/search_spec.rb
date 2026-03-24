# frozen_string_literal: true

RSpec.describe "Search index" do
  let(:root) { RSpec.configuration.project_root }

  it "search.json template exists" do
    expect(File.exist?(File.join(root, "search.json"))).to be true
  end

  it "search.json has Jekyll front matter" do
    content = File.read(File.join(root, "search.json"))
    expect(content).to start_with("---")
  end

  it "search data include exists" do
    # The search data template that generates the JSON
    search_data = File.join(root, "_includes", "search-data.json")
    expect(File.exist?(search_data)).to be true
  end
end
