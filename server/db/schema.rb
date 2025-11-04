# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.0].define(version: 2025_11_03_204541) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "applications", force: :cascade do |t|
    t.string "title", null: false
    t.string "job_level"
    t.date "date_submitted", null: false
    t.string "employment_type", default: "direct_hire"
    t.string "work_mode", default: "onsite"
    t.string "job_posting_url"
    t.string "job_external_id"
    t.bigint "company_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["company_id", "job_external_id"], name: "index_applications_on_company_id_and_job_external_id", unique: true, where: "((job_external_id IS NOT NULL) AND ((job_external_id)::text <> ''::text))"
    t.index ["company_id"], name: "index_applications_on_company_id"
    t.check_constraint "employment_type::text = ANY (ARRAY['contractor'::character varying, 'direct_hire'::character varying]::text[])", name: "check_valid_employment_type"
    t.check_constraint "work_mode::text = ANY (ARRAY['remote'::character varying, 'hybrid'::character varying, 'onsite'::character varying]::text[])", name: "check_valid_work_mode"
  end

  create_table "avatar_links", force: :cascade do |t|
    t.string "token", null: false
    t.bigint "creator_id", null: false
    t.string "name"
    t.datetime "expires_at"
    t.integer "max_uses", default: 1, null: false
    t.integer "used_count", default: 0, null: false
    t.boolean "active", default: true, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["creator_id"], name: "index_avatar_links_on_creator_id"
    t.index ["token"], name: "index_avatar_links_on_token", unique: true
  end

  create_table "companies", force: :cascade do |t|
    t.string "name", null: false
    t.string "webpage"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.boolean "favorited", default: false, null: false
    t.integer "applications_count", default: 0, null: false
    t.index ["user_id"], name: "index_companies_on_user_id"
  end

  create_table "contacts", force: :cascade do |t|
    t.bigint "company_id", null: false
    t.string "email"
    t.string "phone"
    t.string "linkedin_url"
    t.text "notes"
    t.date "dates_contacted", default: [], array: true
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "first_name", null: false
    t.string "last_name", null: false
    t.string "title"
    t.index ["company_id"], name: "index_contacts_on_company_id"
    t.index ["dates_contacted"], name: "index_contacts_on_dates_contacted", using: :gin
  end

  create_table "settings", force: :cascade do |t|
    t.integer "application_monthly_goal"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["user_id"], name: "index_settings_on_user_id"
  end

  create_table "users", force: :cascade do |t|
    t.string "email", null: false
    t.string "password_digest", null: false
    t.string "phone_number"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "first_name", default: "", null: false
    t.string "last_name", default: "", null: false
    t.boolean "is_admin", default: false, null: false
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["first_name", "last_name"], name: "index_users_on_first_name_and_last_name"
    t.index ["phone_number"], name: "index_users_on_phone_number", unique: true
  end

  add_foreign_key "applications", "companies"
  add_foreign_key "avatar_links", "users", column: "creator_id"
  add_foreign_key "companies", "users"
  add_foreign_key "contacts", "companies"
  add_foreign_key "settings", "users"
end
