class Contact < ApplicationRecord
  belongs_to :company
  validates :name, presence: true
  validates :email, format: { with: URI::MailTo::EMAIL_REGEXP }, allow_blank: true
  validates :linkedin_url, format: { with: URI::DEFAULT_PARSER.make_regexp }, allow_blank: true
end