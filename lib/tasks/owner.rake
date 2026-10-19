require "io/console"

namespace :owner do
  desc "Create or update the single owner's credentials (prompts securely; no passwords in shell history)"
  task setup: :environment do
    print "Owner email: "
    email = $stdin.gets&.strip
    abort "Email is required." if email.blank?
    abort "Run this task in an interactive terminal." unless $stdin.tty?
    print "Password (12+ characters): "
    password = $stdin.noecho(&:gets)&.chomp
    puts
    print "Confirm password: "
    confirmation = $stdin.noecho(&:gets)&.chomp
    puts
    owner = User.first || User.new
    owner.update!(email_address: email, password: password, password_confirmation: confirmation)
    owner.sessions.destroy_all
    puts "Owner credentials saved. Existing sessions were revoked."
  end
end
