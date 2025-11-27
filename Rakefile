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
# Test Tasks
# =============================================================================
namespace :test do
  desc "Run all tests"
  task :all do
    sh "./test/test_runner.sh"
  end

  desc "Run core tests"
  task :core do
    sh "./test/test_core.sh"
  end

  desc "Run verbose tests"
  task :verbose do
    sh "./test/test_runner.sh --verbose"
  end
end

# Default task
task default: 'test:all'