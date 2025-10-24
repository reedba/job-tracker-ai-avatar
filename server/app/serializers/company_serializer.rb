class CompanySerializer < ActiveModel::Serializer
  attributes :id, :name, :webpage, :favorited, :applications_count, :last_application_date

  def applications_count
    return object.applications_count if object.respond_to?(:applications_count)
    object.applications.length
  end

  def last_application_date
    return nil if object.applications.empty?
    latest = object.applications.max_by(&:date_submitted)
    latest&.date_submitted&.iso8601
  end
end