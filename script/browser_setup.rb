# Only the browser suite's isolated database may receive these test credentials.
abort "Browser setup is restricted to its isolated development database." unless ENV["PORTFOLIO_BROWSER_TEST"] == "1" && Rails.env.development? && ActiveRecord::Base.connection_db_config.database == "airl_portfolio_browser"
owner = User.first || User.new
owner.update!(email_address: "browser-test@example.com", password: "browser-test-only-password")
owner.sessions.destroy_all

# Ensure the story pilot has its real screenshot even in older browser databases.
veloce = Project.find_by!(slug: 'veloce')
unless veloce.cover.attached?
  veloce.cover.attach(io: File.open(Rails.root.join('db/content/veloce.webp')), filename: 'veloce.webp', content_type: 'image/webp')
end
