class OpenaiRealtimeService
  require 'faye/websocket'
  require 'json'
  require 'base64'

  def initialize(user, channel)
    @user = user
    @channel = channel
    @openai_ws = nil
    @session_id = SecureRandom.uuid
    Rails.logger.info "🔗 Initializing OpenAI Realtime Service for user: #{@user.id}"
  end

  def connect_to_openai
    # Ensure EventMachine is running for WebSocket connections
    unless EventMachine.reactor_running?
      Rails.logger.info "🔧 Starting EventMachine reactor for WebSocket connections"
      Thread.new { EventMachine.run }
      sleep(0.5) # Give EventMachine time to start
    end
    
    Rails.logger.info "🔗 Connecting to OpenAI Realtime API for user #{@user.id}"
    
    # OpenAI Realtime API WebSocket URL
    openai_url = 'wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01'
    
    # Get API key from credentials or environment
    api_key = Rails.application.credentials.openai_api_key || ENV['OPENAI_API_KEY']
    
    Rails.logger.info "🔑 API key available: #{api_key ? 'YES' : 'NO'}"
    Rails.logger.info "🔑 API key length: #{api_key&.length || 0}"
    
    # For testing - check if we can detect what's available
    Rails.logger.info "🔑 Credentials openai_api_key: #{Rails.application.credentials.openai_api_key ? 'SET' : 'NOT SET'}"
    Rails.logger.info "🔑 ENV OPENAI_API_KEY: #{ENV['OPENAI_API_KEY'] ? 'SET' : 'NOT SET'}"
    
    unless api_key
      Rails.logger.error "❌ OpenAI API key not found in credentials or environment"
      Rails.logger.error "❌ Please set OPENAI_API_KEY environment variable or add openai_api_key to Rails credentials"
      notify_client({ type: 'error', message: 'OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.' })
      return
    end
    
    headers = {
      'Authorization' => "Bearer #{api_key}",
      'OpenAI-Beta' => 'realtime=v1'
    }

    begin
      Rails.logger.info "🌐 Creating WebSocket connection to: #{openai_url}"
      @openai_ws = Faye::WebSocket::Client.new(openai_url, [], { headers: headers })

      @openai_ws.on :open do |event|
        Rails.logger.info "✅ Connected to OpenAI Realtime API"
        setup_session
        notify_client({ type: 'realtime_connected', status: 'connected' })
      end

      @openai_ws.on :message do |event|
        begin
          data = JSON.parse(event.data)
          Rails.logger.info "📥 OpenAI message received: #{data['type']}"
          handle_openai_message(data)
        rescue JSON::ParserError => e
          Rails.logger.error "❌ Failed to parse OpenAI message: #{e.message}"
        end
      end

      @openai_ws.on :close do |event|
        Rails.logger.warn "❌ OpenAI Realtime connection closed: #{event.code} - #{event.reason}"
        notify_client({ type: 'realtime_disconnected', status: 'disconnected', reason: event.reason })
      end

      @openai_ws.on :error do |event|
        Rails.logger.error "❌ OpenAI Realtime error: #{event.message}"
        notify_client({ type: 'error', message: 'Realtime connection error', details: event.message })
      end

    rescue => e
      Rails.logger.error "❌ Failed to create OpenAI Realtime connection: #{e.message}"
      notify_client({ type: 'error', message: 'Failed to connect to OpenAI Realtime API' })
    end
  end

  def send_audio(audio_data)
    return unless @openai_ws && @openai_ws.ready_state == Faye::WebSocket::API::OPEN

    # Send audio to OpenAI Realtime API
    message = {
      type: 'input_audio_buffer.append',
      audio: audio_data  # Base64 encoded audio
    }

    @openai_ws.send(JSON.generate(message))
    Rails.logger.debug "📤 Sent audio data to OpenAI (#{audio_data.length} chars)"
  end

  def commit_audio
    return unless @openai_ws && @openai_ws.ready_state == Faye::WebSocket::API::OPEN

    # Commit the audio buffer to trigger processing
    message = {
      type: 'input_audio_buffer.commit'
    }

    @openai_ws.send(JSON.generate(message))
    Rails.logger.info "✅ Committed audio buffer"
  end

  def send_text(text)
    return unless @openai_ws && @openai_ws.ready_state == Faye::WebSocket::API::OPEN

    # Send text message for text-based interaction
    message = {
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: text
          }
        ]
      }
    }

    @openai_ws.send(JSON.generate(message))

    # Trigger response generation
    @openai_ws.send(JSON.generate({
      type: 'response.create',
      response: {
        modalities: ['text', 'audio'],
        instructions: get_system_instructions
      }
    }))

    Rails.logger.info "📤 Sent text to OpenAI: #{text}"
  end

  def disconnect
    @openai_ws&.close if @openai_ws
    Rails.logger.info "🔌 Disconnected from OpenAI Realtime API"
  end

  # Test method for Rails console debugging
  def self.test_connection(user_id = 1)
    puts "🧪 Testing OpenAI Realtime connection..."
    
    # Initialize EventMachine if not running
    unless EventMachine.reactor_running?
      puts "🔧 Starting EventMachine reactor..."
      Thread.new { EventMachine.run }
      sleep(0.5) # Give EventMachine time to start
    else
      puts "✅ EventMachine already running"
    end
    
    # Create a simple mock user object
    user = Object.new
    def user.id; 1; end
    def user.full_name; "Test User"; end
    
    # Create a simple mock channel object
    mock_channel = Object.new
    def mock_channel.transmit(data)
      puts "📤 Mock channel would transmit: #{data}"
    end
    
    # Create service instance
    service = new(user, mock_channel)
    
    # Test API key availability
    api_key = Rails.application.credentials.openai_api_key || ENV['OPENAI_API_KEY']
    puts "🔑 API Key available: #{api_key ? 'YES' : 'NO'}"
    puts "🔑 API Key length: #{api_key&.length || 0}"
    
    # Test connection
    puts "🔌 Attempting to connect..."
    service.connect_to_openai
    
    # Wait a bit for connection
    sleep(2)
    
    # Test sending a simple text message
    if service.instance_variable_get(:@openai_ws)
      puts "📝 Sending test text message..."
      service.send_text("Hello, this is a test from Rails console.")
      
      # Wait for response
      sleep(3)
    else
      puts "❌ WebSocket connection not established"
    end
    
    service
  end

  private

  def setup_session
    # Configure the session with job search specific instructions
    session_config = {
      type: 'session.update',
      session: {
        modalities: ['text', 'audio'],
        instructions: get_system_instructions,
        voice: 'alloy',  # or 'echo', 'fable', 'onyx', 'nova', 'shimmer'
        input_audio_format: 'pcm16',
        output_audio_format: 'pcm16',
        input_audio_transcription: {
          model: 'whisper-1'
        },
        turn_detection: {
          type: 'server_vad',  # Server-side voice activity detection
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 800
        },
        tools: get_job_search_tools,
        tool_choice: 'auto',
        temperature: 0.8,
        max_response_output_tokens: 4096
      }
    }

    @openai_ws.send(JSON.generate(session_config))
    Rails.logger.info "⚙️ Session configured with job search tools"
  end

  def get_system_instructions
    user_name = @user.respond_to?(:name) ? @user.name : 'the user'
    
    <<~INSTRUCTIONS
      You are an AI Career Coach and Job Search Assistant for #{user_name}. 

      Your role is to help with:
      - Job search strategy and advice
      - Resume and cover letter optimization
      - Interview preparation and practice
      - Career development guidance
      - Job application tracking and organization
      - LinkedIn and networking strategies
      - Salary negotiation tips
      - Industry insights and trends

      You have access to tools to help manage their job search:
      - Search their saved jobs database
      - Track application statuses
      - Schedule interviews
      - Update profile information
      - Search external job boards

      Be conversational, encouraging, and actionable in your responses. 
      Keep responses concise but helpful for voice interaction.
      Ask follow-up questions to better understand their specific needs.
      
      The user prefers voice interaction, so structure responses to sound natural when spoken.
      Use a friendly, professional tone and provide practical, actionable advice.
    INSTRUCTIONS
  end

  def get_job_search_tools
    [
      {
        type: 'function',
        name: 'search_saved_jobs',
        description: 'Search through the user\'s saved job opportunities',
        parameters: {
          type: 'object',
          properties: {
            keywords: { 
              type: 'string', 
              description: 'Keywords to search for in job titles and descriptions' 
            },
            location: { 
              type: 'string', 
              description: 'Job location to filter by' 
            },
            company: { 
              type: 'string', 
              description: 'Company name to filter by' 
            },
            status: { 
              type: 'string', 
              description: 'Application status (saved, applied, interviewing, etc.)' 
            }
          }
        }
      },
      {
        type: 'function',
        name: 'get_application_status',
        description: 'Get the current status of job applications',
        parameters: {
          type: 'object',
          properties: {
            company_name: { 
              type: 'string', 
              description: 'Company name to check status for' 
            },
            limit: { 
              type: 'integer', 
              description: 'Number of recent applications to return (default 5)' 
            }
          }
        }
      },
      {
        type: 'function',
        name: 'update_application_status',
        description: 'Update the status of a job application',
        parameters: {
          type: 'object',
          properties: {
            job_id: { 
              type: 'integer', 
              description: 'ID of the job application to update' 
            },
            status: { 
              type: 'string', 
              description: 'New status (applied, phone_screen, interview_scheduled, etc.)' 
            },
            notes: { 
              type: 'string', 
              description: 'Additional notes about the status update' 
            }
          },
          required: ['job_id', 'status']
        }
      },
      {
        type: 'function',
        name: 'schedule_interview',
        description: 'Schedule an upcoming interview',
        parameters: {
          type: 'object',
          properties: {
            company: { 
              type: 'string', 
              description: 'Company name' 
            },
            position: { 
              type: 'string', 
              description: 'Job position title' 
            },
            datetime: { 
              type: 'string', 
              description: 'Interview date and time (ISO format)' 
            },
            type: { 
              type: 'string', 
              enum: ['phone', 'video', 'in_person'],
              description: 'Type of interview' 
            },
            interviewer: { 
              type: 'string', 
              description: 'Interviewer name(s)' 
            }
          },
          required: ['company', 'position', 'datetime', 'type']
        }
      }
    ]
  end

  def handle_openai_message(data)
    Rails.logger.debug "📥 OpenAI message: #{data['type']}"

    case data['type']
    when 'session.created'
      Rails.logger.info "✅ OpenAI session created: #{data['session']['id']}"
      
    when 'input_audio_buffer.speech_started'
      notify_client({ type: 'speech_started', message: 'Speech detected' })
      
    when 'input_audio_buffer.speech_stopped'
      notify_client({ type: 'speech_stopped', message: 'Processing speech...' })
      
    when 'conversation.item.input_audio_transcription.completed'
      # User's speech has been transcribed
      transcript = data['transcript']
      Rails.logger.info "🎤 User speech transcribed: #{transcript}"
      notify_client({ 
        type: 'user_transcript', 
        text: transcript,
        timestamp: Time.current.iso8601 
      })
      
    when 'response.audio.delta'
      # Streaming audio response from AI
      audio_delta = data['delta']
      notify_client({ 
        type: 'audio_delta', 
        audio: audio_delta,
        timestamp: Time.current.iso8601 
      })
      
    when 'response.audio.done'
      Rails.logger.info "🔊 Audio response completed"
      notify_client({ type: 'audio_complete', message: 'Audio response finished' })
      
    when 'response.text.delta'
      # Streaming text response from AI
      text_delta = data['delta']
      notify_client({ 
        type: 'text_delta', 
        text: text_delta,
        timestamp: Time.current.iso8601 
      })
      
    when 'response.text.done'
      text = data['text']
      Rails.logger.info "💬 AI text response: #{text}"
      notify_client({ 
        type: 'ai_response', 
        text: text,
        timestamp: Time.current.iso8601 
      })
      
    when 'response.function_call_arguments.delta'
      # Function call in progress
      notify_client({ type: 'function_call_progress', message: 'Using tools...' })
      
    when 'response.function_call_arguments.done'
      # Function call completed
      handle_function_call(data)
      
    when 'response.done'
      Rails.logger.info "✅ Complete response finished"
      notify_client({ type: 'response_complete', message: 'Ready for next input' })
      
    when 'error'
      Rails.logger.error "❌ OpenAI error: #{data['error']}"
      notify_client({ 
        type: 'error', 
        message: data['error']['message'] || 'An error occurred' 
      })
    end
  end

  def handle_function_call(data)
    function_name = data['name']
    arguments = JSON.parse(data['arguments'])
    call_id = data['call_id']

    Rails.logger.info "🛠️ Function call: #{function_name} with args: #{arguments}"

    result = case function_name
    when 'search_saved_jobs'
      search_saved_jobs(arguments)
    when 'get_application_status'
      get_application_status(arguments)
    when 'update_application_status'
      update_application_status(arguments)
    when 'schedule_interview'
      schedule_interview(arguments)
    else
      { error: "Unknown function: #{function_name}" }
    end

    # Send function result back to OpenAI
    function_result = {
      type: 'conversation.item.create',
      item: {
        type: 'function_call_output',
        call_id: call_id,
        output: JSON.generate(result)
      }
    }

    @openai_ws.send(JSON.generate(function_result))

    # Also notify the client about the function call
    notify_client({ 
      type: 'function_call_result', 
      function: function_name,
      result: result,
      timestamp: Time.current.iso8601
    })
  end

  def search_saved_jobs(args)
    return { jobs: [], message: "No job search capability for guests" } unless @user.respond_to?(:jobs)
    
    jobs = @user.jobs
    jobs = jobs.where("title ILIKE ?", "%#{args['keywords']}%") if args['keywords']
    jobs = jobs.where("location ILIKE ?", "%#{args['location']}%") if args['location']
    jobs = jobs.where("company ILIKE ?", "%#{args['company']}%") if args['company']
    
    jobs.limit(10).map do |job|
      {
        id: job.id,
        title: job.title,
        company: job.company,
        location: job.location,
        salary: job.salary,
        status: job.status,
        applied_date: job.created_at.strftime("%B %d, %Y")
      }
    end
  rescue => e
    Rails.logger.error "Error searching jobs: #{e.message}"
    { error: "Failed to search jobs", details: e.message }
  end

  def get_application_status(args)
    return { applications: [], message: "No application tracking for guests" } unless @user.respond_to?(:jobs)
    
    applications = @user.jobs.order(created_at: :desc)
    applications = applications.where("company ILIKE ?", "%#{args['company_name']}%") if args['company_name']
    
    limit = args['limit'] || 5
    applications.limit(limit).map do |job|
      {
        id: job.id,
        company: job.company,
        position: job.title,
        status: job.status,
        applied_date: job.created_at.strftime("%B %d, %Y"),
        last_updated: job.updated_at.strftime("%B %d, %Y")
      }
    end
  rescue => e
    Rails.logger.error "Error getting application status: #{e.message}"
    { error: "Failed to get application status", details: e.message }
  end

  def update_application_status(args)
    return { error: "Application updates not available for guests" } unless @user.respond_to?(:jobs)
    
    job = @user.jobs.find_by(id: args['job_id'])
    return { error: "Job not found" } unless job

    job.update(
      status: args['status'],
      notes: args['notes']
    )

    {
      success: true,
      job: {
        id: job.id,
        company: job.company,
        position: job.title,
        status: job.status,
        notes: job.notes
      }
    }
  rescue => e
    Rails.logger.error "Error updating application: #{e.message}"
    { error: "Failed to update application", details: e.message }
  end

  def schedule_interview(args)
    # This could integrate with a calendar system or just store in the database
    interview_data = {
      company: args['company'],
      position: args['position'],
      datetime: args['datetime'],
      type: args['type'],
      interviewer: args['interviewer']
    }

    # For now, just return confirmation (you could store in DB or integrate with calendar)
    {
      success: true,
      message: "Interview scheduled with #{args['company']} for #{args['position']}",
      interview: interview_data
    }
  rescue => e
    Rails.logger.error "Error scheduling interview: #{e.message}"
    { error: "Failed to schedule interview", details: e.message }
  end

  def notify_client(data)
    @channel.broadcast_to(@user, data)
  end
end