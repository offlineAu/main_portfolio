class Session < ApplicationRecord
  ABSOLUTE_LIFETIME = 14.days
  IDLE_TIMEOUT = 12.hours

  belongs_to :user
  scope :active, -> { where(created_at: ABSOLUTE_LIFETIME.ago..).where("COALESCE(last_seen_at, created_at) > ?", IDLE_TIMEOUT.ago) }
  scope :expired, -> { where(created_at: ...ABSOLUTE_LIFETIME.ago).or(where("COALESCE(last_seen_at, created_at) <= ?", IDLE_TIMEOUT.ago)) }

  def self.sweep
    expired.delete_all
  end

  # Records activity at most every few minutes so ordinary browsing doesn't write on every request.
  def touch_activity
    update_column(:last_seen_at, Time.current) if last_seen_at.nil? || last_seen_at < 5.minutes.ago
  end
end
