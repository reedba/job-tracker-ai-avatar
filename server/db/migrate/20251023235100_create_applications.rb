class CreateApplications < ActiveRecord::Migration[8.0]
  def change
    create_table :applications do |t|
      t.string :title, null: false
      t.string :job_level
      t.date :date_submitted, null: false
      t.string :employment_type, default: 'direct_hire'
      t.string :work_mode, default: 'onsite'
      t.string :job_posting_url
      t.string :job_external_id
      t.references :company, null: false, foreign_key: true, index: true

      # Add check constraint for employment_type
      t.check_constraint "employment_type IN ('contractor', 'direct_hire')", name: 'check_valid_employment_type'
      # Add check constraint for work_mode
      t.check_constraint "work_mode IN ('remote', 'hybrid', 'onsite')", name: 'check_valid_work_mode'

      t.timestamps
    end

    add_index :applications, [:company_id, :job_external_id], unique: true, where: "job_external_id IS NOT NULL"
  end
end
