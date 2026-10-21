class AuditEvent < ApplicationRecord
  belongs_to :user, optional: true
  scope :recent, -> { order(created_at: :desc, id: :desc) }

  def self.record(action, request:, user: Current.user, subject: nil, details: {})
    create!(
      action: action, user: user, details: details,
      subject_type: subject&.class&.name, subject_id: subject&.to_param, subject_label: subject && label_for(subject),
      ip_address: request.remote_ip, user_agent: request.user_agent.to_s.first(255)
    )
  end

  def self.label_for(subject)
    %i[name role short_name].each { |attribute| return subject.public_send(attribute) if subject.respond_to?(attribute) && subject.public_send(attribute).present? }
    "#{subject.class.name} ##{subject.id}"
  end
end
