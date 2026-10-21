# Second step of sign-in: the password was correct, now prove possession of the authenticator.
class TwoFactorSessionsController < ApplicationController
  layout "admin"
  PENDING_FOR = 5.minutes

  before_action :load_pending_user
  rate_limit to: 10, within: 5.minutes, only: :create, by: -> { session[:two_factor_user_id] || request.remote_ip },
    with: -> { reset_session; redirect_to new_session_path, alert: "Too many attempts. Please sign in again later." }

  def new
  end

  def create
    if @user.verify_second_factor(params[:code])
      start_session_for(@user)
      redirect_to admin_root_path
    else
      AuditEvent.record("two_factor.failed", request: request, user: @user)
      flash.now[:alert] = "That code didn't work. Try a new code from your authenticator, or a recovery code."
      render :new, status: :unprocessable_entity
    end
  end

  private

  def load_pending_user
    started = session[:two_factor_started_at].to_i
    @user = User.find_by(id: session[:two_factor_user_id]) if started > PENDING_FOR.ago.to_i
    return if @user&.two_factor_enabled?

    reset_session
    redirect_to new_session_path, alert: "Please sign in again."
  end
end
