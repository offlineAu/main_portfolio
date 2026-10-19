require "test_helper"

class ContentTest < ActiveSupport::TestCase
  test "slugs remain stable after creation" do
    project = Project.first
    original_slug = project.slug
    assert_not project.update(slug: "another-slug")
    assert_equal original_slug, project.reload.slug
  end

  test "slug collisions and invalid status are rejected" do
    project = Project.first.dup
    assert_not project.valid?
    assert project.errors[:slug].present?
    project.slug = "valid-new-project"
    project.status = "Invented status"
    assert_not project.valid?
  end

  test "uploads reject unsupported types and large files" do
    project = Project.first
    project.cover.attach(io: StringIO.new("not an image"), filename: "test.txt", content_type: "text/plain")
    assert_not project.valid?
    assert project.errors[:cover].any?
    project.cover.detach
    blob = ActiveStorage::Blob.create_and_upload!(io: File.open(Rails.root.join("db/content/portrait.png")), filename: "huge.png", content_type: "image/png")
    blob.update!(byte_size: 11.megabytes)
    project.cover = blob
    assert_not project.valid?
    assert_includes project.errors[:cover], "must be 10MB or smaller"
  end

  test "seed import preserves edits and does not duplicate content" do
    Project.first.update!(tagline: "My edited project")
    counts = [Project.count, Skill.count, Experience.count, Profile.count]
    load Rails.root.join("db/seeds.rb")
    assert_equal counts, [Project.count, Skill.count, Experience.count, Profile.count]
    assert_equal "My edited project", Project.first.tagline
  end

  test "gallery order and alternative text follow the editor's settings" do
    project = Project.first
    2.times do |number|
      project.gallery.attach(io: File.open(Rails.root.join("db/content/portrait.png")), filename: "screen-#{number}.png", content_type: "image/png")
    end
    first, second = project.gallery.attachments.order(:id).to_a
    project.update!(gallery_details: {
      first.id.to_s => { "position" => 2, "alt" => "First screen" },
      second.id.to_s => { "position" => 1, "alt" => "Second screen" }
    })
    assert_equal [second.id, first.id], project.ordered_gallery.map(&:id)
    assert_equal "Second screen", project.gallery_alt_for(second)
  end
end
