module JsonWebToken
  SECRET_KEY = Rails.application.credentials.secret_key_base
  ALGORITHM = 'HS256'
  EXPIRY_TIME = 24.hours.to_i

  class << self
    def encode(payload)
      payload[:exp] = Time.now.to_i + EXPIRY_TIME
      JWT.encode(payload, SECRET_KEY, ALGORITHM)
    end

    def decode(token)
      decoded = JWT.decode(token, SECRET_KEY, true, { algorithm: ALGORITHM })[0]
      HashWithIndifferentAccess.new(decoded)
    rescue JWT::ExpiredSignature
      raise "Token has expired"
    rescue JWT::DecodeError
      raise "Invalid token"
    end
  end
end
