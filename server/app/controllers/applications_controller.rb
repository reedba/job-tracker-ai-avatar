class ApplicationsController < ApplicationController
  include Authenticatable
  before_action :authenticate_request
  before_action :set_company, only: [:create]
  before_action :set_application, only: [:show, :update, :destroy]

  def index
    begin
      if params[:company_id]
        # Nested route: /companies/:company_id/applications
        set_company
        @applications = @company.applications.includes(:company)
      else
        # Top-level route: /applications
        user_companies = current_user.companies.pluck(:id)
        @applications = Application
          .includes(:company)
          .where(company_id: user_companies)
      end

      applications_data = @applications.map do |app|
        {
          id: app.id,
          title: app.title,
          employment_type: app.employment_type&.titleize,
          work_mode: app.work_mode&.titleize,
          date_submitted: app.date_submitted&.in_time_zone('Eastern Time (US & Canada)')&.iso8601,
          job_level: app.job_level,
          job_posting_url: app.job_posting_url,
          job_external_id: app.job_external_id,
          company: {
            id: app.company.id,
            name: app.company.name,
            webpage: app.company.webpage
          }
        }
      end

      render json: { applications: applications_data }
    rescue StandardError => e
      Rails.logger.error "Error in applications#index: #{e.message}"
      Rails.logger.error e.backtrace.join("\n")
      render json: { 
        error: "Failed to fetch applications: #{e.message}",
        details: e.backtrace.first(5)
      }, status: :internal_server_error
    end
  end

  def show
    render json: @application, serializer: ApplicationSerializer
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
    company = @application.company
    if @application.destroy
      # Return updated company data for UI updates
      render json: {
        message: 'Application successfully deleted',
        company: CompanySerializer.new(company.reload)
      }
    else
      render json: {
        error: 'Failed to delete application',
        errors: @application.errors.full_messages
      }, status: :unprocessable_entity
    end
  rescue => e
    Rails.logger.error "Error deleting application: #{e.message}"
    render json: {
      error: 'Failed to delete application',
      message: e.message
    }, status: :internal_server_error
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