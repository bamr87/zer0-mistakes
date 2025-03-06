source "https://rubygems.org"
gemspec

# This is where you define which Jekyll version to use for your site.
# This site is using the GitHub Pages gem, which is updated regularly.
# We recommend you lock your Jekyll version to the one used by GitHub Pages.

# Here are the dependancies from github pages https://pages.github.com/versions/
# For more detailed instructions, look here

# Github Pages Gems:
gem 'github-pages'

# If you have plugins enabled in the _config.yml, add them here too:
group :jekyll_plugins do

  # these are all part of the github-pages gem
  gem 'jekyll-remote-theme', "~> 0.4.3"
  gem 'jekyll-feed', "~> 0.17"
  gem 'jekyll-sitemap' , "~> 1.4.0"
  gem 'jekyll-seo-tag', "~> 2.8.0"
  gem 'jekyll-paginate', '~> 1.1'
end

# Docker support (Modify the Dockerfile to include the installation of the ffi gem and its dependencies. Additionally, ensure that all gems are installed for the correct platform.)
gem "ffi", "~> 1.17.0"
gem 'webrick', '~> 1.7'
gem 'commonmarker', '0.23.10'  # Added to avoid build errors with version 0.23.11