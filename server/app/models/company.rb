class Company < ApplicationRecord
  # Associations
  belongs_to :user

  # Validations
  validates :name, presence: true

  # Optional webpage validation - ensures URL format if provided
  validates :webpage, format: { with: URI::DEFAULT_PARSER.make_regexp }, allow_blank: true
end
