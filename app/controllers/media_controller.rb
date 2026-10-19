class MediaController < ApplicationController
  rescue_from ActiveSupport::MessageVerifier::InvalidSignature, ActiveStorage::FileNotFoundError, with: -> { head :not_found }

  def show
    attachment = MediaToken.find_attachment!(params[:id])
    record = attachment.record
    raise ActiveRecord::RecordNotFound unless record.is_a?(Profile) || (record.is_a?(Project) && (record.published? || authenticated?))
    blob = attachment.blob
    processed = blob.variant(resize_to_limit: [1600, 1600], format: :webp).processed
    response.headers["Cache-Control"] = record.is_a?(Project) && !record.published? ? "private, no-store" : "private, no-cache"
    response.headers["X-Content-Type-Options"] = "nosniff"
    send_data processed.download, type: "image/webp", disposition: "inline"
  end
end
