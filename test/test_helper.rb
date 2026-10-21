ENV["RAILS_ENV"] ||= "test"
require_relative "../config/environment"
require "rails/test_help"

ActiveRecord::Migration.maintain_test_schema!
load Rails.root.join("db/seeds.rb")

class ActiveSupport::TestCase
  self.use_transactional_tests = true
  # Rate-limit counters live in the cache; start every test with a clean slate.
  setup { Rails.cache.clear }
end

module OwnerSignIn
  OWNER_PASSWORD = "a-test-password-123"

  def create_owner(two_factor: true)
    owner = User.create!(email_address: "owner@example.com", password: OWNER_PASSWORD)
    @recovery_codes = owner.enable_two_factor!(User.generate_otp_secret) if two_factor
    owner
  end

  def current_code(user, at: Time.current)
    ROTP::TOTP.new(user.reload.otp_secret).at(at)
  end

  def sign_in(user = @owner, code: nil)
    post session_path, params: { email_address: user.email_address, password: OWNER_PASSWORD }
    if user.two_factor_enabled?
      assert_redirected_to new_session_two_factor_path
      # Each code is accepted once; move to the next 30-second step for repeat sign-ins.
      travel ROTP::DEFAULT_INTERVAL.seconds if code.nil? && user.reload.otp_last_used_step
      post session_two_factor_path, params: { code: code || current_code(user) }
    end
    assert_redirected_to admin_root_path
  end
end
