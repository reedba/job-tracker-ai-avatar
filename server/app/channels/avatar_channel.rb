# frozen_string_literal: true

class AvatarChannel < ApplicationCable::Channel
  def subscribed
    # Create a unique stream for this connection
    # Use user ID for authenticated users, guest link ID for guests
    stream_name = if current_user
      "avatar_#{current_user.id}"
    elsif current_guest_link_id
      "avatar_guest_#{current_guest_link_id}"
    else
      reject # No valid authentication
      return
    end

    stream_from stream_name
    
    # Send connection confirmation
    transmit({
      type: 'connection',
      status: 'connected',
      message: 'Connected to AI Avatar',
      user_type: current_user ? 'authenticated' : 'guest',
      timestamp: Time.current.iso8601
    })
  end

  def unsubscribed
    # Cleanup when channel is unsubscribed
    Rails.logger.info "AvatarChannel unsubscribed"
  end

  def receive(data)
    Rails.logger.info "AvatarChannel received: #{data.inspect}"
    
    message = data['message']
    return unless message.present?

    # Get the stream name (same logic as subscribed)
    stream_name = if current_user
      "avatar_#{current_user.id}"
    elsif current_guest_link_id
      "avatar_guest_#{current_guest_link_id}"
    else
      return
    end

    # Echo the message back with a simple response for testing
    ActionCable.server.broadcast(stream_name, {
      type: 'message',
      text: "Echo: #{message}",
      sender: 'bot',
      timestamp: Time.current.iso8601
    })
  end
end