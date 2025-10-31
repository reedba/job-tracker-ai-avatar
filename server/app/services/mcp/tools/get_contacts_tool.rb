# frozen_string_literal: true

module Mcp
  module Tools
    class GetContactsTool
      def initialize(user:)
        @user = user
      end

      def name
        "get_contacts"
      end

      def description
        "Get all contacts for the user. Optional parameters: company_id, role"
      end

      def parameters
        {
          type: "object",
          properties: {
            company_id: {
              type: "integer",
              description: "Filter by specific company ID"
            },
            role: {
              type: "string",
              description: "Filter by contact role (e.g., recruiter, hiring manager)"
            }
          }
        }
      end

      def execute(params = {})
        company_ids = Company.where(user_id: @user.id).pluck(:id)
        contacts = Contact.joins(:company).where(companies: { user_id: @user.id })

        # Filter by company if provided
        if params[:company_id]
          contacts = contacts.where(company_id: params[:company_id])
        end

        # Filter by role if provided
        if params[:role]
          contacts = contacts.where("LOWER(role) LIKE ?", "%#{params[:role].downcase}%")
        end

        contacts_data = contacts.includes(:company).map do |contact|
          {
            id: contact.id,
            name: contact.name,
            email: contact.email,
            phone: contact.phone,
            role: contact.role,
            company: contact.company.name,
            company_id: contact.company_id,
            notes: contact.notes,
            created_at: contact.created_at
          }
        end

        {
          success: true,
          count: contacts_data.length,
          contacts: contacts_data
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
