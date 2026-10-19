class Experience < ApplicationRecord
  scope :ordered, -> { order(:position, :id) }
  validates :role, :organization, :period, :details, presence: true
  validates :position, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
end
