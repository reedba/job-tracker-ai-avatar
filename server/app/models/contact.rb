class Contact < ApplicationRecord
  belongs_to :company
  
  validates :first_name, presence: true
  validates :last_name, presence: true
  validates :email, format: { with: URI::MailTo::EMAIL_REGEXP }, allow_blank: true, uniqueness: { case_sensitive: false }
  validates :company_id, presence: true
end