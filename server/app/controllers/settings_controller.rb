class SettingsController < ApplicationController
  include Authenticatable
  before_action :authenticate_request
  before_action :set_or_create_setting

  def show
    render json: { setting: @setting }
  end

  def update
    if @setting.update(setting_params)
      render json: { setting: @setting }
    else
      render json: { errors: @setting.errors.full_messages }, status: :unprocessable_entity
    end
  end

  private

  def set_or_create_setting
    @setting = current_user.setting || current_user.create_setting
  end

  def setting_params
    params.require(:setting).permit(:application_monthly_goal)
  end
end
