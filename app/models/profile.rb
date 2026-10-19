class Profile < ApplicationRecord
  include ImageUploads
  include WebLinks
  has_one_attached :portrait
  validates :name, :short_name, :title, :email, :introduction, presence: true
  validates :email, format: { with: URI::MailTo::EMAIL_REGEXP }
  web_links :github_url, :linkedin_url, :website_url

  def self.current
    first!
  end
end
