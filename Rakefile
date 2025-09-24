# Rakefile
require "bundler/gem_tasks"

# Load HTMLProofer if available
begin
  require 'html-proofer'
  HTMLPROOFER_AVAILABLE = true
rescue LoadError
  HTMLPROOFER_AVAILABLE = false
  puts "Warning: html-proofer gem not available. Install with 'bundle install' to enable HTML testing."
end

# Configuration
SITE_DIR = '_site'
CONFIG_FILE = '_config.yml'
CONFIG_DEV_FILE = '_config_dev.yml'

# HTMLProofer options - can be customized in _config.yml
HTMLPROOFER_OPTIONS = {
  checks: ['Links', 'Images', 'Scripts', 'OpenGraph'],
  disable_external: true,
  allow_hash_href: true,
  ignore_empty_alt: true,
  assume_extension: '.html',
  enforce_https: false
}.freeze

desc "Build the Jekyll site"
task :build do
  puts "Building Jekyll site..."
  system("bundle exec jekyll build --config #{CONFIG_DEV_FILE}")
end

desc "Build for production"
task :build_prod do
  puts "Building Jekyll site for production..."
  system("bundle exec jekyll build --config #{CONFIG_FILE}")
end

desc "Serve the Jekyll site for development"
task :serve do
  puts "Serving Jekyll site..."
  system("bundle exec jekyll serve --config #{CONFIG_DEV_FILE} --watch --livereload")
end

if HTMLPROOFER_AVAILABLE
  desc "Test the built site with HTMLProofer"
  task :test_html => [:build] do
    puts "Testing HTML with HTMLProofer..."
    options = HTMLPROOFER_OPTIONS.dup
    
    # Allow customization via environment variables
    options[:disable_external] = ENV['HTMLPROOFER_EXTERNAL'] != 'true'
    options[:checks] = ENV['HTMLPROOFER_CHECK_IMAGES'] == 'false' ? ['Links', 'Scripts'] : ['Links', 'Images', 'Scripts']
    options[:enforce_https] = ENV['HTMLPROOFER_ENFORCE_HTTPS'] == 'true'
    
    begin
      HTMLProofer.check_directory(SITE_DIR, options).run
      puts "✅ HTML validation passed!"
    rescue => e
      puts "❌ HTML validation failed: #{e.message}"
      exit 1
    end
  end

  desc "Test the production build with HTMLProofer"
  task :test_html_prod => [:build_prod] do
    puts "Testing production HTML with HTMLProofer..."
    options = HTMLPROOFER_OPTIONS.dup
    options[:disable_external] = false  # Enable external link checking for production
    options[:enforce_https] = true
    options[:checks] = ['Links', 'Images', 'Scripts', 'OpenGraph']
    
    begin
      HTMLProofer.check_directory(SITE_DIR, options).run
      puts "✅ Production HTML validation passed!"
    rescue => e
      puts "❌ Production HTML validation failed: #{e.message}"
      exit 1
    end
  end

  desc "Test external links only"
  task :test_external_links => [:build] do
    puts "Testing external links with HTMLProofer..."
    options = {
      checks: ['Links'],
      external_only: true,
      http_status_ignore: [999],  # LinkedIn blocks automated requests
      typhoeus: {
        connecttimeout: 30,
        timeout: 30
      }
    }
    
    begin
      HTMLProofer.check_directory(SITE_DIR, options).run
      puts "✅ External link validation passed!"
    rescue => e
      puts "❌ External link validation failed: #{e.message}"
      exit 1
    end
  end

  desc "Test internal links and structure only"
  task :test_internal => [:build] do
    puts "Testing internal structure with HTMLProofer..."
    options = HTMLPROOFER_OPTIONS.dup
    options[:disable_external] = true
    options[:checks] = ['Links', 'Scripts']  # Skip images for faster testing
    
    begin
      HTMLProofer.check_directory(SITE_DIR, options).run
      puts "✅ Internal structure validation passed!"
    rescue => e
      puts "❌ Internal structure validation failed: #{e.message}"
      exit 1
    end
  end
else
  desc "HTML testing not available - install html-proofer gem"
  task :test_html do
    puts "❌ HTMLProofer not available. Install with: bundle install"
    exit 1
  end

  task :test_html_prod => :test_html
  task :test_external_links => :test_html
  task :test_internal => :test_html
end

desc "Build and test the site (comprehensive)"
task :test => [:build, :test_html] do
  puts "✅ Build and test completed successfully!"
end

desc "Build and test for production"
task :test_prod => [:build_prod, :test_html_prod] do
  puts "✅ Production build and test completed successfully!"
end

desc "Quick test (internal only)"
task :test_quick => [:build, :test_internal] do
  puts "✅ Quick test completed successfully!"
end

desc "Full test suite (all checks)"
task :test_full do
  puts "Running comprehensive test suite..."
  
  # Run different test types
  Rake::Task[:test_internal].invoke
  puts ""
  
  if ENV['SKIP_EXTERNAL'] != 'true'
    puts "Testing external links (set SKIP_EXTERNAL=true to skip)..."
    Rake::Task[:test_external_links].invoke
  else
    puts "⚠️  Skipping external link tests (SKIP_EXTERNAL=true)"
  end
  
  puts ""
  puts "✅ Full test suite completed successfully!"
end

desc "Clean the build directory"
task :clean do
  puts "Cleaning build directory..."
  system("rm -rf #{SITE_DIR}")
  puts "✅ Build directory cleaned!"
end

desc "Install dependencies"
task :deps do
  puts "Installing dependencies..."
  system("bundle install")
  puts "✅ Dependencies installed!"
end

desc "Show testing help"
task :help do
  puts <<~HELP
    Available testing tasks for zer0-mistakes Jekyll theme:
    
    Development Tasks:
      rake build         - Build the site for development
      rake serve         - Serve the site with live reload
      rake clean         - Clean the build directory
      rake deps          - Install dependencies
    
    Testing Tasks:
      rake test          - Build and run comprehensive HTML tests
      rake test_quick    - Build and run internal structure tests only
      rake test_internal - Test internal links and HTML structure
      rake test_external - Test external links only
      rake test_full     - Run all tests (internal + external + comprehensive)
    
    Production Tasks:
      rake build_prod    - Build for production
      rake test_prod     - Build and test production site
    
    Environment Variables:
      HTMLPROOFER_EXTERNAL=true     - Enable external link checking
      HTMLPROOFER_CHECK_IMAGES=false - Disable image checking
      HTMLPROOFER_ENFORCE_HTTPS=true - Enforce HTTPS links
      SKIP_EXTERNAL=true            - Skip external link tests
    
    Examples:
      rake test                     # Quick development test
      SKIP_EXTERNAL=true rake test_full  # Full test without external links
      rake test_prod                # Production testing with all checks
    
    For more information, see: https://github.com/gjtorikian/html-proofer
  HELP
end

# Set default task
task :default => :test_quick