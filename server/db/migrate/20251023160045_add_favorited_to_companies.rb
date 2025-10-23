class AddFavoritedToCompanies < ActiveRecord::Migration[8.0]
  def change
    add_column :companies, :favorited, :boolean, default: false, null: false
  end
end
