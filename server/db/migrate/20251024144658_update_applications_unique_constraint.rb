class UpdateApplicationsUniqueConstraint < ActiveRecord::Migration[8.0]
  def up
    # Remove the existing index
    remove_index :applications, [:company_id, :job_external_id], if_exists: true

    # Add the new index that only enforces uniqueness when job_external_id is not null and not empty
    execute <<-SQL
      CREATE UNIQUE INDEX index_applications_on_company_id_and_job_external_id 
      ON applications (company_id, job_external_id) 
      WHERE job_external_id IS NOT NULL AND job_external_id != '';
    SQL
  end

  def down
    remove_index :applications, [:company_id, :job_external_id], if_exists: true
    
    add_index :applications, [:company_id, :job_external_id], unique: true, 
              where: "job_external_id IS NOT NULL"
  end
end
