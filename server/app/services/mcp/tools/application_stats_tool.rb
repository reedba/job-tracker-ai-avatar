# frozen_string_literal: true

module Mcp
  module Tools
    class ApplicationStatsTool
      attr_reader :user

      def initialize(user)
        @user = user
      end

      def description
        "Get statistics and trends about job applications, including status breakdown, timeline, and success rates"
      end

      def parameters
        {
          type: "object",
          properties: {
            time_period: {
              type: "string",
              enum: ["week", "month", "quarter", "year", "all"],
              description: "Time period for statistics (default: month)"
            },
            status: {
              type: "string",
              description: "Filter by specific status (Applied, Interview, Offer, Rejected)"
            },
            company_name: {
              type: "string",
              description: "Filter by company name"
            }
          }
        }
      end

      def execute(params = {})
        applications = Application.where(user: user).includes(:company)

        # Time period filter
        applications = filter_by_time_period(applications, params[:time_period])

        # Status filter
        if params[:status].present?
          applications = applications.where(status: params[:status])
        end

        # Company filter
        if params[:company_name].present?
          applications = applications.joins(:company)
                                   .where("companies.name ILIKE ?", "%#{params[:company_name]}%")
        end

        # Calculate statistics
        {
          total: applications.count,
          by_status: applications.group(:status).count,
          by_month: applications.group_by_month(:created_at).count,
          average_per_month: calculate_monthly_average(applications),
          top_companies: applications.joins(:company)
                                   .group("companies.name")
                                   .count
                                   .sort_by { |_, count| -count }
                                   .first(5)
                                   .to_h,
          recent_applications: applications.order(created_at: :desc).limit(10).map do |app|
            {
              company: app.company.name,
              title: app.job_title,
              status: app.status,
              applied_at: app.applied_at&.strftime("%Y-%m-%d"),
              days_ago: app.applied_at ? (Date.current - app.applied_at.to_date).to_i : nil
            }
          end,
          goal_progress: calculate_goal_progress
        }
      end

      private

      def filter_by_time_period(applications, period)
        case period
        when "week"
          applications.where("created_at >= ?", 1.week.ago)
        when "quarter"
          applications.where("created_at >= ?", 3.months.ago)
        when "year"
          applications.where("created_at >= ?", 1.year.ago)
        when "all"
          applications
        else # default to month
          applications.where("created_at >= ?", 1.month.ago)
        end
      end

      def calculate_monthly_average(applications)
        return 0 if applications.empty?
        
        first_app = applications.order(:created_at).first
        return applications.count if first_app.nil?
        
        months = ((Date.current - first_app.created_at.to_date) / 30).ceil
        months = 1 if months < 1
        
        (applications.count.to_f / months).round(2)
      end

      def calculate_goal_progress
        setting = user.setting
        return nil unless setting&.application_monthly_goal

        current_month_count = Application.where(user: user)
                                        .where("EXTRACT(MONTH FROM created_at) = ?", Date.current.month)
                                        .where("EXTRACT(YEAR FROM created_at) = ?", Date.current.year)
                                        .count

        {
          goal: setting.application_monthly_goal,
          current: current_month_count,
          percentage: ((current_month_count.to_f / setting.application_monthly_goal) * 100).round(1),
          remaining: [setting.application_monthly_goal - current_month_count, 0].max
        }
      end

      def group_by_month(applications)
        applications.group_by { |app| app.created_at.beginning_of_month }
                   .transform_keys { |date| date.strftime("%b %Y") }
                   .transform_values(&:count)
      end
    end
  end
end
