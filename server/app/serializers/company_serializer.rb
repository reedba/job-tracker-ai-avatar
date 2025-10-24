class CompanySerializer < ActiveModel::Serializer
  attributes :id, :name, :webpage, :favorited, :applications_count

  def applications_count
    object.applications_count || 0
  end
end