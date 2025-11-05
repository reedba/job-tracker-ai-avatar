require 'securerandom'
require 'jwt'

class AvatarLinksController < ApplicationController
  include Authenticatable

  # Require authentication for creating links; verification and starting a session are public
  before_action :authenticate_request, only: [:create]
  skip_before_action :authenticate_request, only: [:verify, :start_session]

  # POST /api/avatar_links
  def create
    unless current_user && current_user.is_admin?
      return render json: { error: 'Unauthorized' }, status: :unauthorized
    end

    token = SecureRandom.hex(12)
    @link = AvatarLink.new(
      token: token,
      creator: current_user,
      name: params[:name],
      expires_at: params[:expires_at],
      max_uses: params[:max_uses] || 1
    )

    if @link.save
      render json: { id: @link.id, token: @link.token, url: "#{request.base_url}/avatar/#{@link.token}", expires_at: @link.expires_at }, status: :created
    else
      render json: { errors: @link.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # GET /api/avatar_links/verify?token=xxxx
  def verify
    token = params[:token]
    unless token.present?
      return render json: { valid: false, error: 'token missing' }, status: :bad_request
    end

    link = AvatarLink.find_by(token: token)
    if link && link.active?
      render json: { valid: true, id: link.id, name: link.name, expires_at: link.expires_at }
    else
      render json: { valid: false }, status: :not_found
    end
  end

  # POST /api/avatar_links/:id/start_session
  # Issues a short-lived session JWT (1 hour) that can be used to connect to ActionCable
  # This consumes the link, making it single-use
  def start_session
    link = AvatarLink.find_by(id: params[:id])
    if link.nil? || !link.can_start_session?
      return render json: { error: 'Link not available, expired, or already used' }, status: :forbidden
    end

    # Consume the link (mark as used and deactivate)
    link.consume!

    # Build a session token (1 hour)
    exp = 1.hour.from_now.to_i
    payload = { session: true, link_id: link.id, exp: exp }
    session_token = JWT.encode(payload, JsonWebToken::SECRET_KEY, JsonWebToken::ALGORITHM)

    render json: { session_token: session_token, expires_at: Time.at(exp).utc }, status: :ok
  end
end
