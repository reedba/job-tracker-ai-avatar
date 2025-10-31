# frozen_string_literal: true

module Mcp
  module Tools
    class GetCompaniesTool
      def initialize(user:)
        @user = user
      end

      def name
        "get_companies"
      end

      def description
        "Get all companies tracked by the user. Optional parameter: status (active, inactive, all)"
      end

      def parameters
        {
          type: "object",
          properties: {
            status: {
              type: "string",
              description: "Filter by status: active, inactive, or all",
              enum: ["active", "inactive", "all"]
            }
          }
        }
      end

      def execute(params = {})
        companies = Company.where(user_id: @user.id)
        
        # Optional: filter by status if provided
        if params[:status] && params[:status] != "all"
          companies = companies.where(status: params[:status])
        end

        companies_data = companies.map do |company|
          {
            id: company.id,
            name: company.name,
            status: company.status,
            industry: company.industry,
            website: company.website,
            notes: company.notes,
            created_at: company.created_at
          }
        end

        {
          success: true,
          count: companies_data.length,
          companies: companies_data
        }
      rescue => e
        {
          success: false,
          error: e.message
        }
      end
    end
  end
end
