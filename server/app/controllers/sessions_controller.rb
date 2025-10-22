class SessionsController < ApplicationController
  include Authenticatable
  
  # Skip authentication for login
  skip_before_action :authenticate_request, only: [:create]

  # POST /login - Create a new session (login)
  def create
    Rails.logger.info("Login attempt for email: #{login_params[:email]}")
    
    @user = User.find_by(email: login_params[:email])
    
    if @user&.authenticate(login_params[:password])
      token = generate_token(@user)
      Rails.logger.info("Successful login for user: #{@user.email}")
      render json: {
        status: :success,
        token: token,
        user: user_response(@user),
        message: 'Login successful'
      }
    else
      Rails.logger.warn("Failed login attempt for email: #{login_params[:email]}")
      render json: {
        status: :unauthorized,
        message: 'Invalid email or password'
      }, status: :unauthorized
    end
  rescue StandardError => e
    Rails.logger.error("Unexpected error during login: #{e.message}")
    render json: {
      status: :internal_server_error,
      message: 'An unexpected error occurred'
    }, status: :internal_server_error
  end

  # DELETE /logout - End the current session
  def destroy
    Rails.logger.info("Logout attempt for user: #{current_user.email}")
    # In a JWT setup, the client should discard the token
    # Here we can add any additional cleanup if needed
    render json: {
      status: :success,
      message: 'Logged out successfully'
    }
  end

  # GET /me - Get current session info
  def show
    Rails.logger.info("Session info requested for user: #{current_user.email}")
    render json: {
      status: :success,
      user: user_response(current_user)
    }
  end

  private

  def login_params
    params.require(:user).permit(:email, :password)
  end

  def user_response(user)
    {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      full_name: user.full_name,
      roles: user.roles,
      last_login: Time.current
    }
  end
end
