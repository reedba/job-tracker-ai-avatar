class ContactsController < ApplicationController
  include Authenticatable
  before_action :authenticate_request
  before_action :set_company, only: [:index, :create, :show, :update, :destroy]
  before_action :set_contact, only: [:show, :update, :destroy, :add_contact_date]

  def index
    if params[:company_id]
      # Nested route: /companies/:company_id/contacts
      @contacts = @company.contacts.includes(:company)
    else
      # Top-level route: /contacts - get all contacts from user's companies
      user_companies = current_user.companies.pluck(:id)
      @contacts = Contact.includes(:company).where(company_id: user_companies)
    end

    contacts_data = @contacts.map do |contact|
      {
        id: contact.id,
        first_name: contact.first_name,
        last_name: contact.last_name,
        email: contact.email,
        phone: contact.phone,
        title: contact.title,
        linkedin_url: contact.linkedin_url,
        company: {
          id: contact.company.id,
          name: contact.company.name
        }
      }
    end

    render json: { contacts: contacts_data }
  end

  def show
    render json: @contact
  end

  def create
    # Support both nested and top-level routes
    company = if params[:company_id]
      @company
    else
      current_user.companies.find(contact_params[:company_id])
    end

    @contact = company.contacts.build(contact_params)
    
    if @contact.save
      render json: {
        contact: {
          id: @contact.id,
          first_name: @contact.first_name,
          last_name: @contact.last_name,
          email: @contact.email,
          phone: @contact.phone,
          title: @contact.title,
          linkedin_url: @contact.linkedin_url,
          company: {
            id: company.id,
            name: company.name
          }
        }
      }, status: :created
    else
      Rails.logger.error("Contact validation failed: #{@contact.errors.full_messages}")
      render json: { errors: @contact.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    if @contact.update(contact_params)
      render json: {
        contact: {
          id: @contact.id,
          first_name: @contact.first_name,
          last_name: @contact.last_name,
          email: @contact.email,
          phone: @contact.phone,
          title: @contact.title,
          linkedin_url: @contact.linkedin_url,
          company: {
            id: @contact.company.id,
            name: @contact.company.name
          }
        }
      }
    else
      render json: { errors: @contact.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    @contact.destroy
    head :no_content
  end

  # Custom action to add a new contact date
  def add_contact_date
    date = Date.parse(params[:date])
    @contact.dates_contacted = (@contact.dates_contacted || []) + [date]
    
    if @contact.save
      render json: @contact
    else
      render json: { errors: @contact.errors.full_messages }, status: :unprocessable_entity
    end
  end

  private

  def set_company
    if params[:company_id]
      @company = current_user.companies.find(params[:company_id])
    end
  end

  def set_contact
    if @company
      @contact = @company.contacts.find(params[:id])
    else
      # Top-level route - find contact from any of user's companies
      user_companies = current_user.companies.pluck(:id)
      @contact = Contact.where(company_id: user_companies).find(params[:id])
    end
  end

  def contact_params
    params.require(:contact).permit(
      :first_name,
      :last_name,
      :email,
      :phone,
      :title,
      :company_id,
      :linkedin_url,
      :notes,
      dates_contacted: []
    )
  end
end
