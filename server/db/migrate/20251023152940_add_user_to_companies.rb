class AddUserToCompanies < ActiveRecord::Migration[8.0]
  def change
    add_reference :companies, :user, null: false, foreign_key: true
  end
end
