class SpeechController < ApplicationController
  require 'net/http'
  require 'uri'
  require 'json'

  def transcribe
    Rails.logger.info "=== WHISPER TRANSCRIBE REQUEST ==="
    Rails.logger.info "Params present: #{params.keys}"
    
    unless params[:file].present?
      Rails.logger.error "No audio file provided in params"
      render json: { error: 'No audio file provided' }, status: :bad_request
      return
    end

    audio_file = params[:file]
    
    Rails.logger.info "Audio file details:"
    Rails.logger.info "  - Original filename: #{audio_file.original_filename rescue 'N/A'}"
    Rails.logger.info "  - Content type: #{audio_file.content_type rescue 'N/A'}"
    Rails.logger.info "  - Size: #{audio_file.size rescue 'N/A'} bytes"
    
    # Validate file type
    unless audio_file.content_type.include?('audio')
      Rails.logger.error "Invalid file type: #{audio_file.content_type}"
      render json: { error: 'Invalid file type. Please provide an audio file.' }, status: :bad_request
      return
    end

    begin
      # Call OpenAI Whisper API
      transcription = transcribe_with_whisper(audio_file)
      
      if transcription
        Rails.logger.info "Transcription successful: #{transcription}"
        render json: { text: transcription }
      else
        Rails.logger.error "Transcription failed - nil result"
        render json: { error: 'Failed to transcribe audio' }, status: :unprocessable_entity
      end
    rescue => e
      Rails.logger.error "Whisper transcription error: #{e.message}"
      Rails.logger.error "Error backtrace: #{e.backtrace.first(5).join("\n")}"
      render json: { error: 'Transcription service unavailable', details: e.message }, status: :service_unavailable
    end
  end

  private

  def transcribe_with_whisper(audio_file)
    Rails.logger.info "=== WHISPER API CALL ==="
    
    # Get API key
    api_key = Rails.application.credentials.openai_api_key || ENV['OPENAI_API_KEY']
    
    Rails.logger.info "API key present: #{api_key.present?}"
    Rails.logger.info "API key length: #{api_key&.length || 0}"
    
    unless api_key
      Rails.logger.error "OpenAI API key not found in credentials or ENV"
      raise "OpenAI API key not configured"
    end

    uri = URI('https://api.openai.com/v1/audio/transcriptions')
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = true

    Rails.logger.info "Creating HTTP request to: #{uri}"

    # Create multipart form data
    boundary = "----WebKitFormBoundary#{SecureRandom.hex(16)}"
    
    form_data = []
    form_data << "--#{boundary}\r\n"
    form_data << "Content-Disposition: form-data; name=\"file\"; filename=\"#{audio_file.original_filename || 'audio.webm'}\"\r\n"
    form_data << "Content-Type: #{audio_file.content_type || 'audio/webm'}\r\n"
    form_data << "\r\n"
    form_data << audio_file.read
    form_data << "\r\n"
    
    form_data << "--#{boundary}\r\n"
    form_data << "Content-Disposition: form-data; name=\"model\"\r\n"
    form_data << "\r\n"
    form_data << "whisper-1"
    form_data << "\r\n"
    
    form_data << "--#{boundary}--\r\n"

    body = form_data.join

    Rails.logger.info "Form data created, body length: #{body.length}"

    request = Net::HTTP::Post.new(uri)
    request['Authorization'] = "Bearer #{api_key}"
    request['Content-Type'] = "multipart/form-data; boundary=#{boundary}"
    request.body = body

    Rails.logger.info "Sending request to OpenAI..."

    response = http.request(request)
    
    Rails.logger.info "Response status: #{response.code}"
    Rails.logger.info "Response body: #{response.body}"

    if response.code == '200'
      result = JSON.parse(response.body)
      Rails.logger.info "Parsed response: #{result}"
      return result['text']
    else
      Rails.logger.error "OpenAI API error: #{response.code} - #{response.body}"
      raise "OpenAI API error: #{response.code} - #{response.body}"
    end
  rescue JSON::ParserError => e
    Rails.logger.error "JSON parsing error: #{e.message}"
    Rails.logger.error "Response body was: #{response&.body}"
    raise "Failed to parse OpenAI response"
  rescue => e
    Rails.logger.error "Whisper API error: #{e.message}"
    Rails.logger.error "Error class: #{e.class}"
    Rails.logger.error "Backtrace: #{e.backtrace.first(5).join("\n")}"
    raise e
  end
end