class User < ApplicationRecord
  has_secure_password

  # Associations
  has_many :companies, dependent: :destroy

  # Constants for roles
  AVAILABLE_ROLES = %w[user admin manager recruiter candidate superuser].freeze

  # Validations
  validates :email, presence: true, 
                   uniqueness: true,
                   format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :password,
            presence: true,
            on: :create,
            length: { minimum: 6 },
            format: { 
              with: /\A(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]{6,}\z/,
              message: 'must include at least one uppercase letter, one lowercase letter, one number, and one special character'
            }
  validates :phone_number, uniqueness: true, 
                         format: { with: /\A\+?\d{10,15}\z/ }, 
                         allow_blank: true
  validates :first_name, presence: true
  validates :last_name, presence: true
  validate :validate_roles

  # Callbacks
  before_validation :set_default_role

  # Name methods
  def full_name
    "#{first_name} #{last_name}".strip
  end

  # Role methods
  def add_role(role)
    role = role.to_s.downcase
    return unless AVAILABLE_ROLES.include?(role)
    self.roles = (roles || []) << role
    self.roles = roles.uniq
  end

  def remove_role(role)
    role = role.to_s.downcase
    self.roles = (roles || []) - [role]
  end

  def has_role?(role)
    roles&.include?(role.to_s.downcase)
  end

  def is_admin?
    has_role?('admin')
  end

  def is_superuser?
    has_role?('superuser')
  end

  def can_manage_users?
    is_superuser? || is_admin?
  end

  private

  def validate_roles
    return if roles.nil?
    invalid_roles = roles - AVAILABLE_ROLES
    if invalid_roles.any?
      errors.add(:roles, "contains invalid roles: #{invalid_roles.join(', ')}")
    end
  end

  def set_default_role
    self.roles ||= ['user']
  end
end