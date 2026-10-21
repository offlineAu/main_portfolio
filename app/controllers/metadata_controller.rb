class MetadataController < ApplicationController
  def sitemap
    paths = [root_path, projects_path, about_path, experience_path, contact_path] + Project.published.map { |project| project_path(project) }
    origin = ENV.fetch("APP_URL", request.base_url).chomp("/")
    xml = Nokogiri::XML::Builder.new do |builder|
      builder.urlset(xmlns: "http://www.sitemaps.org/schemas/sitemap/0.9") do
        paths.each { |path| builder.url { builder.loc(origin + path) } }
      end
    end
    render xml: xml.to_xml
  end

  def robots
    origin = ENV.fetch("APP_URL", request.base_url).chomp("/")
    render plain: "User-agent: *\nDisallow: /admin\nDisallow: /session\nDisallow: /media\nDisallow: /airl-joriz-janoplo-resume.pdf\nSitemap: #{origin}/sitemap.xml\n"
  end

  # RFC 9116. Points at the contact page rather than printing the address for harvesters.
  def security
    origin = ENV.fetch("APP_URL", request.base_url).chomp("/")
    expires = 180.days.from_now.utc.beginning_of_day.iso8601
    render plain: "Contact: #{origin}#{contact_path}\nExpires: #{expires}\nPreferred-Languages: en\nCanonical: #{origin}/.well-known/security.txt\n"
  end
end
