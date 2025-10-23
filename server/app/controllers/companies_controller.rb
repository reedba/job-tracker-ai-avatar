class CompaniesController < ApplicationController
  include Authenticatable
  before_action :set_company, only: [:show, :update, :destroy]

  def index
    @companies = current_user.companies
    render json: @companies
  end

  def show
    render json: @company
  end

  def create
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