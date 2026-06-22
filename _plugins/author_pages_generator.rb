# frozen_string_literal: true

#
# File: author_pages_generator.rb
# Path: _plugins/author_pages_generator.rb
# Purpose: Auto-generate an author profile page (/authors/:key/) for every
#          entry in _data/authors.yml, plus an /authors/ index, so author
#          profiles work out of the box without authors hand-creating pages.
#
# Mirrors the pattern in search_and_sitemap_generator.rb (PageWithoutFile,
# safe true, low priority, idempotent, opt-out via _config.yml).
#
# Behaviour:
#   - One /authors/:key/ page per author (layout: author).
#   - One /authors/ index page (layout: authors).
#   - If a page already exists at the target permalink, it is left untouched.
#   - An author entry with `profile: false` in _data/authors.yml is skipped.
#   - Generation can be disabled via _config.yml:
#       authors:
#         generate_pages: false
#
# Note: like the other generators in this directory, this runs during a normal
# `jekyll build`. Sites consuming the theme remotely on GitHub Pages (which does
# not load custom plugins) can still create author pages by hand using the
# `author` / `authors` layouts shipped with the theme.
#

module Jekyll
  class AuthorPagesGenerator < Generator
    safe true
    priority :low

    def generate(site)
      return if generation_disabled?(site)

      authors = site.data["authors"]
      return unless authors.is_a?(Hash)

      generate_author_profiles(site, authors)
      generate_authors_index(site)
    end

    private

    def generate_author_profiles(site, authors)
      authors.each do |key, data|
        data ||= {}
        next if data["profile"] == false

        permalink = "/authors/#{Jekyll::Utils.slugify(key)}/"
        next if page_exists?(site, permalink)

        name = data["name"] || key
        Jekyll.logger.info "AuthorPagesGenerator:", "Generating profile #{permalink}"

        page = PageWithoutAFile.new(site, site.source, "", "#{key}.html")
        page.data.merge!(
          "layout"      => "author",
          "author_key"  => key,
          "title"       => name,
          "description" => data["bio"] || "Articles and content by #{name}.",
          "permalink"   => permalink,
          "sitemap"     => true,
          "sidebar"     => false,
          "hide_intro"  => true
        )
        page.content = ""

        site.pages << page
      end
    end

    def generate_authors_index(site)
      return if page_exists?(site, "/authors/")

      Jekyll.logger.info "AuthorPagesGenerator:", "Generating /authors/ index"

      page = PageWithoutAFile.new(site, site.source, "", "authors.html")
      page.data.merge!(
        "layout"      => "authors",
        "title"       => "Authors",
        "description" => "Meet the people behind the content.",
        "permalink"   => "/authors/",
        "sidebar"     => false,
        "hide_intro"  => true
      )
      page.content = ""

      site.pages << page
    end

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    def page_exists?(site, permalink)
      normalized = permalink.chomp("/")
      site.pages.any? do |p|
        url = (p.url || "").chomp("/")
        perm = (p.permalink || "").chomp("/")
        url == normalized || url == permalink || perm == normalized || perm == permalink
      end
    end

    def generation_disabled?(site)
      site.config.dig("authors", "generate_pages") == false
    end
  end
end
