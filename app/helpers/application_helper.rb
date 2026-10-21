module ApplicationHelper
  def icon(name, **options)
    paths = {
      "grid" => '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
      "folder" => '<path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
      "user" => '<circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',
      "briefcase" => '<rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12a24 24 0 0 0 18 0M12 11v4"/>',
      "mail" => '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 6 9 7 9-7"/>',
      "arrow" => '<path d="M5 12h14m-5-5 5 5-5 5"/>',
      "external" => '<path d="M7 17 17 7M7 7h10v10"/>',
      "menu" => '<path d="M4 6h16M4 12h16M4 18h16"/>',
      "close" => '<path d="m6 6 12 12M6 18 18 6"/>',
      "pin" => '<path d="M20 10c0 6-8 11-8 11S4 16 4 10a8 8 0 1 1 16 0z"/><circle cx="12" cy="10" r="2.5"/>',
      "code" => '<path d="m8 6-6 6 6 6m8-12 6 6-6 6M14 3l-4 18"/>',
      "github" => '<path d="M9 19c-4 1-4-2-6-2m12 5v-4a3.5 3.5 0 0 0-1-3c3 0 6-1.5 6-5a4 4 0 0 0-1-3c.3-1 .3-2 0-3-2 0-3 1-3 1a13 13 0 0 0-7 0S8 4 6 4c-.3 1-.3 2 0 3a4 4 0 0 0-1 3c0 3.5 3 5 6 5a3.5 3.5 0 0 0-1 3v4"/>',
      "check" => '<path d="m5 12 4 4L19 6"/>',
      "layout" => '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>',
      "database" => '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
      "sparkles" => '<path d="m12 3 1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z"/>',
      "wrench" => '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
      "phone" => '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>',
      "globe" => '<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
      "download" => '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
      "calendar" => '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
      "building" => '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4M8 6h.01M12 6h.01M16 6h.01M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01"/>',
      "graduation" => '<path d="M22 10 12 5 2 10l10 5zM6 12v5c3 2.7 9 2.7 12 0v-5M22 10v6"/>',
      "award" => '<circle cx="12" cy="8" r="6"/><path d="M15.5 13.9 17 22l-5-3-5 3 1.5-8.1"/>',
      "layers" => '<path d="m12 2 10 5-10 5L2 7zM2 17l10 5 10-5M2 12l10 5 10-5"/>',
      "smartphone" => '<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/>',
      "zap" => '<path d="M13 2 3 14h9l-1 8 10-12h-9z"/>',
      "users" => '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
      "linkedin" => '<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z"/><circle cx="4" cy="4" r="2"/>',
      "share" => '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/>',
      "target" => '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
      "shield" => '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
      "network" => '<rect x="3" y="3" width="8" height="8" rx="2"/><path d="M7 11v4a2 2 0 0 0 2 2h4"/><rect x="13" y="13" width="8" height="8" rx="2"/>',
      "compass" => '<circle cx="12" cy="12" r="10"/><path d="m16.2 7.8-2.1 6.3-6.3 2.1 2.1-6.3z"/>',
    }
    content_tag(:svg, paths.fetch(name).html_safe, { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", "stroke-width": "1.6", "stroke-linecap": "round", "stroke-linejoin": "round", "aria-hidden": true, class: "icon" }.merge(options))
  end

  TECH_ICONS = {
    "bigquery" => "googlebigquery", "css" => "css", "dart" => "dart", "expo" => "expo", "fastapi" => "fastapi",
    "firebase" => "firebase", "flutter" => "flutter", "google apps script" => "googleappsscript", "gcp" => "googlecloud",
    "html" => "html5", "hugging face" => "huggingface", "javascript" => "javascript", "laravel" => "laravel",
    "mysql" => "mysql", "next.js" => "nextdotjs", "postgresql" => "postgresql", "prisma" => "prisma", "python" => "python",
    "react" => "react", "react native" => "react", "tailwind css" => "tailwindcss", "tailwind" => "tailwindcss",
    "typescript" => "typescript", "php" => "php", "git" => "git", "github" => "github", "inertia" => "inertia"
  }.freeze

  SKILL_GLYPHS = [
    [/quality/i, "shield"], [/problem|team|collaborat/i, "users"], [/architect|system analysis/i, "network"],
    [/mobile|design system/i, "smartphone"], [/database|api/i, "database"], [/software|service/i, "layers"]
  ].freeze

  # A brand logo (monochrome, tinted by CSS) for a known technology, or a generic code glyph.
  def tech_icon(name)
    slug = TECH_ICONS[name.to_s.downcase.strip]
    return content_tag(:span, icon("code"), class: "tech-icon tech-icon-generic", "aria-hidden": true) unless slug

    content_tag(:span, "", class: "tech-icon tech-logo-#{slug}", "aria-hidden": true)
  end

  # Logos for every recognised technology in a label like "React / TypeScript"; otherwise a themed glyph.
  def skill_icons(label)
    parts = label.to_s.split(%r{\s*/\s*}).select { |part| TECH_ICONS.key?(part.downcase.strip) }
    return safe_join(parts.first(2).map { |part| tech_icon(part) }) if parts.any?

    glyph = SKILL_GLYPHS.find { |pattern, _| label.to_s.match?(pattern) }&.last || "code"
    content_tag(:span, icon(glyph), class: "tech-icon tech-icon-generic", "aria-hidden": true)
  end

  def category_glyph(category)
    case category.to_s
    when /frontend|mobile/i then "layout"
    when /backend|data/i then "database"
    when /\bai\b|automation/i then "sparkles"
    when /tool|workflow/i then "wrench"
    else "code"
    end
  end

  def project_category_glyph(category)
    case category.to_s
    when /mobile/i then "smartphone"
    when /web/i then "globe"
    when /automation/i then "zap"
    else "folder"
    end
  end

  # Cards for the socials deck in the sidebar: one per contact channel the profile fills in.
  def social_cards(profile)
    handle = ->(url) { URI.parse(url).path.split("/").reject(&:blank?).last.to_s }
    [
      (profile.github_url.present? && { key: "github", label: "GitHub", handle: "@#{handle.(profile.github_url)}", url: profile.github_url, icon: "github", external: true }),
      (profile.linkedin_url.present? && { key: "linkedin", label: "LinkedIn", handle: handle.(profile.linkedin_url), url: profile.linkedin_url, icon: "linkedin", external: true }),
      (profile.email.present? && { key: "mail", label: "Email", handle: masked_contact(profile.email), url: contact_path, icon: "mail", external: false, protected_email: profile.email }),
      (profile.website_url.present? && { key: "web", label: "Website", handle: URI.parse(profile.website_url).host, url: profile.website_url, icon: "globe", external: true }),
    ].select(&:itself)
  end

  # A link whose mailto:/tel: target is filled in by the contact controller; it points at the contact page until then.
  def protected_contact_link(value, scheme: "mailto", **options, &block)
    data = (options.delete(:data) || {}).merge(controller: "contact", contact_value_value: encoded_contact(value), contact_scheme_value: scheme)
    link_to contact_path, **options, data: data, &block
  end

  # Text inside a protected contact link: masked in the HTML, replaced with the real value by the controller.
  def protected_contact_text(value, tag: :span)
    content_tag(tag, masked_contact(value), data: { contact_target: "text" })
  end

  def encoded_contact(value)
    Base64.strict_encode64(value.to_s.reverse)
  end

  def masked_contact(value)
    value.include?("@") ? value.sub("@", " [at] ") : value.gsub(/\d(?=(?:\D*\d){4})/, "•")
  end

  def page_title
    content_for(:title).presence || "Overview"
  end

  def nav_link(label, path, glyph)
    active = path == root_path ? request.path == path : request.path.start_with?(path)
    link_to safe_join([icon(glyph), content_tag(:span, label)].compact), path, class: "nav-item #{'active' if active}", aria: { current: active ? "page" : nil }
  end

  # The version busts immutable browser caches when the watermark setting or pipeline changes.
  def media_path_for(attachment)
    record = attachment.record
    watermark = record.is_a?(Profile) ? record.watermark_portrait? : record.try(:watermark?)
    portfolio_media_path(MediaToken.sign(attachment), v: "2#{watermark ? 'w' : ''}")
  end

  def project_color(project)
    { "sentisphere" => "sage", "veloce" => "lilac", "e-lista" => "apricot", "loom" => "rose", "syntax-sip" => "coffee", "issuance-subsystem" => "blue" }.fetch(project.slug, "apricot")
  end
end
