class Company < ApplicationRecord
  # Associations
  belongs_to :user
  has_many :applications, dependent: :destroy

  # Scopes
  scope :with_last_application_date, -> {
    select('companies.*, MAX(applications.date_submitted) as last_application_date')
      .left_joins(:applications)
      .group('companies.id')
  }

  # Validations
  validates :name, presence: true

  # Optional webpage validation - ensures URL format if provided
  validates :webpage, format: { with: URI::DEFAULT_PARSER.make_regexp }, allow_blank: true
end
