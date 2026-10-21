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

  desc "Turn off the owner's two-factor authentication and revoke every session (for a lost phone)"
  task reset_two_factor: :environment do
    owner = User.first or abort "No owner account exists."
    owner.reset_two_factor!
    owner.sessions.destroy_all
    puts "Two-factor was reset and all sessions were revoked. Sign in and set it up again."
  end

  desc "Delete expired admin sessions"
  task sweep_sessions: :environment do
    puts "Removed #{Session.sweep} expired sessions."
  end
end
