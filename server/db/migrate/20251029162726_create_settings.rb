class CreateSettings < ActiveRecord::Migration[8.0]
  def change
    create_table :settings do |t|
      t.integer :application_monthly_goal

      t.timestamps
    end
  end
end
