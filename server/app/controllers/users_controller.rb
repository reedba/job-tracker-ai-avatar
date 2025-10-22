class UsersController < ApplicationController
  include Authenticatable
  
  # Skip authentication for registration
  skip_before_action :authenticate_request, only: [:create]
  before_action :set_user, only: [:show, :update, :destroy]
  before_action :authorize_user, only: [:update, :destroy]

  # GET /users - List all users (admin only)
  def index
    authorize_admin
    @users = User.all
    Rails.logger.info("Retrieved list of all users")
    render json: {
      status: :success,
      users: @users.map { |user| user_response(user) }
    }
  end

  # GET /users/:id - Get a specific user
  def show
    Rails.logger.info("Retrieved user details for ID: #{params[:id]}")
    render json: {
      status: :success,
      user: user_response(@user)
    }
  end

  # POST /users - Create a new user (registration)
  def create
    Rails.logger.info("Attempting to create new user with email: #{user_params[:email]}")
    
    @user = User.new(user_params)
    
    if @user.save
      token = generate_token(@user)
      Rails.logger.info("Successfully created user with email: #{@user.email}")
      render json: {
        status: :created,
        user: user_response(@user),
        token: token,
        message: 'User registered successfully'
      }, status: :created
    else
      Rails.logger.error("Failed to create user: #{@user.errors.full_messages.join(', ')}")
      render json: {
        status: :unprocessable_entity,
        errors: @user.errors.full_messages,
        message: 'Registration failed'
      }, status: :unprocessable_entity
    end
  rescue StandardError => e
    Rails.logger.error("Unexpected error during user creation: #{e.message}")
    render json: {
      status: :internal_server_error,
      message: 'An unexpected error occurred'
    }, status: :internal_server_error
  end

  # PATCH/PUT /users/:id - Update a user
  def update
    if @user.update(update_user_params)
      Rails.logger.info("Successfully updated user: #{@user.email}")
      render json: {
        status: :success,
        user: user_response(@user),
        message: 'User updated successfully'
      }
    else
      Rails.logger.error("Failed to update user: #{@user.errors.full_messages.join(', ')}")
      render json: {
        status: :unprocessable_entity,
        errors: @user.errors.full_messages,
        message: 'Update failed'
      }, status: :unprocessable_entity
    end
  end

  # DELETE /users/:id - Delete a user
  def destroy
    @user.destroy
    Rails.logger.info("Successfully deleted user: #{@user.email}")
    render json: {
      status: :success,
      message: 'User deleted successfully'
    }
  end

  private

  def set_user
    @user = User.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    Rails.logger.error("User not found with ID: #{params[:id]}")
    render json: {
      status: :not_found,
      message: 'User not found'
    }, status: :not_found
  end

  def authorize_admin
    unless current_user.has_role?('admin')
      Rails.logger.warn("Unauthorized admin access attempt by user: #{current_user.email}")
      render json: {
        status: :forbidden,
        message: 'Admin access required'
      }, status: :forbidden
    end
  end

  def authorize_user
    unless current_user.id == @user.id || current_user.has_role?('admin')
      Rails.logger.warn("Unauthorized modification attempt by user: #{current_user.email}")
      render json: {
        status: :forbidden,
        message: 'You are not authorized to perform this action'
      }, status: :forbidden
    end
  end

  def user_params
    params.require(:user).permit(
      :email,
      :password,
      :password_confirmation,
      :first_name,
      :last_name,
      :phone_number,
      roles: []
    )
  end

  def update_user_params
    # Remove password fields if they're blank
    update_params = user_params
    if update_params[:password].blank? && update_params[:password_confirmation].blank?
      update_params.delete(:password)
      update_params.delete(:password_confirmation)
    end
    update_params
  end

  def user_response(user)
    {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      full_name: user.full_name,
      phone_number: user.phone_number,
      roles: user.roles,
      created_at: user.created_at,
      updated_at: user.updated_at
    }
  end
end
end
