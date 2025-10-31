class ChatChannel < ApplicationCable::Channel
  def subscribed
    # Stream from a user-specific channel
    stream_from "chat_#{current_user.id}"
    
    # Send a welcome message
    ActionCable.server.broadcast(
      "chat_#{current_user.id}",
      {
        type: 'system',
        message: 'Connected to AI assistant',
        timestamp: Time.current.iso8601
      }
    )
  end

  def unsubscribed
    # Any cleanup needed when channel is unsubscribed
    stop_all_streams
  end

  def receive(data)
    # Handle incoming messages from the client
    message = data['message']
    
    if message.blank?
      transmit({ type: 'error', message: 'Message cannot be blank' })
      return
    end

    # Process the message asynchronously using ChatService
    ChatService.new(current_user, self).process_message(message)
  end

  def broadcast_message(data)
    # Helper method to broadcast messages back to the user
    ActionCable.server.broadcast("chat_#{current_user.id}", data)
  end
end
