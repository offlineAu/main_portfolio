class AddSecurityHardening < ActiveRecord::Migration[8.1]
  def change
    change_table :users do |t|
      t.text :otp_secret
      t.datetime :otp_enabled_at
      t.bigint :otp_last_used_step
      t.jsonb :otp_recovery_digests, default: [], null: false
    end

    add_column :sessions, :last_seen_at, :datetime
    add_index :sessions, :last_seen_at

    create_table :audit_events do |t|
      t.references :user, foreign_key: { on_delete: :nullify }
      t.string :action, null: false
      t.string :subject_type
      t.string :subject_id
      t.string :subject_label
      t.string :ip_address
      t.string :user_agent
      t.jsonb :details, default: {}, null: false
      t.datetime :created_at, null: false
      t.index :created_at
    end

    add_column :projects, :watermark, :boolean, default: true, null: false
    add_column :profiles, :watermark_portrait, :boolean, default: false, null: false
  end
end
