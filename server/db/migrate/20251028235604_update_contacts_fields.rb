class UpdateContactsFields < ActiveRecord::Migration[8.0]
  def change
    # Split name into first_name and last_name
    add_column :contacts, :first_name, :string
    add_column :contacts, :last_name, :string
    add_column :contacts, :title, :string

    # Update existing records: split name into first_name and last_name
    reversible do |dir|
      dir.up do
        execute <<-SQL
          UPDATE contacts
          SET first_name = split_part(name, ' ', 1),
              last_name = CASE 
                WHEN position(' ' in name) > 0 
                THEN substring(name from position(' ' in name) + 1)
                ELSE ''
              END
        SQL
      end
    end

    # Make first_name and last_name not nullable
    change_column_null :contacts, :first_name, false
    change_column_null :contacts, :last_name, false

    # Remove the old name column
    remove_column :contacts, :name
    remove_column :contacts, :role # role is replaced by title
  end
end
