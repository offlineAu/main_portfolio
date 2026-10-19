Rails.application.routes.draw do
  root "portfolio#overview"
  get "about", to: "portfolio#about"
  get "experience", to: "portfolio#experience"
  get "contact", to: "portfolio#contact"
  resources :projects, only: [:index, :show], param: :slug
  get "media/:id", to: "media#show", as: :portfolio_media
  resource :session, only: [:new, :create, :destroy]
  namespace :admin do
    root "dashboard#index"
    get ":resource", to: "content#index", as: :contents
    get ":resource/new", to: "content#new", as: :new_content
    post ":resource", to: "content#create"
    get ":resource/:id/edit", to: "content#edit", as: :edit_content
    get ":resource/:id/preview", to: "content#preview", as: :preview_content
    patch ":resource/:id", to: "content#update", as: :content
    delete ":resource/:id", to: "content#destroy"
  end
  get "sitemap.xml", to: "metadata#sitemap", defaults: { format: :xml }
  get "robots.txt", to: "metadata#robots", defaults: { format: :text }
  get "motion-lab.html", to: redirect("/legacy/motion-lab.html")
  get "up" => "rails/health#show", as: :rails_health_check
end
