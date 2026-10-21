# frozen_string_literal: true

module Sites
  # The theme keys of one site's _config.yml.
  class ThemeConfigsController < ApplicationController
    before_action :load

    def show; end

    def update
      @editor.update(config_params, base_digest: params[:base_digest])
      redirect_to site_theme_config_path(@site), notice: "#{@site.name}/_config.yml saved."
    end

    def diff
      @diff = @editor.diff(config_params)
      render "shared/diff", layout: false
    end

    private

    def load
      @site = Site.find(params[:site_id])
      @editor = SiteThemeConfig.new(@site)
      @current = @editor.current
    end

    def config_params
      params.fetch(:config, {}).permit(*SiteThemeConfig::SCALARS.keys,
                                       theme_background: SiteThemeConfig::BACKGROUND.keys, theme_color: {}).to_h
    end
  end
end
