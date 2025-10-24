class ContactsController < ApplicationController
  before_action :set_company
  before_action :set_contact, only: [:show, :update, :destroy, :add_contact_date]

  def index
    @contacts = @company.contacts
    render json: @contacts
  end

  def show
    render json: @contact
  end

  def create
    @contact = @company.contacts.build(contact_params)
    if @contact.save
      render json: @contact, status: :created
    else
      render json: { errors: @contact.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    if @contact.update(contact_params)
      render json: @contact
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
    @company = current_user.companies.find(params[:company_id])
  end

  def set_contact
    @contact = @company.contacts.find(params[:id])
  end

  def contact_params
    params.require(:contact).permit(
      :name,
      :role,
      :email,
      :phone,
      :linkedin_url,
      :notes,
      dates_contacted: []
    )
  end
end
