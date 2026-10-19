namespace :content do
  desc "Apply the owner-supplied resume to existing portfolio content"
  task update_from_resume: :environment do
    resume = JSON.parse(Rails.root.join("db/content/resume.json").read)
    ApplicationRecord.transaction do
      profile = Profile.current
      profile.update!(
        name: resume.fetch("name"), title: resume.fetch("title"), email: resume.fetch("email"),
        phone: resume.fetch("phone"), website_url: resume.fetch("websiteUrl"), education: resume.fetch("education"),
        availability: resume.fetch("availability"), introduction: resume.fetch("tagline"),
        about: resume.fetch("about").fetch("body").join("\n\n"), focus: resume.fetch("focus").join("\n"),
        portrait_alt: "Portrait of #{resume.fetch('name')}"
      )

      # Replace only the superseded imported roles; preserve other editor additions.
      [
        ["Web Developer", "CK Children's Publishing"],
        ["Intern Web Developer", "Commission on Higher Education (Region X)"],
        ["Student Full-stack Developer", "University of Science & Technology of Southern Philippines"],
        ["Quality Assurance Specialist", "CK Children's Publishing"]
      ].each do |role, organization|
        Experience.where(role: role, organization: organization).destroy_all
      end
      resume.fetch("experience").each_with_index do |item, position|
        experience = Experience.find_or_initialize_by(role: item.fetch("role"), organization: item.fetch("org"))
        experience.update!(period: item.fetch("period"), current: item.fetch("current"), details: item.fetch("details"), position: position)
      end

      resume.fetch("skills").each_with_index do |(name, category, note), position|
        Skill.find_or_initialize_by(name: name).update!(category: category, note: note, position: position)
      end
      Project.find_by(slug: "sentisphere")&.update!(resume.fetch("sentisphere"))
    end
    puts "Resume applied to profile, work history, skills, and Sentisphere."
  end
end
