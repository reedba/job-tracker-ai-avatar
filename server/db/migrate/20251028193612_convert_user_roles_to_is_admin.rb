class ConvertUserRolesToIsAdmin < ActiveRecord::Migration[8.0]
  def up
    # Add is_admin boolean column with default false
    add_column :users, :is_admin, :boolean, default: false, null: false

    # Update is_admin based on existing roles
    # Set is_admin to true for users who had 'admin' in their roles array
    execute <<-SQL
      UPDATE users 
      SET is_admin = true 
      WHERE roles @> ARRAY['admin']::varchar[];
    SQL

    # Remove the roles column and its index
    remove_index :users, :roles
    remove_column :users, :roles
  end

  def down
    # Recreate the roles array column
    add_column :users, :roles, :string, array: true, default: []
    add_index :users, :roles, using: :gin

    # Restore admin role for users who were admins
    execute <<-SQL
      UPDATE users 
      SET roles = ARRAY['admin']::varchar[] 
      WHERE is_admin = true;
    SQL

    # Remove is_admin column
    remove_column :users, :is_admin
  end
end
