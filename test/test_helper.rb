ENV["RAILS_ENV"] ||= "test"
require_relative "../config/environment"
require "rails/test_help"

ActiveRecord::Migration.maintain_test_schema!
load Rails.root.join("db/seeds.rb")

class ActiveSupport::TestCase
  self.use_transactional_tests = true
end
