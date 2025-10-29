class User < ApplicationRecord
  has_secure_password

  # Associations
  has_many :companies, dependent: :destroy
  has_one :setting, dependent: :destroy

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

  # Name methods
  def full_name
    "#{first_name} #{last_name}".strip
  end

  # Role methods - simplified to just admin
  def make_admin!
    update!(is_admin: true)
  end

  def remove_admin!
    update!(is_admin: false)
  end

  def can_manage_users?
    is_admin?
  end
end