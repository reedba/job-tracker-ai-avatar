# frozen_string_literal: true

class ChatService
  attr_reader :user, :channel

  def initialize(user, channel)
    @user = user
    @channel = channel
    @mcp_client = Mcp::Client.new(user)
    @conversation_history = []
  end

  def process_message(message)
    # Add user message to history
    @conversation_history << {
      role: 'user',
      content: message,
      timestamp: Time.current
    }

    # Broadcast that we're processing
    broadcast_status('typing')

    begin
      # Get response from MCP client
      response = @mcp_client.query(message, @conversation_history)

      # Add assistant response to history
      @conversation_history << {
        role: 'assistant',
        content: response,
        timestamp: Time.current
      }

      # Broadcast the response
      broadcast_message({
        type: 'message',
        sender: 'bot',
        text: response,
        timestamp: Time.current.iso8601
      })

      broadcast_status('idle')
      
    rescue StandardError => e
      Rails.logger.error "ChatService Error: #{e.message}"
      Rails.logger.error e.backtrace.join("\n")
      
      broadcast_error("Sorry, I encountered an error processing your request. Please try again.")
      broadcast_status('idle')
    end
  end

  private

  def broadcast_message(data)
    channel.broadcast_message(data)
  end

  def broadcast_status(status)
    channel.broadcast_message({
      type: 'status',
      status: status,
      timestamp: Time.current.iso8601
    })
  end

  def broadcast_error(message)
    channel.broadcast_message({
      type: 'error',
      message: message,
      timestamp: Time.current.iso8601
    })
  end
end
