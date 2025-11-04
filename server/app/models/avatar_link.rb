class AvatarLink < ApplicationRecord
  belongs_to :creator, class_name: 'User'

  validates :token, presence: true, uniqueness: true
  validates :max_uses, numericality: { only_integer: true, greater_than: 0 }
  validates :used_count, numericality: { only_integer: true, greater_than_or_equal_to: 0 }

  scope :active_links, -> { where(active: true).where("expires_at IS NULL OR expires_at > ?", Time.current) }

  def active?
    active && (expires_at.nil? || expires_at > Time.current) && used_count < max_uses
  end

  # Atomically increment usage and deactivate if max reached
  def increment_use!
    with_lock do
      self.used_count += 1
      if used_count >= max_uses
        self.active = false
      end
      save!
    end
  end
end
