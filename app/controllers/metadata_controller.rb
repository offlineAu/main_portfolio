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
    render plain: "User-agent: *\nDisallow: /admin\nDisallow: /session\nDisallow: /legacy\nDisallow: /media\nSitemap: #{origin}/sitemap.xml\n"
  end
end
