module Authenticatable
  extend ActiveSupport::Concern

  included do
    before_action :authenticate_request, except: [:create]
    attr_reader :current_user
  end

  private

  def authenticate_request
    header = request.headers['Authorization']
    token = header.split(' ').last if header
    
    begin
      decoded = JsonWebToken.decode(token)
      @current_user = User.find(decoded[:user_id])
    rescue ActiveRecord::RecordNotFound, StandardError => e
      Rails.logger.error("Authentication failed: #{e.message}")
      render json: { error: 'Unauthorized' }, status: :unauthorized
    end
  end

  def generate_token(user)
    JsonWebToken.encode(user_id: user.id)
  end
end
