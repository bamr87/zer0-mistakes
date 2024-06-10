# jekyll-theme-zer0.gemspec
# gem build jekyll-theme-zer0.gemspec
# gem push jekyll-theme-zer0-<version>.gem

require "json"

package_json = JSON.parse(File.read("package.json"))

Gem::Specification.new do |spec|
  spec.name          = "jekyll-theme-zer0"
  spec.version       = package_json["version"]
  spec.authors       = ["Amr Abdel"]
  spec.email         = ["amr@it-journey.dev"]

  spec.summary       = "Jekyll theme based on bootstrap and compatible with github pages"
  spec.homepage      = "https://github.com/bamr87/zer0-mistakes"
  spec.license       = "MIT"
  
  spec.metadata["plugin_type"] = "theme"
  
  spec.files                   = `git ls-files -z`.split("\x0").select do |f|
    f.match(%r{^(assets|_(data|includes|layouts|sass)/|(LICENSE|README|CHANGELOG)((\.(txt|md|markdown)|$)))}i)
  end
  
  spec.required_ruby_version = ">= 2.7.0"

  spec.add_runtime_dependency "jekyll", "~> 3.9.5"

  spec.add_development_dependency "bundler", "~> 2.3.22"
  spec.add_development_dependency "rake", "~> 13.0"
end
