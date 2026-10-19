class AddResumeDetailsToProfiles < ActiveRecord::Migration[8.1]
  def change
    add_column :profiles, :phone, :string
    add_column :profiles, :website_url, :string
    add_column :profiles, :education, :text
  end
end
