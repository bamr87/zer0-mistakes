# frozen_string_literal: true

# One run of a theme script or build, queued and executed by a background
# job. Jobs are the studio's audit trail: every doctor pass, preview build,
# consumer audit and release dry run lands here with the parameters it used
# and the log it produced.
#
# Copied from zer0-image-generator's Run.
class Job < ApplicationRecord
  KINDS = %w[theme_doctor preview_build audit_consumer release_dry_run propagate_report validate].freeze
  STATUSES = %w[pending running succeeded failed cancelled].freeze
  TERMINAL = %w[succeeded failed cancelled].freeze
  SITE_KINDS = %w[audit_consumer].freeze

  belongs_to :site, optional: true

  validates :kind, presence: true, inclusion: { in: KINDS }
  validates :status, presence: true, inclusion: { in: STATUSES }
  validate :site_matches_kind

  scope :recent, -> { order(created_at: :desc) }
  scope :active, -> { where(status: %w[pending running]) }
  scope :finished, -> { where(status: TERMINAL) }
  scope :of, ->(kind) { where(kind: kind) }

  def self.latest(kind)
    of(kind).finished.recent.first
  end

  def finished?
    TERMINAL.include?(status)
  end

  def running?
    status == "running"
  end

  def cancelled?
    status == "cancelled"
  end

  def duration
    return nil unless started_at

    (finished_at || Time.current) - started_at
  end

  def start!
    update!(status: "running", started_at: Time.current)
  end

  def finish!(stats: {})
    update!(status: "succeeded", stats: stats, finished_at: Time.current)
  end

  def fail!(message, stats: nil)
    update!(status: "failed", error: message.to_s[0, 2000], stats: stats || self.stats, finished_at: Time.current)
  end

  # Flips the status; the worker's interrupt notices on its next poll. A job
  # that never started is finished at once.
  def cancel!
    return false if finished?

    attributes = { status: "cancelled" }
    attributes[:finished_at] = Time.current unless running?
    update!(attributes)
    true
  end

  # Appends to the log with a single UPDATE rather than read-modify-write, so
  # the worker streaming into the job cannot lose lines.
  def append_log(text)
    return if text.blank?

    self.class.where(id: id).update_all([ "log = COALESCE(log, '') || ?, updated_at = ?", text, Time.current ])
  end

  def params_hash
    params.is_a?(Hash) ? params : {}
  end

  def stats_hash
    stats.is_a?(Hash) ? stats : {}
  end

  def title
    kind.tr("_", " ")
  end

  private

  def site_matches_kind
    if SITE_KINDS.include?(kind) && site_id.blank?
      errors.add(:site, "is required for a #{kind} job")
    elsif !SITE_KINDS.include?(kind) && site_id.present?
      errors.add(:site, "does not apply to a #{kind} job")
    end
  end
end
