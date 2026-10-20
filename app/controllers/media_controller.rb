class MediaController < ApplicationController
  rescue_from ActiveSupport::MessageVerifier::InvalidSignature, ActiveStorage::FileNotFoundError, with: -> { head :not_found }

  def show
    attachment = MediaToken.find_attachment!(params[:id])
    record = attachment.record
    raise ActiveRecord::RecordNotFound unless record.is_a?(Profile) || (record.is_a?(Project) && (record.published? || authenticated?))
    blob = attachment.blob
    limit = record.is_a?(Profile) ? [900, 1600] : [1600, 1600]
    processed = blob.variant(resize_to_limit: limit, format: :webp).processed
    # The signed URL is derived from the attachment id, so a replaced image gets a new URL:
    # published media can be cached for good. Drafts must never be stored.
    draft = record.is_a?(Project) && !record.published?
    response.headers["Cache-Control"] = draft ? "private, no-store" : "private, max-age=31536000, immutable"
    response.headers["X-Content-Type-Options"] = "nosniff"
    send_data processed.download, type: "image/webp", disposition: "inline"
  end
end
