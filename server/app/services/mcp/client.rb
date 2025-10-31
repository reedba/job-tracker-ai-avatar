# frozen_string_literal: true

module Mcp
  class Client
    attr_reader :user, :langchain_adapter

    def initialize(user)
      @user = user
      @langchain_tools = initialize_langchain_tools
      @langchain_adapter = Mcp::Llm::LangchainAdapter.new(tools: @langchain_tools)
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
        tools: @langchain_tools
      )
      
      response[:content]
    end

    private

    def initialize_langchain_tools
      # Create instances of LangChain-compatible tools
      [
        Mcp::Tools::GetCompaniesTool.new(user: @user),
        Mcp::Tools::GetApplicationsTool.new(user: @user),
        Mcp::Tools::GetContactsTool.new(user: @user)
      ]
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
        You have access to their job application tracking data through tools.
        
        Current Stats:
        - Companies tracked: #{context[:total_companies]}
        - Total applications: #{context[:total_applications]}
        - Contacts: #{context[:total_contacts]}
        - Monthly goal: #{context[:monthly_goal]} applications
        - This month's applications: #{context[:current_month_applications]}
        
        Available Tools:
        - get_companies: Get detailed information about all tracked companies (with optional status filter)
        - get_applications: Get detailed application data (with optional filters: status, company_id, month, year)
        - get_contacts: Get contact information (with optional filters: company_id, role)
        
        When a user asks about specific data (like "show me applications" or "what companies do I have"), 
        USE THE TOOLS to fetch the actual data instead of just referring to the summary stats above.
        
        Be concise, helpful, and provide actionable insights based on the actual data from the tools.
      PROMPT
    end
  end
end
