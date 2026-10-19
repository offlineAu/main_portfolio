# Only the browser suite's isolated database may receive these test credentials.
abort "Browser setup is restricted to its isolated development database." unless ENV["PORTFOLIO_BROWSER_TEST"] == "1" && Rails.env.development? && ActiveRecord::Base.connection_db_config.database == "airl_portfolio_browser"
owner = User.first || User.new
owner.update!(email_address: "browser-test@example.com", password: "browser-test-only-password")
owner.sessions.destroy_all
