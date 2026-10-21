Rails.application.routes.draw do
  root "portfolio#overview"
  get "about", to: "portfolio#about"
  get "experience", to: "portfolio#experience"
  get "contact", to: "portfolio#contact"
  resources :projects, only: [:index, :show], param: :slug
  get "media/:id", to: "media#show", as: :portfolio_media
  resource :session, only: [:new, :create, :destroy] do
    resource :two_factor, only: [:new, :create], controller: "two_factor_sessions"
  end
  namespace :admin do
    root "dashboard#index"
    # Declared before the :resource routes, which would otherwise capture these paths.
    resource :two_factor, only: [:new, :create]
    get "security", to: "security#show", as: :security
    post "security/recovery-codes", to: "security#regenerate_recovery_codes", as: :security_recovery_codes
    delete "security/sessions/:id", to: "security#revoke_session", as: :security_session
    delete "security/sessions", to: "security#revoke_other_sessions", as: :security_sessions
    get "activity", to: "activity#index", as: :activity
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
  get ".well-known/security.txt", to: "metadata#security", defaults: { format: :text }
  post "csp-reports", to: "csp_reports#create"
  get "up" => "rails/health#show", as: :rails_health_check
end
