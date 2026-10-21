class SessionsController < ApplicationController
  layout "admin"
  too_many = -> { redirect_to new_session_path, alert: "Too many attempts. Please try again later." }
  rate_limit to: 10, within: 3.minutes, only: :create, with: too_many
  # Per account as well as per address, so spreading attempts across IPs doesn't help.
  rate_limit to: 20, within: 1.hour, only: :create, by: -> { params[:email_address].to_s.strip.downcase }, name: "account", with: too_many

  def new
    redirect_to admin_root_path if authenticated?
  end

  def create
    if user = User.authenticate_by(email_address: params[:email_address].to_s.strip.downcase, password: params[:password])
      if user.two_factor_enabled?
        reset_session
        session[:two_factor_user_id] = user.id
        session[:two_factor_started_at] = Time.current.to_i
        redirect_to new_session_two_factor_path
      else
        start_session_for(user)
        redirect_to admin_root_path
      end
    else
      AuditEvent.record("session.failed", request: request, user: nil, details: { email: params[:email_address].to_s.strip.downcase.first(120) })
      redirect_to new_session_path, alert: "Email or password is incorrect."
    end
  end

  def destroy
    AuditEvent.record("session.signed_out", request: request) if authenticated?
    Current.session&.destroy!
    cookies.delete(:session_id)
    reset_session
    redirect_to new_session_path, notice: "You have signed out.", status: :see_other
  end
end
