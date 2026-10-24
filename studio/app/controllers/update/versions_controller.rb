# frozen_string_literal: true

module Update
  # The version files in lockstep and the top of the changelog.
  class VersionsController < ApplicationController
    def show
      @rows = VersionFiles.read
      @changelog = changelog_head
      @last_dry_run = Job.latest("release_dry_run")
    end

    private

    def changelog_head
      ThemeRoot.read("CHANGELOG.md").first.lines.first(40).join
    rescue ConfinedPath::Refused
      ""
    end
  end
end
