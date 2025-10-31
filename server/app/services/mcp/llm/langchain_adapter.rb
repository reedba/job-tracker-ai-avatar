# frozen_string_literal: true

require 'openai'

module Mcp
  module Llm
    class LangchainAdapter
      attr_reader :client

      def initialize(tools: [])
        @client = setup_client
        @tools = tools
      end

      def call(system_prompt:, messages:, tools: [])
        # Update tools if provided
        @tools = tools if tools.any?

        # Format messages for OpenAI
        formatted_messages = [
          { role: "system", content: system_prompt }
        ] + messages

        # Prepare tools in OpenAI function format
        openai_tools = format_tools_for_openai

        # Call OpenAI with function calling
        response = @client.chat(
          parameters: {
            model: 'gpt-4o-mini',
            messages: formatted_messages,
            tools: openai_tools.any? ? openai_tools : nil,
            tool_choice: "auto",
            temperature: 0.7
          }
        )

        # Check if AI wants to call a function
        message = response.dig('choices', 0, 'message')
        
        if message['tool_calls']
          # Execute tool calls
          tool_results = execute_tool_calls(message['tool_calls'])
          
          # Add assistant message and tool results to conversation
          formatted_messages << message
          tool_results.each do |result|
            formatted_messages << {
              role: "tool",
              tool_call_id: result[:tool_call_id],
              content: result[:content].to_json
            }
          end

          # Get final response with tool results
          final_response = @client.chat(
            parameters: {
              model: 'gpt-4o-mini',
              messages: formatted_messages,
              temperature: 0.7
            }
          )
          
          content = final_response.dig('choices', 0, 'message', 'content')
        else
          content = message['content']
        end

        parse_response(content)
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
        if ENV['OPENAI_API_KEY'].present?
          OpenAI::Client.new(access_token: ENV['OPENAI_API_KEY'])
        else
          raise 'No OPENAI_API_KEY configured'
        end
      end

      def format_tools_for_openai
        @tools.map do |tool|
          {
            type: "function",
            function: {
              name: tool.name,
              description: tool.description,
              parameters: tool.parameters
            }
          }
        end
      end

      def execute_tool_calls(tool_calls)
        tool_calls.map do |tool_call|
          tool_name = tool_call.dig('function', 'name')
          arguments = JSON.parse(tool_call.dig('function', 'arguments') || '{}', symbolize_names: true)
          
          # Find the matching tool
          tool = @tools.find { |t| t.name == tool_name }
          
          if tool
            result = tool.execute(arguments)
            {
              tool_call_id: tool_call['id'],
              content: result
            }
          else
            {
              tool_call_id: tool_call['id'],
              content: { error: "Tool #{tool_name} not found" }
            }
          end
        end
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
