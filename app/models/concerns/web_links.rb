module WebLinks
  extend ActiveSupport::Concern

  class_methods do
    def web_links(*names)
      validates(*names, format: { with: /\Ahttps?:\/\/[^\s]+\z/i, message: "must start with https:// or http://" }, allow_blank: true)
    end
  end
end
