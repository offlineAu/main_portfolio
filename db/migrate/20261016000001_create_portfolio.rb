class CreatePortfolio < ActiveRecord::Migration[8.1]
  def change
    create_table :profiles do |t|
      t.string :name, :short_name, :handle, :title, :location, :email, :github_url, :linkedin_url, :availability, :portrait_alt
      t.text :introduction, :about, :focus, :credentials
      t.timestamps
    end
    create_table :projects do |t|
      t.string :name, :slug, :tagline, :role, :year, :source_url, :live_url, :cover_alt, :gallery_alt
      t.string :category, default: "Web application", null: false
      t.string :status, default: "In development", null: false
      t.text :description, :problem, :contribution, :implementation, :editorial_notes
      t.jsonb :technologies, default: [], null: false
      t.jsonb :highlights, default: [], null: false
      t.jsonb :gallery_details, default: {}, null: false
      t.boolean :featured, :published, default: false, null: false
      t.integer :position, default: 0, null: false
      t.timestamps
    end
    add_index :projects, :slug, unique: true
    add_index :projects, [:published, :position]
    create_table :skills do |t|
      t.string :name, :category
      t.text :note
      t.integer :position, default: 0, null: false
      t.timestamps
    end
    create_table :experiences do |t|
      t.string :role, :organization, :period
      t.text :details
      t.boolean :current, default: false, null: false
      t.integer :position, default: 0, null: false
      t.timestamps
    end
    create_table :users do |t|
      t.string :email_address, null: false
      t.string :password_digest, null: false
      t.timestamps
    end
    add_index :users, :email_address, unique: true
    create_table :sessions do |t|
      t.references :user, null: false, foreign_key: true
      t.string :ip_address, :user_agent
      t.timestamps
    end
  end
end
