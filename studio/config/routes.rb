# frozen_string_literal: true

Rails.application.routes.draw do
  root "home#index"

  # Design: the theme's tokens and skins, the doctor, docs-site previews.
  namespace :design do
    resources :tokens, only: %i[index show update] do
      post :diff, on: :member
    end
    resources :skins, only: %i[index show update] do
      post :diff, on: :member
      post :contrast, on: :member
    end
    resource :doctor, only: %i[show create], controller: "doctors"
    resources :previews, only: %i[index create]
  end

  # Customize: registered consumer sites and their theme configuration.
  resources :sites, only: %i[index show new create destroy] do
    post :audit, on: :member
    resource :theme_config, only: %i[show update], module: :sites do
      post :diff
    end
  end

  # Update: versions in lockstep, a release dry run, the consumer pin matrix.
  namespace :update do
    resource :versions, only: :show
    resource :release, only: :create
    resource :consumers, only: :show do
      post :drift
    end
  end

  resources :jobs, only: %i[index show] do
    post :cancel, on: :member
  end
  resource :settings, only: :show

  # A built preview, served from the other loopback origin for the iframe.
  get "preview/:build_id(/*path)", to: "previews#show", as: :preview, format: false, constraints: { build_id: /\h{12}/ }

  get "up" => "rails/health#show", as: :rails_health_check
end
