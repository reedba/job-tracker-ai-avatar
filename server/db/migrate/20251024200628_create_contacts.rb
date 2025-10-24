class CreateContacts < ActiveRecord::Migration[8.0]
  def change
    create_table :contacts do |t|
      t.references :company, null: false, foreign_key: true
      t.string :name
      t.string :role
      t.string :email
      t.string :phone
      t.string :linkedin_url
      t.text :notes
      t.date :dates_contacted, array: true, default: []
      t.timestamps
    end

    add_index :contacts, :dates_contacted, using: 'gin'
  end
end
