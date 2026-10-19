module Admin
  class BaseController < ApplicationController
    layout "admin"
    before_action :require_authentication
    before_action -> { response.headers["Cache-Control"] = "no-store"; response.headers["X-Robots-Tag"] = "noindex, nofollow" }
  end
end
