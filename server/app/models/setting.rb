class Setting < ApplicationRecord
  belongs_to :user
  
  validates :user_id, presence: true, uniqueness: true
  validates :application_monthly_goal, numericality: { only_integer: true, greater_than_or_equal_to: 0 }, allow_nil: true
end
