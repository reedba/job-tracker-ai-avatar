# frozen_string_literal: true

class AvatarChannel < ApplicationCable::Channel
  def subscribed
    current_user_or_guest = find_verified_user_or_guest
    return reject unless current_user_or_guest

    # Stream from user-specific channel
    stream_for current_user_or_guest

    # Initialize OpenAI Realtime connection
    @realtime_service = OpenaiRealtimeService.new(current_user_or_guest, self)
    @realtime_service.connect_to_openai

    # Send connection confirmation
    user_type = current_user_or_guest.is_a?(User) ? 'authenticated' : 'guest'
    welcome_message = if current_user_or_guest.is_a?(User)
      "Welcome to your AI Career Coach, #{current_user_or_guest.full_name}. I'm here to help with your job search and career development."
    else
      "Welcome to your AI Career Coach interview session. I'm here to help with your job search questions."
    end

    transmit({
      type: 'connection',
      status: 'connected',
      message: welcome_message,
      user_type: user_type,
      timestamp: Time.current.iso8601
    })

    Rails.logger.info "AvatarChannel subscribed for #{user_type}: #{current_user_or_guest.id}"
  end

  def unsubscribed
    Rails.logger.info "AvatarChannel unsubscribed"
    @realtime_service&.disconnect
  end

  def receive(data)
    Rails.logger.info "AvatarChannel received: #{data}"
    
    case data['type']
    when 'audio'
      # Handle audio data from client
      handle_audio_data(data)
    when 'text'
      # Handle text message
      handle_text_message(data)
    when 'commit_audio'
      # Client finished sending audio
      @realtime_service&.commit_audio
    else
      # Backward compatibility with old message format
      handle_legacy_message(data)
    end
  end

  private

  def handle_audio_data(data)
    audio_data = data['audio']  # Base64 encoded audio
    @realtime_service&.send_audio(audio_data)
  end

  def handle_text_message(data)
    message = data['message'] || data['text']
    @realtime_service&.send_text(message)
  end

  def handle_legacy_message(data)
    # For backward compatibility with existing message format
    message = data['message']
    return unless message

    @realtime_service&.send_text(message)
  end

  def find_verified_user_or_guest
    # Use the identifiers already set up in ApplicationCable::Connection
    if current_user
      # Authenticated user
      current_user
    elsif current_guest_link_id
      # Guest session - create a temporary guest object
      link = AvatarLink.find_by(id: current_guest_link_id)
      if link
        OpenStruct.new(
          id: "guest_#{current_guest_link_id}",
          name: 'Guest User',
          is_guest: true,
          link_id: current_guest_link_id
        )
      else
        nil
      end
    else
      nil
    end
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