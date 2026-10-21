module Admin
  class BaseController < ApplicationController
    layout "admin"
    before_action :require_authentication
    before_action :require_two_factor
    before_action -> { response.headers["Cache-Control"] = "no-store"; response.headers["X-Robots-Tag"] = "noindex, nofollow" }

    private

    # Every admin page needs a second factor; until one is set up, the owner is sent to enrol.
    def require_two_factor
      redirect_to new_admin_two_factor_path, alert: "Set up two-factor authentication to continue." if authenticated? && !Current.user.two_factor_enabled?
    end

    def audit(action, subject: nil, details: {})
      AuditEvent.record(action, request: request, subject: subject, details: details)
    end
  end
end
