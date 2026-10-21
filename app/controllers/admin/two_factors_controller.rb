module Admin
  # Enrolment: the secret lives only in the encrypted session cookie until a code confirms it.
  class TwoFactorsController < BaseController
    skip_before_action :require_two_factor
    before_action -> { redirect_to admin_security_path if Current.user.two_factor_enabled? }
    rate_limit to: 10, within: 5.minutes, only: :create, by: -> { Current.session&.id || request.remote_ip }, with: -> { redirect_to new_admin_two_factor_path, alert: "Too many attempts. Wait a few minutes and try again." }

    def new
      session[:pending_otp_secret] ||= User.generate_otp_secret
      load_enrolment
    end

    def create
      secret = session[:pending_otp_secret]
      if secret.present? && User.otp_code_valid?(secret, params[:code])
        @recovery_codes = Current.user.enable_two_factor!(secret)
        session.delete(:pending_otp_secret)
        # Anyone else signed in with only the password loses access.
        Current.user.sessions.where.not(id: Current.session.id).destroy_all
        audit("two_factor.enabled")
        render :recovery_codes
      else
        flash.now[:alert] = "That code didn't match. Check your phone's clock and try the newest code."
        load_enrolment
        render :new, status: :unprocessable_entity
      end
    end

    private

    def load_enrolment
      @secret = session[:pending_otp_secret] ||= User.generate_otp_secret
      @qr_svg = RQRCode::QRCode.new(Current.user.otp_provisioning_uri(@secret)).as_svg(module_size: 4, use_path: true, viewbox: true, svg_attributes: { class: "qr-code", role: "img", "aria-label": "QR code for your authenticator app" })
        .sub(/\A<\?xml[^>]*\?>/, "")
    end
  end
end
