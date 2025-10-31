# frozen_string_literal: true

module Mcp
  module Tools
    class DatabaseQueryTool
      attr_reader :user

      def initialize(user)
        @user = user
      end

      def description
        "Execute specific queries on the job tracking database for custom insights and data retrieval"
      end

      def parameters
        {
          type: "object",
          properties: {
            query_type: {
              type: "string",
              enum: [
                "company_comparison",
                "application_timeline",
                "contact_list",
                "status_transitions",
                "response_rate"
              ],
              description: "Type of query to execute"
            },
            parameters: {
              type: "object",
              description: "Additional parameters for the specific query type"
            }
          },
          required: ["query_type"]
        }
      end

      def execute(params = {})
        query_type = params[:query_type]
        query_params = params[:parameters] || {}

        case query_type
        when "company_comparison"
          compare_companies(query_params)
        when "application_timeline"
          application_timeline(query_params)
        when "contact_list"
          contact_list(query_params)
        when "status_transitions"
          status_transitions(query_params)
        when "response_rate"
          response_rate(query_params)
        else
          { error: "Unknown query type: #{query_type}" }
        end
      end

      private

      def compare_companies(params)
        company_names = params[:companies] || []
        companies = Company.where(user: user)
                          .where("name ILIKE ANY (ARRAY[?])", company_names.map { |n| "%#{n}%" })
                          .includes(:applications, :contacts)

        companies.map do |company|
          {
            name: company.name,
            applications: company.applications.count,
            contacts: company.contacts.count,
            statuses: company.applications.group(:status).count,
            avg_response_time: calculate_response_time(company.applications)
          }
        end
      end

      def application_timeline(params)
        days = params[:days] || 30
        
        Application.where(user: user)
                  .where("created_at >= ?", days.days.ago)
                  .order(created_at: :asc)
                  .includes(:company)
                  .map do |app|
          {
            date: app.created_at.strftime("%Y-%m-%d"),
            company: app.company.name,
            title: app.job_title,
            status: app.status
          }
        end
      end

      def contact_list(params)
        contacts = Contact.where(user: user).includes(:company)

        if params[:company].present?
          contacts = contacts.joins(:company)
                           .where("companies.name ILIKE ?", "%#{params[:company]}%")
        end

        if params[:role].present?
          contacts = contacts.where("role ILIKE ?", "%#{params[:role]}%")
        end

        contacts.map do |contact|
          {
            name: contact.full_name,
            email: contact.email,
            phone: contact.phone,
            role: contact.role,
            company: contact.company.name,
            notes: contact.notes
          }
        end
      end

      def status_transitions(params)
        applications = Application.where(user: user)
                                 .order(:created_at)

        # Group by status changes
        transitions = {}
        applications.each do |app|
          # This is a simplified version - you might want to track actual status changes
          # in a separate table for more accurate transition tracking
          status = app.status
          transitions[status] ||= 0
          transitions[status] += 1
        end

        {
          total_applications: applications.count,
          transitions: transitions,
          current_distribution: applications.group(:status).count
        }
      end

      def response_rate(params)
        applications = Application.where(user: user)
        total = applications.count
        
        return { rate: 0, message: "No applications yet" } if total.zero?

        responded = applications.where.not(status: "Applied").count
        
        {
          total_applications: total,
          responses: responded,
          no_response: total - responded,
          response_rate: ((responded.to_f / total) * 100).round(1),
          avg_response_time_days: calculate_avg_response_time(applications)
        }
      end

      def calculate_response_time(applications)
        apps_with_response = applications.where.not(status: "Applied")
        return 0 if apps_with_response.empty?

        total_days = apps_with_response.sum do |app|
          next 0 unless app.applied_at && app.updated_at
          (app.updated_at.to_date - app.applied_at.to_date).to_i
        end

        (total_days.to_f / apps_with_response.count).round(1)
      end

      def calculate_avg_response_time(applications)
        calculate_response_time(applications)
      end
    end
  end
end
