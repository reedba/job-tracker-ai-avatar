Rails.application.routes.draw do
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  scope '/api' do
    # User management
    resources :users
    post '/register', to: 'users#create'  # Alias for users#create

    # Session management
    post '/login', to: 'sessions#create'
    delete '/logout', to: 'sessions#destroy'
    get '/me', to: 'sessions#show'

    # Companies management
    resources :companies do
      resources :applications
    end
  end

  # Health check endpoint
  get "up" => "rails/health#show", as: :rails_health_check

  # Defines the root path route ("/")
  # root "posts#index"
end
