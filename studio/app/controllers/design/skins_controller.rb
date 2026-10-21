# frozen_string_literal: true

module Design
  # The palette skins: the palette, its mirror, backgrounds and contrast.
  class SkinsController < ApplicationController
    before_action :load_skin, except: :index

    def index
      @skins = SkinEditor.all
      @default = SkinEditor.default
    end

    def show
      @contrast = @skin.contrast
    end

    def update
      @parity = @skin.update(skin_params, base_digest: params[:base_digest])
      @contrast = @skin.contrast
      @notice = @parity.ok? ? "Saved. design-system-check: OK." : "Saved, but design-system-check reports drift — see its output below and the Doctor."
      render :show
    end

    def diff
      @diff = @skin.diff(skin_params)
      render "shared/diff", layout: false
    end

    def contrast
      @contrast = @skin.contrast(skin_params)
      render partial: "design/skins/contrast", locals: { contrast: @contrast }, layout: false
    end

    private

    def load_skin
      @skin = SkinEditor.new(params[:id])
    end

    def skin_params
      params.fetch(:skin, {}).permit(*SkinEditor::COLOR_FIELDS, *SkinEditor::BACKGROUND_FIELDS, :pattern_size).to_h
    end
  end
end
