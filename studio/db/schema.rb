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

ActiveRecord::Schema[8.1].define(version: 2026_10_21_000002) do
  create_table "jobs", force: :cascade do |t|
    t.string "kind", null: false
    t.string "status", default: "pending", null: false
    t.integer "site_id"
    t.json "params", default: {}, null: false
    t.text "log"
    t.json "stats", default: {}, null: false
    t.text "error"
    t.string "artifact_dir"
    t.datetime "started_at"
    t.datetime "finished_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["kind", "created_at"], name: "index_jobs_on_kind_and_created_at"
    t.index ["site_id"], name: "index_jobs_on_site_id"
    t.index ["status"], name: "index_jobs_on_status"
  end

  create_table "sites", force: :cascade do |t|
    t.string "name", null: false
    t.string "path", null: false
    t.string "repo"
    t.string "mode", default: "unknown", null: false
    t.string "source_subdir"
    t.string "registered_from", default: "form", null: false
    t.datetime "last_audit_at"
    t.json "last_audit_summary", default: {}, null: false
    t.text "notes"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["name"], name: "index_sites_on_name"
    t.index ["path"], name: "index_sites_on_path", unique: true
  end

  add_foreign_key "jobs", "sites"
end
