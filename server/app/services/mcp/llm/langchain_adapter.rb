# frozen_string_literal: true

module Mcp
  module Llm
    class LangchainAdapter
      attr_reader :client

      def initialize(tools: [])
        @client = setup_client
        @tools = tools  # Store original tool definitions
        @model = ENV['HUGGINGFACE_MODEL'] || 'HuggingFaceH4/zephyr-7b-beta'
      end

      def call(system_prompt:, messages:, tools: [])
        # Update tools if provided
        @tools = tools if tools.any?

        # Format conversation history
        prompt = format_conversation(system_prompt, messages)

        # Make direct API call
        response = execute_direct(prompt)

        parse_response(response)
      rescue StandardError => e
        Rails.logger.error "LLM Error: #{e.message}"
        Rails.logger.error e.backtrace.join("\n")
        {
          content: "I encountered an error processing your request. Please try again.",
          tool_calls: nil,
          error: e.message
        }
      end

      private

      def setup_client
        # Priority: HuggingFace > OpenAI > Anthropic
        if ENV['HUGGINGFACE_API_KEY'].present?
          setup_huggingface_client
        elsif ENV['OPENAI_API_KEY'].present?
          setup_openai_client
        elsif ENV['ANTHROPIC_API_KEY'].present?
          setup_anthropic_client
        else
          raise 'No LLM API key configured. Set HUGGINGFACE_API_KEY, OPENAI_API_KEY, or ANTHROPIC_API_KEY'
        end
      end

      def setup_huggingface_client
        # HuggingFace Inference API integration - using new router endpoint
        # Return a simple struct that responds to our API
        Struct.new(:api_key, :base_url).new(
          ENV['HUGGINGFACE_API_KEY'],
          'https://api-inference.huggingface.co'
        )
      end

      def setup_openai_client
        require 'openai'
        
        OpenAI::Client.new(
          access_token: ENV['OPENAI_API_KEY']
        )
      end

      def setup_anthropic_client
        require 'anthropic'
        
        Anthropic::Client.new(
          access_token: ENV['ANTHROPIC_API_KEY']
        )
      end

      def format_conversation(system_prompt, messages)
        formatted = "System: #{system_prompt}\n\n"
        
        messages.each do |msg|
          role = msg[:role] == 'assistant' ? 'Assistant' : 'User'
          formatted += "#{role}: #{msg[:content]}\n\n"
        end
        
        formatted
      end

      def execute_direct(prompt)
        # Check which client we're using and call the appropriate API
        if @client.is_a?(OpenAI::Client)
          execute_openai(prompt)
        else
          execute_huggingface(prompt)
        end
      end

      def execute_openai(prompt)
        response = @client.chat(
          parameters: {
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7
          }
        )
        response.dig('choices', 0, 'message', 'content')
      end

      def execute_huggingface(prompt)
        require 'faraday'
        
        conn = Faraday.new(url: @client.base_url) do |f|
          f.request :json
          f.response :json
          f.adapter Faraday.default_adapter
        end

        response = conn.post("/models/#{@model}") do |req|
          req.headers['Authorization'] = "Bearer #{@client.api_key}"
          req.headers['Content-Type'] = 'application/json'
          req.body = { 
            inputs: prompt,
            parameters: {
              max_new_tokens: 500,
              temperature: 0.7,
              return_full_text: false
            }
          }
        end
        
        # Parse response
        result = response.body
        if result.is_a?(Array) && result.first.is_a?(Hash)
          result.first['generated_text']
        elsif result.is_a?(Hash)
          result['generated_text'] || result['error'] || result.to_s
        else
          result.to_s
        end
      rescue => e
        Rails.logger.error "HuggingFace API Error: #{e.message}"
        "Error connecting to AI service"
      end

      def parse_response(response)
        {
          content: response.to_s,
          tool_calls: nil,
          metadata: {}
        }
      end
    end
  end
end
