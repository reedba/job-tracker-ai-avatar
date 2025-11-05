class AvatarLink < ApplicationRecord
  belongs_to :creator, class_name: 'User'

  validates :token, presence: true, uniqueness: true
  validates :max_uses, numericality: { only_integer: true, greater_than: 0 }
  validates :used_count, numericality: { only_integer: true, greater_than_or_equal_to: 0 }

  scope :active_links, -> { where(active: true).where("expires_at IS NULL OR expires_at > ?", Time.current) }

  # Active means the link is marked active, has not passed its expiry time,
  # and has not been consumed by a session yet.
  def active?
    active && (expires_at.nil? || expires_at > Time.current) && used_count == 0
  end

  # For ActionCable connections: allow consumed links that haven't expired
  def valid_for_connection?
    active && (expires_at.nil? || expires_at > Time.current)
  end

  # Mark this link as consumed after starting a session (but keep it active for connection)
  def consume!
    increment!(:used_count)
    # Don't deactivate - let it stay active for ActionCable connection
  end

  # Check if link can start a new session (not consumed)
  def can_start_session?
    active? && used_count == 0
  end
end
