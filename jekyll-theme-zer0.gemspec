# jekyll-theme-zer0.gemspec
# npm version patch
# gem build jekyll-theme-zer0.gemspec
# gem push jekyll-theme-zer0-<version>.gem
# gem build jekyll-theme-zer0.gemspec && gem push jekyll-theme-zer0-$(jq -r .version package.json).gem
require "json"

package_json = JSON.parse(File.read("package.json"))

Gem::Specification.new do |s|
  s.name                     = "jekyll-theme-zer0"
  s.version                  = package_json["version"]
  s.authors                  = ["Amr Abdel"]
  s.email                    = ["amr@it-journey.dev"]

  s.summary                  = "Jekyll theme based on bootstrap and compatible with github pages"
  s.homepage                 = 'https://github.com/bamr87/zer0-mistakes'
  s.license                  = "MIT"
  
  s.metadata["plugin_type"]  = "theme"
  
  s.files                    = `git ls-files -z`.split("\x0").select do |f|
    f.match(%r{^(assets|_(data|includes|layouts|sass)/|(LICENSE|README|CHANGELOG)((\.(txt|md|markdown)|$)))}i)
  end
  
  s.platform                 = Gem::Platform::RUBY

  s.required_ruby_version    = ">= 2.6.0"

  s.add_runtime_dependency "jekyll", "~> 3.9.5"

  s.add_development_dependency "bundler", ">= 2.3.0"
  s.add_development_dependency "rake", "~> 13.0"
end
