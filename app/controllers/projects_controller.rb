class ProjectsController < ApplicationController
  def index
    # One load, then filtered in Ruby: each query is a network round trip to the database.
    published = Project.published.ordered.includes(:cover_attachment).to_a
    @published_count = published.size
    @technologies = published.flat_map(&:technologies).uniq.sort
    @technology = params[:technology].to_s
    @projects = @technology.present? ? published.select { |project| project.technologies.include?(@technology) } : published
  end

  def show
    # The gallery reads blob metadata for image dimensions; the cover only needs its attachment id.
    @project = Project.published.includes(:cover_attachment, gallery_attachments: :blob).find_by!(slug: params[:slug])
  end
end
