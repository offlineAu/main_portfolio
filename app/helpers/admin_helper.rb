module AdminHelper
  AUDIT_LABELS = {
    "session.signed_in" => "Signed in", "session.signed_out" => "Signed out", "session.failed" => "Failed sign-in",
    "session.revoked" => "Signed out another session", "session.revoked_others" => "Signed out all other sessions",
    "two_factor.enabled" => "Turned on two-factor", "two_factor.failed" => "Wrong two-factor code",
    "two_factor.recovery_codes_regenerated" => "Made new recovery codes",
    "content.created" => "Created", "content.updated" => "Updated", "content.deleted" => "Deleted"
  }.freeze

  def audit_description(event)
    label = AUDIT_LABELS.fetch(event.action, event.action)
    parts = [label]
    parts << "#{event.subject_type.underscore.humanize.downcase} “#{event.subject_label}”" if event.subject_type
    parts << "(new device)" if event.details["new_device"]
    parts << "for #{event.details['email']}" if event.action == "session.failed" && event.details["email"].present?
    parts << "— #{event.details['fields'].map(&:humanize).join(', ').downcase}" if event.details["fields"].present?
    parts.join(" ")
  end
end
