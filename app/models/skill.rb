class Skill < ApplicationRecord
  GROUPS = ["Backend & data", "Frontend & mobile", "AI & automation", "Tools & workflow"].freeze
  scope :ordered, -> { order(:position, :id) }
  validates :name, :note, presence: true
  validates :category, inclusion: { in: GROUPS }
  validates :position, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
end
