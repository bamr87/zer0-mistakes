# A fixture gemspec: the shape the studio reads, not a gem anyone builds.
Gem::Specification.new do |s|
  s.name                     = "jekyll-theme-zer0"
  s.version                  = "9.9.9"
  s.authors                  = [ "fixture" ]
  s.summary                  = "fixture theme"
  s.files                    = `git ls-files -z`.split("\x0").select do |f|
    f.match(%r{^(assets|scripts|_(data|includes|layouts|plugins|sass)/)}i)
  end.reject do |f|
    f.match(%r{
      ^assets/images/      # content-specific images
    | ^assets/backgrounds/ # large background images
    }x)
  end
end
