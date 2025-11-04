class AvatarLink < ApplicationRecord
  belongs_to :creator, class_name: 'User'

  validates :token, presence: true, uniqueness: true
  validates :max_uses, numericality: { only_integer: true, greater_than: 0 }
  validates :used_count, numericality: { only_integer: true, greater_than_or_equal_to: 0 }

  scope :active_links, -> { where(active: true).where("expires_at IS NULL OR expires_at > ?", Time.current) }

  # Active means the link is marked active and has not passed its expiry time.
  # We intentionally do NOT track or enforce a maximum number of uses here;
  # session lifetime is governed by the short-lived session JWT issued at
  # `start_session`. This keeps links usable by multiple visitors until the
  # expires_at timestamp (if present) elapses.
  def active?
    active && (expires_at.nil? || expires_at > Time.current)
  end

  # Historically we incremented a usage counter and disabled the link when
  # max_uses was reached. That behavior has been removed; keep a no-op
  # method for backward compatibility in case callers still call it.
  def increment_use!
    # no-op: usage counts are no longer enforced
    true
  end
end
