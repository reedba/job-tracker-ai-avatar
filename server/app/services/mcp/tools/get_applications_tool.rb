# frozen_string_literal: true

module Mcp
  module Tools
    class GetApplicationsTool
      def initialize(user:)
        @user = user
      end

      def name
        "get_applications"
      end

      def description
        "Get all job applications for the user. Optional parameters: status, company_id, month, year"
      end

      def parameters
        {
          type: "object",
          properties: {
            status: {
              type: "string",
              description: "Filter by application status"
            },
            company_id: {
              type: "integer",
              description: "Filter by specific company ID"
            },
            month: {
              type: "integer",
              description: "Filter by month (1-12)"
            },
            year: {
              type: "integer",
              description: "Filter by year"
            }
          }
        }
      end

      def execute(params = {})
        company_ids = Company.where(user_id: @user.id).pluck(:id)
        applications = Application.joins(:company).where(companies: { user_id: @user.id })

        # Filter by status if provided
        if params[:status]
          applications = applications.where(status: params[:status])
        end

        # Filter by company if provided
        if params[:company_id]
          applications = applications.where(company_id: params[:company_id])
        end

        # Filter by month/year if provided
        if params[:month] && params[:year]
          applications = applications.where(
            "EXTRACT(MONTH FROM applications.created_at) = ? AND EXTRACT(YEAR FROM applications.created_at) = ?",
            params[:month],
            params[:year]
          )
        elsif params[:month]
          applications = applications.where("EXTRACT(MONTH FROM applications.created_at) = ?", params[:month])
        elsif params[:year]
          applications = applications.where("EXTRACT(YEAR FROM applications.created_at) = ?", params[:year])
        end

        applications_data = applications.includes(:company).map do |app|
          {
            id: app.id,
            position: app.position,
            status: app.status,
            company: app.company.name,
            company_id: app.company_id,
            applied_date: app.applied_date,
            notes: app.notes,
            created_at: app.created_at
          }
        end

        {
          success: true,
          count: applications_data.length,
          applications: applications_data
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
