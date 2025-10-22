class JobsController < ApplicationController
  include Authenticatable
  
  # In case you want some actions to be public
  # skip_before_action :authenticate_request, only: [:index, :show]
  
  def index
    @jobs = Job.all
    Rails.logger.info("Jobs listed by user: #{current_user.email}")
    render json: {
      status: :success,
      jobs: @jobs
    }
  end

  def show
    @job = Job.find(params[:id])
    render json: {
      status: :success,
      job: @job
    }
  end

  def create
    @job = Job.new(job_params)
    @job.created_by = current_user.id  # Track who created the job
    
    if @job.save
      Rails.logger.info("Job created by user: #{current_user.email}")
      render json: {
        status: :created,
        job: @job,
        message: 'Job created successfully'
      }, status: :created
    else
      Rails.logger.error("Job creation failed: #{@job.errors.full_messages.join(', ')}")
      render json: {
        status: :unprocessable_entity,
        errors: @job.errors.full_messages,
        message: 'Failed to create job'
      }, status: :unprocessable_entity
    end
  end

  def update
    @job = Job.find(params[:id])
    
    if @job.update(job_params)
      Rails.logger.info("Job updated by user: #{current_user.email}")
      render json: {
        status: :success,
        job: @job,
        message: 'Job updated successfully'
      }
    else
      Rails.logger.error("Job update failed: #{@job.errors.full_messages.join(', ')}")
      render json: {
        status: :unprocessable_entity,
        errors: @job.errors.full_messages,
        message: 'Failed to update job'
      }, status: :unprocessable_entity
    end
  end

  def destroy
    @job = Job.find(params[:id])
    @job.destroy
    
    Rails.logger.info("Job deleted by user: #{current_user.email}")
    render json: {
      status: :success,
      message: 'Job deleted successfully'
    }
  end

  private

  def job_params
    params.require(:job).permit(:title, :description, :status, :due_date)
  end
end
