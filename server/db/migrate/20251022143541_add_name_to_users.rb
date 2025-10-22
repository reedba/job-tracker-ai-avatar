class AddNameToUsers < ActiveRecord::Migration[8.0]
  def change
    add_column :users, :first_name, :string, null: false, default: ""
    add_column :users, :last_name, :string, null: false, default: ""
    
    add_index :users, [:first_name, :last_name]
  end
end
