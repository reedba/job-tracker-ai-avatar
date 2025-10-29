class AddUserToSettings < ActiveRecord::Migration[8.0]
  def change
    add_reference :settings, :user, null: false, foreign_key: true
  end
end
