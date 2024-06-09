# jekyll-theme-zer0.gemspec
Gem::Specification.new do |spec|
  spec.name          = "jekyll-theme-zer0"
  spec.version       = "0.1.2"
  spec.authors       = ["Amr Abdel"]
  spec.email         = ["amr@it-journey.dev"]

  spec.summary       = "Jekyll theme based on bootstrap and compatible with github pages"
  spec.homepage      = "https://github.com/bamr87/zer0-mistakes"
  spec.license       = "MIT"

  spec.files         = `git ls-files -z`.split("\x0").select { |f| f.match(%r{^(assets|_layouts|_includes|_sass|LICENSE|README|jekyll-theme-zer0.gemspec)}) }

  spec.required_ruby_version = ">= 2.7.0"

  spec.add_runtime_dependency "jekyll", "~> 3.9.5"

  spec.add_development_dependency "bundler", "~> 2.3.22"
  spec.add_development_dependency "rake", "~> 13.0"
end