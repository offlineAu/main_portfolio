module Admin
  class ActivityController < BaseController
    def index
      @events = AuditEvent.recent.includes(:user).limit(200)
    end
  end
end
