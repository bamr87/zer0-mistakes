# Rakefile
require "bundler/gem_tasks"

# =============================================================================
# Preview Image Generator Tasks
# Feature: ZER0-003
# =============================================================================
namespace :preview do
  desc "List all documents missing preview images"
  task :missing do
    sh "./scripts/generate-preview-images.sh --list-missing"
  end

  desc "Preview what images would be generated (dry run)"
  task :dry_run do
    sh "./scripts/generate-preview-images.sh --dry-run --verbose"
  end

  desc "Generate preview images for all collections"
  task :generate do
    sh "./scripts/generate-preview-images.sh --verbose"
  end

  desc "Generate preview images for posts only"
  task :posts do
    sh "./scripts/generate-preview-images.sh --collection posts --verbose"
  end

  desc "Generate preview images for docs only"
  task :docs do
    sh "./scripts/generate-preview-images.sh --collection docs --verbose"
  end

  desc "Force regenerate all preview images"
  task :force do
    sh "./scripts/generate-preview-images.sh --force --verbose"
  end

  desc "Generate preview for a specific file (FILE=path/to/file.md)"
  task :file do
    file = ENV['FILE']
    if file.nil? || file.empty?
      puts "Usage: rake preview:file FILE=path/to/your/post.md"
      exit 1
    end
    sh "./scripts/generate-preview-images.sh --file #{file} --verbose"
  end
end

# =============================================================================
# Development Tasks
# =============================================================================
namespace :dev do
  desc "Start Jekyll development server with Docker"
  task :serve do
    sh "docker-compose up"
  end

  desc "Build Jekyll site"
  task :build do
    sh "docker-compose exec jekyll jekyll build"
  end

  desc "Run Jekyll doctor"
  task :doctor do
    sh "docker-compose exec jekyll jekyll doctor"
  end
end

# =============================================================================
# RSpec Test Tasks
# =============================================================================
require "rspec/core/rake_task"

RSpec::Core::RakeTask.new(:spec) do |t|
  t.pattern = "spec/**/*_spec.rb"
end

namespace :spec do
  RSpec::Core::RakeTask.new(:schemas) do |t|
    t.pattern = "spec/schemas/**/*_spec.rb"
  end

  RSpec::Core::RakeTask.new(:plugins) do |t|
    t.pattern = "spec/plugins/**/*_spec.rb"
  end

  RSpec::Core::RakeTask.new(:features) do |t|
    t.pattern = "spec/features/**/*_spec.rb"
  end

  RSpec::Core::RakeTask.new(:build) do |t|
    t.pattern = "spec/build/**/*_spec.rb"
  end

  RSpec::Core::RakeTask.new(:content) do |t|
    t.pattern = "spec/content/**/*_spec.rb"
  end

  RSpec::Core::RakeTask.new(:integration) do |t|
    t.pattern = "spec/integration/**/*_spec.rb"
  end

  RSpec::Core::RakeTask.new(:tokens) do |t|
    t.pattern = "spec/tokens/**/*_spec.rb"
  end

  RSpec::Core::RakeTask.new(:quality) do |t|
    t.pattern = "spec/quality/**/*_spec.rb"
  end
end

# =============================================================================
# Design Token Tasks
# =============================================================================
namespace :tokens do
  desc "Generate SCSS from design token YAML files"
  task :generate do
    sh "ruby scripts/generate-tokens.rb"
  end

  desc "Check if generated tokens are up to date"
  task :check do
    sh "ruby scripts/generate-tokens.rb --check"
  end
end

# =============================================================================
# Playwright E2E Test Tasks
# =============================================================================
namespace :e2e do
  desc "Run all Playwright E2E tests"
  task :all do
    sh "cd e2e && npx playwright test"
  end

  desc "Run Playwright desktop tests"
  task :desktop do
    sh "cd e2e && npx playwright test --project=desktop"
  end

  desc "Run Playwright mobile tests"
  task :mobile do
    sh "cd e2e && npx playwright test --project=mobile"
  end

  desc "Run Playwright accessibility tests"
  task :a11y do
    sh "cd e2e && npx playwright test tests/accessibility.spec.ts"
  end

  desc "Install Playwright browsers"
  task :install do
    sh "cd e2e && npm install && npx playwright install --with-deps chromium"
  end
end

# Default task
task default: :spec