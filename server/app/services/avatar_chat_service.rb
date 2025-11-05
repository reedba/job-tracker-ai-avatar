# frozen_string_literal: true

class AvatarChatService
  attr_reader :user, :channel, :guest_link_id

  def initialize(user_or_guest_link_id, channel)
    if user_or_guest_link_id.is_a?(User)
      @user = user_or_guest_link_id
      @guest_link_id = nil
    else
      @user = nil
      @guest_link_id = user_or_guest_link_id
    end
    
    @channel = channel
    @openai_client = setup_openai_client
    @conversation_history = []
  end

  def process_message(message)
    # Add user message to history
    @conversation_history << {
      role: 'user',
      content: message,
      timestamp: Time.current
    }

    # Broadcast typing indicator
    broadcast_status('typing')

    begin
      # Build system prompt based on user type
      system_prompt = build_system_prompt
      
      # Prepare messages for OpenAI (exclude timestamps)
      openai_messages = [
        { role: 'system', content: system_prompt }
      ] + @conversation_history.map { |msg| { role: msg[:role], content: msg[:content] } }

      # Call OpenAI API
      response = @openai_client.chat(
        parameters: {
          model: 'gpt-4o-mini',
          messages: openai_messages,
          temperature: 0.7,
          max_tokens: 500
        }
      )

      # Extract response text
      response_text = response.dig('choices', 0, 'message', 'content')
      
      if response_text.present?
        # Add assistant response to history
        @conversation_history << {
          role: 'assistant',
          content: response_text,
          timestamp: Time.current
        }

        # Broadcast the response
        broadcast_message({
          type: 'message',
          text: response_text,
          sender: 'bot',
          timestamp: Time.current.iso8601
        })
      else
        broadcast_error("I didn't receive a proper response. Please try again.")
      end

      broadcast_status('idle')
      
    rescue StandardError => e
      Rails.logger.error "AvatarChatService Error: #{e.message}"
      Rails.logger.error e.backtrace.join("\n")
      
      error_message = if @user
        "I encountered an error processing your request. Please try again."
      else
        "I'm having trouble processing your request right now. This might be a temporary issue with the interview system."
      end
      
      broadcast_error(error_message)
      broadcast_status('idle')
    end
  end

  # Get conversation summary for context
  def conversation_summary
    {
      message_count: @conversation_history.length,
      session_type: @user ? 'authenticated' : 'guest_interview',
      user_name: @user&.full_name || 'Guest',
      guest_link_id: @guest_link_id,
      started_at: @conversation_history.first&.dig(:timestamp),
      last_message_at: @conversation_history.last&.dig(:timestamp)
    }
  end

  private

  def setup_openai_client
    if ENV['OPENAI_API_KEY'].present?
      require 'openai'
      OpenAI::Client.new(access_token: ENV['OPENAI_API_KEY'])
    else
      raise 'No OPENAI_API_KEY configured'
    end
  end

  def build_system_prompt
    if @user
      # Authenticated user system prompt
      <<~PROMPT
        You are an AI Avatar assistant for #{@user.full_name}.
        
        You are helping them with their job search and career development.
        Be helpful, professional, and provide actionable advice.
        
        Current conversation context:
        - User: #{@user.full_name}
        - Session type: Authenticated user
        - Time: #{Time.current.strftime('%Y-%m-%d %H:%M:%S %Z')}
        
        Keep responses concise but informative. Ask follow-up questions when appropriate.
      PROMPT
    else
      # Guest interview system prompt
      <<~PROMPT
        You are an AI Avatar conducting a professional interview or consultation session.
        
        Current session context:
        - Session type: Guest interview (1-hour session)
        - Time: #{Time.current.strftime('%Y-%m-%d %H:%M:%S %Z')}
        
        INTERVIEW GUIDELINES:
        - Conduct a professional, engaging interview
        - Ask thoughtful follow-up questions
        - Maintain a conversational, human-like tone
        - Focus on the visitor's goals and experiences
        - Provide insights and advice when appropriate
        - Keep responses concise but meaningful
        - You have a full hour to conduct a thorough interview
        
        You are here to help assess the visitor's qualifications, interests, and fit
        for potential opportunities while providing a positive experience.
      PROMPT
    end
  end

  def get_stream_name
    if @user
      "avatar_#{@user.id}"
    elsif @guest_link_id
      "avatar_guest_#{@guest_link_id}"
    else
      nil
    end
  end

  def broadcast_message(data)
    stream_name = get_stream_name
    return unless stream_name
    
    ActionCable.server.broadcast(stream_name, data)
  end

  def broadcast_status(status)
    stream_name = get_stream_name
    return unless stream_name
    
    ActionCable.server.broadcast(stream_name, {
      type: 'status',
      status: status,
      timestamp: Time.current.iso8601
    })
  end

  def broadcast_error(message)
    stream_name = get_stream_name
    return unless stream_name
    
    ActionCable.server.broadcast(stream_name, {
      type: 'error',
      message: message,
      timestamp: Time.current.iso8601
    })
  end
end