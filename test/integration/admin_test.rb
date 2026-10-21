require "test_helper"

class AdminTest < ActionDispatch::IntegrationTest
  include OwnerSignIn

  setup do
    @owner = create_owner
  end

  test "all admin mutations and previews require authentication" do
    project = Project.first
    get admin_root_path
    assert_redirected_to new_session_path
    get admin_preview_content_path(resource: "projects", id: project.slug)
    assert_redirected_to new_session_path
    assert_no_difference "Project.count" do
      post admin_contents_path(resource: "projects"), params: { content: { name: "Unauthorized" } }
      delete admin_content_path(resource: "projects", id: project.slug)
    end
    patch admin_content_path(resource: "projects", id: project.slug), params: { content: { published: false } }
    assert project.reload.published?
  end

  test "incorrect login fails and signing out revokes the session" do
    post session_path, params: { email_address: @owner.email_address, password: "wrong" }
    assert_redirected_to new_session_path
    sign_in
    assert_equal 1, @owner.sessions.count
    delete session_path
    assert_equal 0, @owner.sessions.count
    get admin_root_path
    assert_redirected_to new_session_path
  end

  test "editor pages render for every resource" do
    sign_in
    get admin_root_path
    assert_response :success
    %w[projects skills experiences profile].each do |resource|
      get admin_contents_path(resource: resource)
      follow_redirect! if response.redirect?
      assert_response :success
    end
    get admin_edit_content_path(resource: "projects", id: Project.first.slug)
    assert_response :success
    assert_select "textarea[name='content[editorial_notes]']"
  end

  test "draft creation preview publishing ordering and unpublishing" do
    sign_in
    assert_difference "Project.count", 1 do
      post admin_contents_path(resource: "projects"), params: { content: {
        name: "New work", slug: "new-work", tagline: "A new idea", description: "A meaningful new project.",
        role: "Developer", category: "Web application", status: "Prototype", position: 0,
        technologies_text: "Ruby, Rails, Ruby", highlights_text: "First highlight\nSecond highlight", published: false,
        editorial_notes: "Private verification note"
      } }
    end
    project = Project.find_by!(slug: "new-work")
    assert_equal ["Ruby", "Rails"], project.technologies
    get admin_preview_content_path(resource: "projects", id: project.slug)
    assert_response :success
    assert_select "meta[name='robots'][content='noindex, nofollow']"
    assert_not_includes response.body, "Private verification note"
    get project_path(project)
    assert_response :not_found
    patch admin_content_path(resource: "projects", id: project.slug), params: { content: { published: true, position: 0, featured: true } }
    get project_path(project)
    assert_response :success
    patch admin_content_path(resource: "projects", id: project.slug), params: { content: { published: false } }
    get project_path(project)
    assert_response :not_found
  end

  test "invalid content retains submitted fields and rejects unsafe links" do
    sign_in
    project = Project.first
    patch admin_content_path(resource: "projects", id: project.slug), params: { content: { name: "My edited name", source_url: "javascript:alert(1)" } }
    assert_response :unprocessable_entity
    assert_select "input[name='content[name]'][value='My edited name']"
    assert_select ".alert", text: /must start with/
    assert_not_equal "My edited name", project.reload.name
  end

  test "gallery uploads persist and are protected when a project is unpublished" do
    sign_in
    project = Project.first
    image = Rack::Test::UploadedFile.new(Rails.root.join("db/content/portrait.png"), "image/png")
    patch admin_content_path(resource: "projects", id: project.slug), params: { content: { gallery: [image], gallery_alt: "Project screenshot" } }
    assert_response :redirect
    attachment = project.reload.gallery.attachments.first!
    path = portfolio_media_path(MediaToken.sign(attachment))
    get path
    assert_response :success
    assert_equal "image/webp", response.media_type
    project.update!(published: false)
    delete session_path
    get path
    assert_response :not_found
    sign_in
    get path
    assert_response :success
    assert_includes response.headers["Cache-Control"], "no-store"
    patch admin_content_path(resource: "projects", id: project.slug), params: { content: { name: project.name }, remove_images: [attachment.id] }
    assert_response :redirect
    assert_not project.reload.gallery.attached?
  end

  test "content and portrait updates are saved" do
    sign_in
    profile = Profile.current
    patch admin_content_path(resource: "profile", id: profile.id), params: { content: { short_name: "Airl", availability: "Open to collaboration" } }
    assert_response :redirect
    get root_path
    assert_includes response.body, "Open to collaboration"
    patch admin_content_path(resource: "profile", id: profile.id), params: { content: { short_name: "Airl" }, remove_images: [profile.portrait.attachment.id] }
    assert_response :redirect
    assert_not profile.reload.portrait.attached?
  end

  test "public registration and automatic active storage URLs do not exist" do
    get "/users/new"
    assert_response :not_found
    get "/rails/active_storage/blobs/redirect/fake/image.png"
    assert_response :not_found
  end
end
