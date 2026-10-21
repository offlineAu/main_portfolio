require "test_helper"

class SecurityTest < ActionDispatch::IntegrationTest
  include OwnerSignIn

  test "an owner without two-factor must enrol before reaching any admin page" do
    owner = create_owner(two_factor: false)
    post session_path, params: { email_address: owner.email_address, password: OWNER_PASSWORD }
    assert_redirected_to admin_root_path
    get admin_root_path
    assert_redirected_to new_admin_two_factor_path
    get admin_contents_path(resource: "projects")
    assert_redirected_to new_admin_two_factor_path

    get new_admin_two_factor_path
    assert_response :success
    assert_select ".qr-frame svg.qr-code"
    secret = session[:pending_otp_secret]
    post admin_two_factor_path, params: { code: "000000" }
    assert_response :unprocessable_entity
    assert_not owner.reload.two_factor_enabled?

    post admin_two_factor_path, params: { code: ROTP::TOTP.new(secret).now }
    assert_response :success
    assert_select ".recovery-codes li", count: User::RECOVERY_CODE_COUNT
    assert owner.reload.two_factor_enabled?
    get admin_root_path
    assert_response :success
    assert AuditEvent.exists?(action: "two_factor.enabled", user: owner)
  end

  test "sign-in requires a valid, unused authenticator code" do
    owner = create_owner
    post session_path, params: { email_address: owner.email_address, password: OWNER_PASSWORD }
    assert_redirected_to new_session_two_factor_path
    assert_not owner.sessions.exists?, "no session before the second factor"
    get admin_root_path
    assert_redirected_to new_session_path

    post session_two_factor_path, params: { code: "123456" }
    assert_response :unprocessable_entity
    code = current_code(owner)
    post session_two_factor_path, params: { code: code }
    assert_redirected_to admin_root_path
    delete session_path

    # The same code cannot be replayed within its window.
    post session_path, params: { email_address: owner.email_address, password: OWNER_PASSWORD }
    post session_two_factor_path, params: { code: code }
    assert_response :unprocessable_entity
  end

  test "recovery codes work exactly once" do
    owner = create_owner
    code = @recovery_codes.first
    sign_in(owner, code: code.upcase)
    delete session_path
    post session_path, params: { email_address: owner.email_address, password: OWNER_PASSWORD }
    post session_two_factor_path, params: { code: code }
    assert_response :unprocessable_entity
    assert_equal User::RECOVERY_CODE_COUNT - 1, owner.reload.otp_recovery_digests.size
  end

  test "a pending second factor expires" do
    owner = create_owner
    post session_path, params: { email_address: owner.email_address, password: OWNER_PASSWORD }
    travel 6.minutes
    post session_two_factor_path, params: { code: current_code(owner) }
    assert_redirected_to new_session_path
    assert_not owner.sessions.exists?
  end

  test "password attempts are limited per account across addresses" do
    owner = create_owner
    20.times do |index|
      post session_path, params: { email_address: owner.email_address, password: "wrong" }, env: { "REMOTE_ADDR" => "10.0.0.#{index}" }
    end
    post session_path, params: { email_address: owner.email_address, password: OWNER_PASSWORD }, env: { "REMOTE_ADDR" => "10.0.1.1" }
    assert_redirected_to new_session_path
    assert_equal "Too many attempts. Please try again later.", flash[:alert]
    assert_equal 20, AuditEvent.where(action: "session.failed").count
  end

  test "sessions expire when idle and can be revoked" do
    owner = create_owner
    sign_in(owner)
    other = owner.sessions.create!(user_agent: "Other browser", ip_address: "10.1.1.1", last_seen_at: Time.current)
    get admin_security_path
    assert_response :success
    assert_select ".content-row", text: /Other browser/
    delete admin_security_session_path(other)
    assert_not Session.exists?(other.id)
    assert AuditEvent.exists?(action: "session.revoked")

    travel Session::IDLE_TIMEOUT + 1.minute
    get admin_root_path
    assert_redirected_to new_session_path
    assert_equal 1, Session.sweep
  end

  test "content changes are written to the activity log" do
    @owner = create_owner
    sign_in
    project = Project.first
    patch admin_content_path(resource: "projects", id: project.slug), params: { content: { tagline: "A sharper tagline" } }
    event = AuditEvent.recent.find_by!(action: "content.updated")
    assert_equal project.name, event.subject_label
    assert_equal ["tagline"], event.details["fields"]
    get admin_activity_path
    assert_response :success
    assert_select ".content-row", text: /Updated project “#{project.name}” — tagline/
  end

  test "served images are resized, stripped of metadata, watermarked and not embeddable elsewhere" do
    project = Project.published.first
    photo = Vips::Image.black(2400, 1600).new_from_image([180, 120, 90]).copy(interpretation: :srgb)
      .mutate { |image| image.set_type!(GObject::GSTR_TYPE, "exif-ifd0-Make", "PrivatePhone") }
    project.gallery.attach(io: StringIO.new(photo.write_to_buffer(".jpg")), filename: "photo.jpg", content_type: "image/jpeg")
    attachment = project.gallery.attachments.last
    path = portfolio_media_path(MediaToken.sign(attachment), v: "2w")
    get project_path(project)
    assert_select "img.protected-media[src='#{path}'][draggable=false]"

    get path
    assert_response :success
    assert_equal "same-origin", response.headers["Cross-Origin-Resource-Policy"]
    served = Vips::Image.new_from_buffer(response.body, "")
    assert_equal [1200, 800], [served.width, served.height]
    assert_empty served.get_fields.grep(/exif|xmp/)
    watermarked = response.body

    project.update!(watermark: false)
    get project_path(project)
    assert_select "img[src='#{portfolio_media_path(MediaToken.sign(attachment), v: '2')}']"
    get portfolio_media_path(MediaToken.sign(attachment), v: "2")
    assert_not_equal watermarked, response.body

    get path, headers: { "Sec-Fetch-Site" => "cross-site" }
    assert_response :forbidden
  end

  test "security headers and a strict content security policy are sent" do
    get root_path
    policy = response.headers["Content-Security-Policy"]
    assert_match(/style-src 'self' 'nonce-/, policy)
    assert_no_match(/unsafe-inline/, policy)
    assert_includes policy, "report-uri /csp-reports"
    assert_includes response.headers["Permissions-Policy"], "camera=()"
    assert_equal "same-origin", response.headers["Cross-Origin-Opener-Policy"]
    assert_equal "strict-origin-when-cross-origin", response.headers["Referrer-Policy"]
    assert_select "[style]", count: 0
  end

  test "contact details are not printed in plain text" do
    profile = Profile.current
    [root_path, contact_path, project_path(Project.published.first)].each do |path|
      get path
      assert_not_includes response.body, profile.email
      assert_not_includes response.body, "mailto:"
    end
    get contact_path
    assert_select "a[data-controller='contact'][href='#{contact_path}']"
  end

  test "csp reports are accepted, bounded, and validated" do
    report = { "csp-report" => { "document-uri" => "https://example.com/", "violated-directive" => "style-src" } }.to_json
    post "/csp-reports", params: report, headers: { "CONTENT_TYPE" => "application/csp-report" }
    assert_response :no_content
    post "/csp-reports", params: "x" * 9.kilobytes, headers: { "CONTENT_TYPE" => "application/csp-report" }
    assert_response 413
    post "/csp-reports", params: "not json", headers: { "CONTENT_TYPE" => "application/csp-report" }
    assert_response :bad_request
  end

  test "security.txt points to the contact page" do
    get "/.well-known/security.txt"
    assert_response :success
    assert_match %r{^Contact: http://www.example.com/contact$}, response.body
    assert_match(/^Expires: \d{4}-/, response.body)
  end
end
