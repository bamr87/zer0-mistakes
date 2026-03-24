# frozen_string_literal: true

RSpec.describe "Analytics integration" do
  let(:root) { RSpec.configuration.project_root }
  let(:config) { jekyll_config }

  it "PostHog include exists" do
    posthog_include = File.join(root, "_includes", "analytics", "posthog.html")
    expect(File.exist?(posthog_include)).to be true
  end

  it "Cookie consent component exists" do
    cookie_consent = File.join(root, "_includes", "components", "cookie-consent.html")
    expect(File.exist?(cookie_consent)).to be true
  end

  describe "PostHog include" do
    let(:posthog_content) { File.read(File.join(root, "_includes", "analytics", "posthog.html")) }

    it "is environment-conditional (production only)" do
      expect(posthog_content).to include("production"),
        "PostHog should only load in production"
    end

    it "references posthog config" do
      expect(posthog_content).to match(/site\.posthog|site\.config/),
        "PostHog should read from site config"
    end
  end

  describe "development config" do
    let(:dev_config) { load_yaml(File.join(root, "_config_dev.yml")) }

    it "disables PostHog in development" do
      posthog = dev_config["posthog"]
      if posthog
        expect(posthog["enabled"]).to be(false),
          "PostHog should be disabled in _config_dev.yml"
      end
    end
  end
end
