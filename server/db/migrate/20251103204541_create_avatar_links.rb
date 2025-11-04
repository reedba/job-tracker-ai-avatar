class CreateAvatarLinks < ActiveRecord::Migration[8.0]
  def change
    create_table :avatar_links do |t|
      t.string :token, null: false
      t.references :creator, null: false, foreign_key: { to_table: :users }
      t.string :name
      t.datetime :expires_at
      t.integer :max_uses, null: false, default: 1
      t.integer :used_count, null: false, default: 0
      t.boolean :active, null: false, default: true

      t.timestamps
    end

    add_index :avatar_links, :token, unique: true
  end
end
