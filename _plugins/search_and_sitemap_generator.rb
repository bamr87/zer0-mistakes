# Feature: ZER0-042
# frozen_string_literal: true

#
# File: search_and_sitemap_generator.rb
# Path: _plugins/search_and_sitemap_generator.rb
# Purpose: Auto-generate /search.json and /sitemap/ endpoints for downstream
#          sites consuming this theme, so they work out of the box without
#          requiring users to manually create these files.
#
# The search modal (search-modal.js) fetches /search.json and the modal form
# action targets /sitemap/. This generator ensures both endpoints exist even
# when the consuming site hasn't created them.
#
# Behaviour:
#   - If the site already has a page at /search.json, no page is generated.
#   - If the site already has a page at /sitemap/, no page is generated.
#   - Generation can be disabled via _config.yml:
#       search:
#         generate_index: false
#       sitemap_page:
#         generate: false
#

module Jekyll
  class SearchAndSitemapGenerator < Generator
    safe true
    priority :low

    def generate(site)
      generate_search_json(site)
      generate_sitemap_page(site)
    end

    private

    # ------------------------------------------------------------------
    # /search.json — uses _layouts/search.html which includes search-data.json
    # ------------------------------------------------------------------
    def generate_search_json(site)
      return if search_index_disabled?(site)
      return if page_exists?(site, "/search.json")

      Jekyll.logger.info "SearchAndSitemapGenerator:", "Auto-generating /search.json endpoint"

      page = PageWithoutFile.new(site, site.source, "", "search.json")
      page.data.merge!(
        "layout"    => "search",
        "permalink" => "/search.json",
        "sitemap"   => false
      )
      page.content = ""

      site.pages << page
    end

    # ------------------------------------------------------------------
    # /sitemap/ — uses _layouts/sitemap-collection.html
    # ------------------------------------------------------------------
    def generate_sitemap_page(site)
      return if sitemap_page_disabled?(site)
      return if page_exists?(site, "/sitemap/")

      Jekyll.logger.info "SearchAndSitemapGenerator:", "Auto-generating /sitemap/ endpoint"

      page = PageWithoutFile.new(site, site.source, "", "sitemap.html")
      page.data.merge!(
        "layout"      => "sitemap-collection",
        "title"       => "Site Map",
        "description" => "Complete site overview with navigation and content discovery tools",
        "permalink"   => "/sitemap/",
        "sidebar"     => false,
        "collection"  => "all"
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

    def search_index_disabled?(site)
      site.config.dig("search", "generate_index") == false
    end

    def sitemap_page_disabled?(site)
      site.config.dig("sitemap_page", "generate") == false
    end
  end
end
