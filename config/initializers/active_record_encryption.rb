# Encrypts the owner's two-factor secret at rest. Explicit keys can be supplied through the
# environment; otherwise they are derived from secret_key_base. Rotating SECRET_KEY_BASE without
# setting these keys makes the stored secret unreadable: run bin/rails owner:reset_two_factor.
Rails.application.config.after_initialize do
  key = ->(name, env) { ENV[env].presence || Rails.application.key_generator.generate_key("active_record_encryption/#{name}", 32).unpack1("H*") }
  ActiveRecord::Encryption.configure(
    primary_key: key.("primary_key", "ACTIVE_RECORD_ENCRYPTION_PRIMARY_KEY"),
    deterministic_key: key.("deterministic_key", "ACTIVE_RECORD_ENCRYPTION_DETERMINISTIC_KEY"),
    key_derivation_salt: key.("key_derivation_salt", "ACTIVE_RECORD_ENCRYPTION_KEY_DERIVATION_SALT")
  )
end
