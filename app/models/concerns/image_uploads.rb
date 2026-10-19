module ImageUploads
  extend ActiveSupport::Concern

  included do
    validate :acceptable_images
  end

  private

  def acceptable_images
    names = self.class == Profile ? [:portrait] : [:cover, :gallery]
    names.each do |name|
      attachment = public_send(name)
      blobs = attachment.is_a?(ActiveStorage::Attached::Many) ? attachment.blobs : [attachment.blob].compact
      blobs.each do |blob|
        errors.add(name, "must be JPEG, PNG, or WebP") unless %w[image/jpeg image/png image/webp].include?(blob.content_type)
        errors.add(name, "must be 10MB or smaller") if blob.byte_size > 10.megabytes
      end
    end
  end
end
