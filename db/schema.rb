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

ActiveRecord::Schema[8.1].define(version: 2026_10_21_090100) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "active_storage_attachments", force: :cascade do |t|
    t.string "name", null: false
    t.string "record_type", null: false
    t.bigint "record_id", null: false
    t.bigint "blob_id", null: false
    t.datetime "created_at", null: false
    t.index ["blob_id"], name: "index_active_storage_attachments_on_blob_id"
    t.index ["record_type", "record_id", "name", "blob_id"], name: "index_active_storage_attachments_uniqueness", unique: true
  end

  create_table "active_storage_blobs", force: :cascade do |t|
    t.string "key", null: false
    t.string "filename", null: false
    t.string "content_type"
    t.text "metadata"
    t.string "service_name", null: false
    t.bigint "byte_size", null: false
    t.string "checksum"
    t.datetime "created_at", null: false
    t.index ["key"], name: "index_active_storage_blobs_on_key", unique: true
  end

  create_table "active_storage_variant_records", force: :cascade do |t|
    t.bigint "blob_id", null: false
    t.string "variation_digest", null: false
    t.index ["blob_id", "variation_digest"], name: "index_active_storage_variant_records_uniqueness", unique: true
  end

  create_table "audit_events", force: :cascade do |t|
    t.bigint "user_id"
    t.string "action", null: false
    t.string "subject_type"
    t.string "subject_id"
    t.string "subject_label"
    t.string "ip_address"
    t.string "user_agent"
    t.jsonb "details", default: {}, null: false
    t.datetime "created_at", null: false
    t.index ["created_at"], name: "index_audit_events_on_created_at"
    t.index ["user_id"], name: "index_audit_events_on_user_id"
  end

  create_table "experiences", force: :cascade do |t|
    t.string "role"
    t.string "organization"
    t.string "period"
    t.text "details"
    t.boolean "current", default: false, null: false
    t.integer "position", default: 0, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "profiles", force: :cascade do |t|
    t.string "name"
    t.string "short_name"
    t.string "handle"
    t.string "title"
    t.string "location"
    t.string "email"
    t.string "github_url"
    t.string "linkedin_url"
    t.string "availability"
    t.string "portrait_alt"
    t.text "introduction"
    t.text "about"
    t.text "focus"
    t.text "credentials"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "phone"
    t.string "website_url"
    t.text "education"
    t.boolean "watermark_portrait", default: false, null: false
  end

  create_table "projects", force: :cascade do |t|
    t.string "name"
    t.string "slug"
    t.string "tagline"
    t.string "role"
    t.string "year"
    t.string "source_url"
    t.string "live_url"
    t.string "cover_alt"
    t.string "gallery_alt"
    t.string "category", default: "Web application", null: false
    t.string "status", default: "In development", null: false
    t.text "description"
    t.text "problem"
    t.text "contribution"
    t.text "implementation"
    t.text "editorial_notes"
    t.jsonb "technologies", default: [], null: false
    t.jsonb "highlights", default: [], null: false
    t.jsonb "gallery_details", default: {}, null: false
    t.boolean "featured", default: false, null: false
    t.boolean "published", default: false, null: false
    t.integer "position", default: 0, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.boolean "watermark", default: true, null: false
    t.index ["published", "position"], name: "index_projects_on_published_and_position"
    t.index ["slug"], name: "index_projects_on_slug", unique: true
  end

  create_table "sessions", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.string "ip_address"
    t.string "user_agent"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.datetime "last_seen_at"
    t.index ["last_seen_at"], name: "index_sessions_on_last_seen_at"
    t.index ["user_id"], name: "index_sessions_on_user_id"
  end

  create_table "skills", force: :cascade do |t|
    t.string "name"
    t.string "category"
    t.text "note"
    t.integer "position", default: 0, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "solid_cache_entries", force: :cascade do |t|
    t.binary "key", null: false
    t.binary "value", null: false
    t.datetime "created_at", null: false
    t.bigint "key_hash", null: false
    t.integer "byte_size", null: false
    t.index ["byte_size"], name: "index_solid_cache_entries_on_byte_size"
    t.index ["key_hash", "byte_size"], name: "index_solid_cache_entries_on_key_hash_and_byte_size"
    t.index ["key_hash"], name: "index_solid_cache_entries_on_key_hash", unique: true
  end

  create_table "users", force: :cascade do |t|
    t.string "email_address", null: false
    t.string "password_digest", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.text "otp_secret"
    t.datetime "otp_enabled_at"
    t.bigint "otp_last_used_step"
    t.jsonb "otp_recovery_digests", default: [], null: false
    t.index ["email_address"], name: "index_users_on_email_address", unique: true
  end

  add_foreign_key "active_storage_attachments", "active_storage_blobs", column: "blob_id"
  add_foreign_key "active_storage_variant_records", "active_storage_blobs", column: "blob_id"
  add_foreign_key "audit_events", "users", on_delete: :nullify
  add_foreign_key "sessions", "users"
end
