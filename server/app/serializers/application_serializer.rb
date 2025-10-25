class ApplicationSerializer < ActiveModel::Serializer
  attributes :id, :title, :job_level, :date_submitted, :employment_type,
             :work_mode, :job_posting_url, :job_external_id, :created_at,
             :updated_at, :company_id

  # Include the company details for each application
  belongs_to :company

  def company
    CompanySerializer.new(object.company)
  end

  # Format the date_submitted for consistent handling
  def date_submitted
    object.date_submitted&.in_time_zone('Eastern Time (US & Canada)')&.iso8601
  end

  # Format employment_type for display
  def employment_type
    object.employment_type&.titleize
  end

  # Format work_mode for display
  def work_mode
    object.work_mode&.titleize
  end
end