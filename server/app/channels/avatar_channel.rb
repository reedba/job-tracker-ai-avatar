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
    
    # Initialize the chat service for this connection
    user_or_guest = current_user || current_guest_link_id
    @avatar_service = AvatarChatService.new(user_or_guest, self)
    
    # Send connection confirmation
    welcome_message = if current_user
      "Welcome to your AI Avatar, #{current_user.full_name}. I'm here to help with your job search and career development."
    else
      "Welcome to your AI Avatar interview session. I'm here to conduct a professional interview and learn about your background."
    end
    
    transmit({
      type: 'connection',
      status: 'connected',
      message: welcome_message,
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

    # Process the message using the Avatar chat service (Phase 2: OpenAI integration)
    @avatar_service.process_message(message)
  end

  # Get conversation summary
  def get_conversation_summary(data)
    summary = @avatar_service.conversation_summary
    transmit({
      type: 'conversation_summary',
      summary: summary,
      timestamp: Time.current.iso8601
    })
  end
end