class ApplicationController < ActionController::Base
  before_action :resume_session
  before_action :load_profile
  helper_method :authenticated?

  private

  def resume_session
    Current.session = Session.where("created_at > ?", 14.days.ago).find_by(id: cookies.signed[:session_id]) if cookies.signed[:session_id]
  end

  def authenticated?
    Current.session.present?
  end

  def require_authentication
    redirect_to new_session_path, alert: "Please sign in to continue." unless authenticated?
  end

  def load_profile
    @profile = Profile.current
  end
end
