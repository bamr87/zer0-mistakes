# frozen_string_literal: true

# How an editor's refusals reach the browser: a stale digest is a 409, a bad
# value or a path outside the allow-list a 422, a file that is not there a
# 404. Rendered as a page, or as the fragment a diff/contrast box swaps in.
module EditorErrors
  extend ActiveSupport::Concern

  # rescue_from picks the LAST matching handler, so the subclass (NotFound)
  # is declared after its parent (Refused).
  included do
    rescue_from AtomicWrite::Stale, with: -> (e) { editor_error(e, :conflict) }
    rescue_from AtomicWrite::Refused, BlockRewriter::Error, ScriptRunner::Refused,
                TokenEditor::Invalid, SkinEditor::Invalid, SiteThemeConfig::Invalid,
                ConfinedPath::Refused,
                with: -> (e) { editor_error(e, :unprocessable_content) }
    rescue_from ConfinedPath::NotFound, ActiveRecord::RecordNotFound, with: -> (e) { editor_error(e, :not_found) }
  end

  private

  def editor_error(error, status)
    @error_message = error.message
    render "shared/error", status: status, layout: !request.xhr? && !turbo_frame_request?
  end
end
