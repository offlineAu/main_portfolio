class ProjectsController < ApplicationController
  def index
    @technologies = Project.published.flat_map(&:technologies).uniq.sort
    @technology = params[:technology].to_s
    @projects = Project.published.ordered.with_attached_cover
    @projects = @projects.where("technologies @> ?::jsonb", [@technology].to_json) if @technology.present?
  end

  def show
    @project = Project.published.with_attached_cover.with_attached_gallery.find_by!(slug: params[:slug])
  end
end
