module Admin
  class SecurityController < BaseController
    def show
      @sessions = Current.user.sessions.active.order(last_seen_at: :desc)
    end

    def regenerate_recovery_codes
      if Current.user.verify_second_factor(params[:code])
        @recovery_codes = Current.user.regenerate_recovery_codes!
        audit("two_factor.recovery_codes_regenerated")
        render "admin/two_factors/recovery_codes"
      else
        redirect_to admin_security_path, alert: "That code didn't work, so your recovery codes were not changed."
      end
    end

    def revoke_session
      revoked = Current.user.sessions.where.not(id: Current.session.id).find(params[:id])
      revoked.destroy!
      audit("session.revoked", details: { session_id: revoked.id, user_agent: revoked.user_agent.to_s.first(120) })
      redirect_to admin_security_path, notice: "That session was signed out.", status: :see_other
    end

    def revoke_other_sessions
      count = Current.user.sessions.where.not(id: Current.session.id).destroy_all.size
      audit("session.revoked_others", details: { count: count })
      redirect_to admin_security_path, notice: "Signed out of #{count} other #{'session'.pluralize(count)}.", status: :see_other
    end
  end
end
