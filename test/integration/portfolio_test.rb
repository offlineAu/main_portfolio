require "test_helper"

class PortfolioTest < ActionDispatch::IntegrationTest
  test "public pages render real content and metadata" do
    [root_path, projects_path, about_path, experience_path, contact_path].each do |path|
      get path
      assert_response :success
      assert_select "aside#site-navigation"
      assert_select "header.topbar"
      assert_select "h1", count: 1
      assert_select "meta[property='og:image']"
    end
    get root_path
    assert_select ".hero-portrait"
    assert_select ".project-featured h3", text: "Sentisphere"
  end

  test "filters are server rendered and handle empty results" do
    get projects_path, params: { technology: "Flutter" }
    assert_select ".project-card", count: 1
    assert_select ".project-card h3", text: "E-Lista"
    get projects_path, params: { technology: "missing" }
    assert_select ".empty-state", text: /No projects/
    get projects_path, params: { technology: "' OR 1=1 --" }
    assert_select ".project-card", count: 0
  end

  test "drafts are absent from all public entrypoints and sitemap" do
    project = Project.find_by!(slug: "sentisphere")
    project.update!(published: false)
    get root_path
    assert_select ".project-card h3", text: project.name, count: 0
    get projects_path
    assert_select ".project-card h3", text: project.name, count: 0
    get project_path(project)
    assert_response :not_found
    get "/sitemap.xml"
    assert_response :success
    assert_not_includes response.body, "/projects/sentisphere"
  end

  test "unknown project returns 404" do
    get "/projects/does-not-exist"
    assert_response :not_found
  end

  test "invalid image tokens return 404" do
    get portfolio_media_path("invalid-signature")
    assert_response :not_found
  end

  test "content remains escaped" do
    Project.first.update!(tagline: '<script>alert("xss")</script>')
    get projects_path
    assert_not_includes response.body, '<script>alert("xss")</script>'
    assert_includes response.body, "&lt;script&gt;"
  end

  test "metadata is reachable and the legacy experiment is gone" do
    get "/motion-lab.html"
    assert_response :not_found
    get "/legacy/motion-lab.html"
    assert_response :not_found
    get "/robots.txt"
    assert_response :success
    assert_includes response.body, "Disallow: /admin"
    get "/up"
    assert_response :success
  end
end
