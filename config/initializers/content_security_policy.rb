Rails.application.configure do
  config.content_security_policy do |policy|
    policy.default_src :self
    policy.script_src :self
    # No 'unsafe-inline': markup carries no style attributes, and Turbo's progress bar uses the nonce.
    policy.style_src :self
    policy.font_src :self
    policy.img_src :self, :data
    policy.connect_src :self
    policy.object_src :none
    policy.base_uri :self
    policy.form_action :self
    policy.frame_ancestors :none
    policy.upgrade_insecure_requests true if Rails.env.production?
    policy.report_uri "/csp-reports"
  end
  config.content_security_policy_nonce_generator = ->(_request) { SecureRandom.base64(16) }
  config.content_security_policy_nonce_directives = %w[script-src style-src]

  # Headers beyond the Rails defaults (which already send nosniff, Referrer-Policy and frame protection).
  config.action_dispatch.default_headers.merge!(
    "Permissions-Policy" => "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
    "Cross-Origin-Opener-Policy" => "same-origin",
    "Referrer-Policy" => "strict-origin-when-cross-origin"
  )
end
