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
      resources :contacts do
        member do
          post :add_contact_date
        end
      end
    end
    
    # Top-level routes for fetching all resources
    resources :applications, only: [:index, :show, :update, :destroy]
    resources :contacts, only: [:index, :show, :create, :update, :destroy]
    
    # Settings management (singular resource - one per user)
    resource :setting, only: [:show, :update]
  end

  # Health check endpoint
  get "up" => "rails/health#show", as: :rails_health_check

  # Defines the root path route ("/")
  # root "posts#index"
end
