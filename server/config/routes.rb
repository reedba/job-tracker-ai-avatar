Rails.application.routes.draw do
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Mount Action Cable for WebSocket connections
  mount ActionCable.server => '/cable'

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
    
    # Avatar link endpoints (temporary shareable links for AI Avatar)
    resources :avatar_links, only: [:create] do
      collection do
        get :verify
      end
      member do
        post :start_session
      end
    end
  end

  # Health check endpoint
  get "up" => "rails/health#show", as: :rails_health_check

  # Development helper: redirect avatar links to the frontend dev server so
  # visiting /avatar/:token in development opens the React route served by Vite.
  if Rails.env.development?
    get '/avatar/:token', to: redirect('http://localhost:5173/avatar/%{token}')
  end

  # Defines the root path route ("/")
  # root "posts#index"
end
