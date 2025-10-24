class ApplicationsController < ApplicationController
  include Authenticatable
  before_action :authenticate_request
  before_action :set_company, only: [:index, :create]
  before_action :set_application, only: [:show, :update, :destroy]

  def index
    @applications = @company.applications
    render json: @applications
  end

  def show
    render json: @application
  end

  def create
    @application = @company.applications.build(application_params)

    if @application.save
      # Return both the application and updated company data
      render json: {
        application: @application,
        company: CompanySerializer.new(@company.reload)
      }, status: :created
    else
      # Add more detailed error response
      error_messages = @application.errors.messages.transform_values(&:first)
      render json: { 
        message: 'Validation failed',
        errors: error_messages
      }, status: :unprocessable_entity
    end
  end

  def update
    if @application.update(application_params)
      render json: @application
    else
      render json: { errors: @application.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    @application.destroy
    head :no_content
  end

  private

  def set_company
    @company = current_user.companies.find(params[:company_id])
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'Company not found' }, status: :not_found
  end

  def set_application
    @application = current_user.companies.joins(:applications)
                              .find_by!(applications: { id: params[:id] })
                              .applications.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'Application not found' }, status: :not_found
  end

  def application_params
    params.require(:application).permit(
      :title,
      :job_level,
      :date_submitted,
      :employment_type,
      :work_mode,
      :job_posting_url,
      :job_external_id
    )
  end
end