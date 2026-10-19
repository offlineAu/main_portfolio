class PortfolioController < ApplicationController
  def overview
    @projects = Project.published.ordered
    @featured = @projects.featured.first || @projects.first
    @recent = @projects.where.not(id: @featured&.id).limit(2)
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
