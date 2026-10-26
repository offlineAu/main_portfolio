class PortfolioController < ApplicationController
  def overview
    # One load, then filtered in Ruby: each query is a network round trip to the database.
    # Cards only need the attachment id to sign the media URL, not the blob or its variants.
    @projects = Project.published.ordered.includes(:cover_attachment).to_a
    @featured = @projects.find(&:featured?) || @projects.first
    @recent = (@projects - [@featured]).first(2)
    @experiences = Experience.ordered.limit(2)
    @technologies = @projects.flat_map(&:technologies).uniq
    @technology_count = @technologies.size
  end

  def about
    @skills = Skill.ordered.group_by(&:category)
  end

  def experience
    @experiences = Experience.ordered
  end

  def contact
  end
end
