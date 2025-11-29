# frozen_string_literal: true

require_relative "lib/jekyll-theme-zer0/version"

Gem::Specification.new do |s|
  s.name                     = "jekyll-theme-zer0"
  s.version                  = JekyllThemeZer0::VERSION
  s.authors                  = ["Amr Abdel"]
  s.email                    = ["amr@it-journey.dev"]

  s.summary                  = "Jekyll theme based on bootstrap and compatible with github pages"
  s.description              = "Bootstrap Jekyll theme for headless Github Pages CMS with Docker-first development approach"
  s.homepage                 = "https://github.com/bamr87/zer0-mistakes"
  s.license                  = "MIT"
  
  s.metadata["plugin_type"]  = "theme"
  s.metadata["homepage_uri"] = s.homepage
  s.metadata["source_code_uri"] = s.homepage
  s.metadata["changelog_uri"] = "#{s.homepage}/blob/main/CHANGELOG.md"
  s.metadata["documentation_uri"] = "#{s.homepage}#readme"
  s.metadata["allowed_push_host"] = "https://rubygems.org"
  
  # Include theme files: layouts, includes, sass, assets, data, plugins, and scripts
  s.files                    = `git ls-files -z`.split("\x0").select do |f|
    f.match(%r{^(assets|scripts|_(data|includes|layouts|plugins|sass)/|(LICENSE|README|CHANGELOG|features)((\.(txt|md|markdown|yml)|$)))}i)
  end
  
  s.platform                 = Gem::Platform::RUBY

  s.required_ruby_version    = ">= 2.7.0"

  s.add_runtime_dependency "jekyll"
  # s.add_runtime_dependency "jekyll-feed", "~> 0.15"
  # s.add_runtime_dependency "jekyll-sitemap", "~> 1.4"

  s.add_development_dependency "bundler", "~> 2.3"
  s.add_development_dependency "rake", "~> 13.0"
  s.add_development_dependency "rspec", "~> 3.0"
end
