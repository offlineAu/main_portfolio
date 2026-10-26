class MediaController < ApplicationController
  WATERMARK = Rails.root.join("lib/assets/watermark.png").to_s
  # Processed images per instance. Without it every request re-reads the variant records and
  # downloads the file from storage again; the access checks below still run on every request.
  PROCESSED = ActiveSupport::Cache::MemoryStore.new(size: 48.megabytes)

  skip_before_action :load_profile
  rescue_from ActiveSupport::MessageVerifier::InvalidSignature, ActiveStorage::FileNotFoundError, with: -> { head :not_found }
  rate_limit to: 300, within: 1.minute, with: -> { head :too_many_requests }

  def show
    # Other sites may not embed or link straight to our images; browsers send this header on every fetch.
    return head :forbidden if request.headers["Sec-Fetch-Site"] == "cross-site"

    attachment = MediaToken.find_attachment!(params[:id])
    record = attachment.record
    raise ActiveRecord::RecordNotFound unless record.is_a?(Profile) || (record.is_a?(Project) && (record.published? || authenticated?))
    options = variant_options(record)
    # A replaced image gets a new attachment and blob, and the options carry the watermark choice.
    key = [attachment.id, attachment.blob_id, ActiveSupport::Digest.hexdigest(options.inspect)].join("/")
    image = PROCESSED.fetch(key) { attachment.blob.variant(options).processed.download }
    # The signed URL is derived from the attachment id, so a replaced image gets a new URL:
    # published media can be cached for good. Drafts must never be stored.
    draft = record.is_a?(Project) && !record.published?
    response.headers["Cache-Control"] = draft ? "private, no-store" : "private, max-age=31536000, immutable"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Cross-Origin-Resource-Policy"] = "same-origin"
    send_data image, type: "image/webp", disposition: "inline"
  end

  private

  # Capped at display size, re-encoded without EXIF/GPS metadata, and watermarked when the owner wants it.
  def variant_options(record)
    limit = record.is_a?(Profile) ? [900, 1600] : [1200, 1200]
    watermark = record.is_a?(Profile) ? record.watermark_portrait? : record.watermark?
    options = { resize_to_limit: limit, format: :webp, saver: { strip: true, quality: 82 } }
    options[:composite] = [WATERMARK, { gravity: "south-east", offset: [24, 24] }] if watermark
    options
  end
end
