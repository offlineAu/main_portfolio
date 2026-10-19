class Project < ApplicationRecord
  include ImageUploads
  include WebLinks
  CATEGORIES = ["Web application", "Mobile application", "Automation"].freeze
  STATUSES = ["Case study", "In development", "Prototype", "Internal system"].freeze
  has_one_attached :cover
  has_many_attached :gallery
  scope :published, -> { where(published: true) }
  scope :ordered, -> { order(:position, :id) }
  scope :featured, -> { where(featured: true) }
  validates :name, :slug, :tagline, :description, :role, presence: true
  validates :slug, uniqueness: true, format: { with: /\A[a-z0-9]+(?:-[a-z0-9]+)*\z/ }
  validates :category, inclusion: { in: CATEGORIES }
  validates :status, inclusion: { in: STATUSES }
  validates :position, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  web_links :source_url, :live_url
  before_update :keep_slug

  def ordered_gallery
    gallery.attachments.sort_by do |attachment|
      [gallery_details.fetch(attachment.id.to_s, {}).fetch("position", attachment.id).to_i, attachment.id]
    end
  end

  def gallery_alt_for(attachment)
    gallery_details.dig(attachment.id.to_s, "alt").presence || gallery_alt.presence || "#{name} application interface"
  end

  def to_param
    slug
  end

  def technologies_text
    technologies.join(", ")
  end

  def technologies_text=(text)
    self.technologies = text.to_s.split(",").map(&:strip).reject(&:blank?).uniq
  end

  def highlights_text
    highlights.join("\n")
  end

  def highlights_text=(text)
    self.highlights = text.to_s.lines.map(&:strip).reject(&:blank?)
  end

  private

  def keep_slug
    errors.add(:slug, "cannot change after creation; existing links must remain stable") if slug_changed?
    throw(:abort) if errors.any?
  end
end
