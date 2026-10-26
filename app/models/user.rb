require "rotp"

class User < ApplicationRecord
  OTP_ISSUER = "Au portfolio"
  RECOVERY_CODE_COUNT = 10

  has_secure_password
  has_many :sessions, dependent: :destroy
  encrypts :otp_secret
  normalizes :email_address, with: ->(email) { email.strip.downcase }
  validates :email_address, presence: true, uniqueness: true, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :password, length: { minimum: 12 }, allow_nil: true

  def self.generate_otp_secret
    ROTP::Base32.random
  end

  def two_factor_enabled?
    otp_enabled_at.present? && otp_secret.present?
  end

  def otp_provisioning_uri(secret = otp_secret)
    ROTP::TOTP.new(secret, issuer: OTP_ISSUER).provisioning_uri(email_address)
  end

  # Turns on two-factor with a confirmed secret and returns fresh recovery codes to show once.
  def enable_two_factor!(secret)
    codes = new_recovery_codes
    update!(otp_secret: secret, otp_enabled_at: Time.current, otp_last_used_step: nil, otp_recovery_digests: codes.map { |code| digest(code) })
    codes
  end

  def regenerate_recovery_codes!
    codes = new_recovery_codes
    update!(otp_recovery_digests: codes.map { |code| digest(code) })
    codes
  end

  def reset_two_factor!
    update!(otp_secret: nil, otp_enabled_at: nil, otp_last_used_step: nil, otp_recovery_digests: [])
  end

  # Accepts a current authenticator code (each step only once) or an unused recovery code.
  def verify_second_factor(code)
    code = code.to_s.strip.downcase
    return false unless two_factor_enabled? && code.present?
    return consume_recovery_code(code) unless code.match?(/\A\d{6}\z/)

    after = otp_last_used_step && otp_last_used_step * ROTP::DEFAULT_INTERVAL
    timestamp = ROTP::TOTP.new(otp_secret, issuer: OTP_ISSUER).verify(code, drift_behind: 30, drift_ahead: 15, after: after)
    timestamp.present? && update!(otp_last_used_step: timestamp / ROTP::DEFAULT_INTERVAL)
  end

  def self.otp_code_valid?(secret, code)
    ROTP::TOTP.new(secret, issuer: OTP_ISSUER).verify(code.to_s.strip, drift_behind: 30, drift_ahead: 15).present?
  end

  private

  def new_recovery_codes
    Array.new(RECOVERY_CODE_COUNT) { SecureRandom.alphanumeric(10).downcase.scan(/.{5}/).join("-") }
  end

  def consume_recovery_code(code)
    match = otp_recovery_digests.find { |stored| ActiveSupport::SecurityUtils.secure_compare(stored, digest(code)) }
    match.present? && update!(otp_recovery_digests: otp_recovery_digests - [match])
  end

  def digest(code)
    OpenSSL::HMAC.hexdigest("SHA256", Rails.application.key_generator.generate_key("recovery_codes"), code.delete("-"))
  end
end
