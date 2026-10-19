module Admin
  class DashboardController < BaseController
    def index
      @projects = Project.ordered
    end
  end
end
