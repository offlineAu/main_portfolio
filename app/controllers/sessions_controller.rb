class SessionsController < ApplicationController
  layout "admin"
  rate_limit to: 10, within: 3.minutes, only: :create, with: -> { redirect_to new_session_path, alert: "Too many attempts. Please try again in three minutes." }

  def new
    redirect_to admin_root_path if authenticated?
  end

  def create
    if user = User.authenticate_by(email_address: params[:email_address].to_s.strip.downcase, password: params[:password])
      reset_session
      Current.session = user.sessions.create!(user_agent: request.user_agent, ip_address: request.remote_ip)
      cookies.signed[:session_id] = { value: Current.session.id, httponly: true, same_site: :lax, secure: Rails.env.production?, expires: 14.days.from_now }
      redirect_to admin_root_path
    else
      redirect_to new_session_path, alert: "Email or password is incorrect."
    end
  end

  def destroy
    Current.session&.destroy!
    cookies.delete(:session_id)
    reset_session
    redirect_to new_session_path, notice: "You have signed out.", status: :see_other
  end
end
