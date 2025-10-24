class AddApplicationsCountToCompanies < ActiveRecord::Migration[8.0]
  def up
    add_column :companies, :applications_count, :integer, null: false, default: 0

    # Reset counter cache
    Company.find_each { |company| Company.reset_counters(company.id, :applications) }
  end

  def down
    remove_column :companies, :applications_count
  end
end
