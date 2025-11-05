module ApplicationCable
  class Connection < ActionCable::Connection::Base
    # Allow either an authenticated user or a guest session (identified by link id)
    identified_by :current_user, :current_guest_link_id

    def connect
      self.current_guest_link_id = nil
      self.current_user = find_verified_user_or_guest
    end

    private

    def find_verified_user_or_guest
      token = request.params[:token]
      if token.blank?
        reject_unauthorized_connection
      end

      begin
        decoded = JWT.decode(token, JsonWebToken::SECRET_KEY, true, algorithm: JsonWebToken::ALGORITHM)[0]

        # Guest session tokens have `session: true` and a link_id
        if decoded['session'] == true
          link_id = decoded['link_id']
          link = AvatarLink.find_by(id: link_id)
          if link && link.valid_for_connection?
            # Set guest identifier and allow connection (current_user remains nil)
            self.current_guest_link_id = link.id
            return nil
          else
            Rails.logger.info "Rejected guest connection: invalid or inactive link=#{link_id}"
            reject_unauthorized_connection
          end
        end

        # Otherwise treat as a normal user token
        user_id = decoded['user_id']
        if (verified_user = User.find_by(id: user_id))
          return verified_user
        else
          reject_unauthorized_connection
        end
      rescue JWT::ExpiredSignature => e
        Rails.logger.info "Expired token: #{e.message}"
        reject_unauthorized_connection
      rescue JWT::DecodeError, ActiveRecord::RecordNotFound => e
        Rails.logger.info "Invalid token/connect error: #{e.message}"
        reject_unauthorized_connection
      end
    end
  end
end
