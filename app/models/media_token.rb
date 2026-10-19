class MediaToken
  def self.sign(attachment)
    verifier.generate(attachment.id, purpose: "portfolio_attachment")
  end

  def self.find_attachment!(token)
    ActiveStorage::Attachment.find(verifier.verify(token, purpose: "portfolio_attachment"))
  end

  def self.verifier
    Rails.application.message_verifier("portfolio_media")
  end
end
