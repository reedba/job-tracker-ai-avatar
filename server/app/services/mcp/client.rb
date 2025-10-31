# frozen_string_literal: true

module Mcp
  class Client
    attr_reader :user, :langchain_adapter

    def initialize(user)
      @user = user
      @tools = load_tools
      @langchain_adapter = Mcp::Llm::LangchainAdapter.new(tools: prepare_tools_for_langchain)
    end

    # Main method to process a user query
    def query(message, conversation_history = [])
      context = build_context
      
      # Prepare the prompt with system context
      system_prompt = build_system_prompt(context)
      
      # Format conversation history
      messages = conversation_history + [{ role: 'user', content: message }]
      
      # Call LangChain adapter which handles tool calling automatically
      response = @langchain_adapter.call(
        system_prompt: system_prompt,
        messages: messages,
        tools: prepare_tools_for_langchain
      )
      
      response[:content]
    end

    private

    def load_tools
      {
        get_companies: Mcp::Tools::CompanyInsightsTool.new(user),
        get_applications: Mcp::Tools::ApplicationStatsTool.new(user),
        query_database: Mcp::Tools::DatabaseQueryTool.new(user)
      }
    end

    def prepare_tools_for_langchain
      # Convert our tools to LangChain-compatible format
      @tools.map do |name, tool|
        {
          name: name.to_s,
          description: tool.description,
          parameters: tool.parameters,
          executor: ->(params) { tool.execute(params) }
        }
      end
    end

    def build_context
      {
        user_name: user.full_name,
        total_companies: Company.where(user: user).count,
        total_applications: Application.joins(:company).where(companies: { user_id: user.id }).count,
        total_contacts: Contact.joins(:company).where(companies: { user_id: user.id }).count,
        monthly_goal: user.setting&.application_monthly_goal || 0,
        current_month_applications: Application.joins(:company)
                                               .where(companies: { user_id: user.id })
                                               .where('EXTRACT(MONTH FROM applications.created_at) = ?', Date.current.month)
                                               .where('EXTRACT(YEAR FROM applications.created_at) = ?', Date.current.year)
                                               .count
      }
    end

    def build_system_prompt(context)
      <<~PROMPT
        You are a helpful job search assistant for #{context[:user_name]}. 
        You have access to their job application tracking data.
        
        Current Stats:
        - Companies tracked: #{context[:total_companies]}
        - Total applications: #{context[:total_applications]}
        - Contacts: #{context[:total_contacts]}
        - Monthly goal: #{context[:monthly_goal]} applications
        - This month's applications: #{context[:current_month_applications]}
        
        Available Tools:
        - get_companies: Get detailed information about tracked companies
        - get_applications: Get application statistics and trends
        - query_database: Run specific queries on the database
        
        Be concise, helpful, and provide actionable insights. Use the tools when needed to answer questions accurately.
      PROMPT
    end
  end
end
