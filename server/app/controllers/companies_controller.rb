class CompaniesController < ApplicationController
  include Authenticatable
  before_action :authenticate_request
  before_action :set_company, only: [:show, :update, :destroy]

  def index
    @companies = current_user.companies.includes(:applications)
    companies_data = ActiveModelSerializers::SerializableResource.new(
      @companies,
      each_serializer: CompanySerializer
    ).as_json
    
    # Debug logging
    Rails.logger.debug "Companies data: #{companies_data.inspect}"
    
    render json: companies_data
  end

  def show
    render json: @company
  end

  def create
    return render json: { error: 'User not authenticated' }, status: :unauthorized unless current_user

    @company = current_user.companies.build(company_params)

    if @company.save
      render json: @company, status: :created
    else
      render json: { errors: @company.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    if @company.update(company_params)
      render json: @company
    else
      render json: { errors: @company.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    @company.destroy
    head :no_content
  end

  private

  def set_company
    @company = current_user.companies.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'Company not found' }, status: :not_found
  end

  def company_params
    params.require(:company).permit(:name, :webpage, :favorited)
  end
end