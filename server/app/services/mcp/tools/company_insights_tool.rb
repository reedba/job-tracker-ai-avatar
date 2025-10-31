# frozen_string_literal: true

module Mcp
  module Tools
    class CompanyInsightsTool
      attr_reader :user

      def initialize(user)
        @user = user
      end

      def description
        "Get detailed information about companies the user is tracking, including application counts, contacts, and recent activity"
      end

      def parameters
        {
          type: "object",
          properties: {
            company_name: {
              type: "string",
              description: "Optional: Filter by specific company name"
            },
            limit: {
              type: "integer",
              description: "Number of companies to return (default: 10)"
            },
            sort_by: {
              type: "string",
              enum: ["name", "application_count", "recent_activity"],
              description: "How to sort the results"
            }
          }
        }
      end

      def execute(params = {})
        companies = Company.where(user: user)
                          .includes(:applications, :contacts)

        # Filter by name if provided
        if params[:company_name].present?
          companies = companies.where("name ILIKE ?", "%#{params[:company_name]}%")
        end

        # Sort
        companies = case params[:sort_by]
                   when "application_count"
                     companies.left_joins(:applications)
                             .group(:id)
                             .order("COUNT(applications.id) DESC")
                   when "recent_activity"
                     companies.order(updated_at: :desc)
                   else
                     companies.order(:name)
                   end

        # Limit
        limit = params[:limit] || 10
        companies = companies.limit(limit)

        # Format results
        companies.map do |company|
          {
            id: company.id,
            name: company.name,
            website: company.website,
            location: company.location,
            industry: company.industry,
            application_count: company.applications.count,
            contact_count: company.contacts.count,
            contacts: company.contacts.map { |c| { name: c.full_name, role: c.role } },
            recent_applications: company.applications.order(created_at: :desc).limit(3).map do |app|
              {
                title: app.job_title,
                status: app.status,
                applied_at: app.applied_at&.strftime("%Y-%m-%d")
              }
            end
          }
        end
      end
    end
  end
end
