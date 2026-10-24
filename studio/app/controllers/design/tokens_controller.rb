# frozen_string_literal: true

module Design
  # The token files and their mirrors. A save renders the page again with the
  # parity script's verdict rather than redirecting, so the result stays on
  # screen.
  class TokensController < ApplicationController
    before_action :load_editor, except: :index

    def index
      @editors = TokenEditor.all
    end

    def show; end

    def update
      @parity = @editor.update(changes, base_digest: params[:base_digest])
      @notice = @parity.ok? ? "Saved. design-system-check: OK." : "Saved, but design-system-check reports drift — see its output below and the Doctor."
      render :show
    end

    def diff
      @diff = @editor.diff(changes)
      render "shared/diff", layout: false
    end

    private

    def load_editor
      @editor = TokenEditor.new(params[:id])
    end

    def changes
      params.fetch(:tokens, {}).permit!.to_h
    end
  end
end
