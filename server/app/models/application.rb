class Application < ApplicationRecord
  # Associations
  belongs_to :company, counter_cache: true

  # Validations
  validates :title, presence: true
  validates :date_submitted, presence: true
  validates :job_external_id, 
            uniqueness: { scope: :company_id }, 
            allow_blank: true # This allows both nil and empty strings
  
  # Enums for standardized values
  enum :job_level, {
    entry: 'entry',
    mid: 'mid',
    senior: 'senior',
    lead: 'lead',
    manager: 'manager',
    director: 'director',
    executive: 'executive'
  }, default: nil

  enum :employment_type, {
    contractor: 'contractor',
    direct_hire: 'direct_hire'
  }, default: 'direct_hire'

  enum :work_mode, {
    remote: 'remote',
    hybrid: 'hybrid',
    onsite: 'onsite'
  }, default: 'onsite'

  # URL validation
  validates :job_posting_url, 
            format: { with: URI::DEFAULT_PARSER.make_regexp }, 
            allow_blank: true
end
