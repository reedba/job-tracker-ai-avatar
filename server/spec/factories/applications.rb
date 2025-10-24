FactoryBot.define do
  factory :application do
    title { "MyString" }
    job_level { "MyString" }
    date_submitted { "2025-10-23" }
    employment_type { "MyString" }
    work_mode { "MyString" }
    job_posting_url { "MyString" }
    job_external_id { "MyString" }
    company { nil }
  end
end
