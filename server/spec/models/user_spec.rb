require 'rails_helper'

RSpec.describe User, type: :model do
  describe 'validations' do
    it { should validate_presence_of(:email) }
    it { should validate_uniqueness_of(:email) }
    it { should validate_uniqueness_of(:phone_number).allow_nil }
  end

  describe 'roles' do
    let(:user) { create(:user) }

    it 'sets default role to ["user"]' do
      expect(user.roles).to eq(['user'])
    end

    it 'can have multiple roles' do
      user.add_role('admin')
      user.add_role('manager')
      expect(user.roles).to contain_exactly('user', 'admin', 'manager')
    end

    it 'validates roles are from allowed list' do
      user.roles = ['invalid_role']
      expect(user).not_to be_valid
      expect(user.errors[:roles]).to include(/contains invalid roles/)
    end

    it 'prevents duplicate roles' do
      user.add_role('admin')
      user.add_role('admin')
      expect(user.roles.count('admin')).to eq(1)
    end

    describe '#has_role?' do
      before { user.add_role('admin') }

      it 'returns true for assigned roles' do
        expect(user.has_role?('admin')).to be true
      end

      it 'returns false for unassigned roles' do
        expect(user.has_role?('manager')).to be false
      end
    end

    describe '#remove_role' do
      before { user.add_role('admin') }

      it 'removes the specified role' do
        user.remove_role('admin')
        expect(user.has_role?('admin')).to be false
      end
    end
  end

  describe 'secure password' do
    it { should have_secure_password }
  end

  describe 'phone number format' do
    let(:user) { build(:user) }

    it 'validates valid phone numbers' do
      valid_numbers = ['+1234567890', '1234567890', '+441234567890']
      valid_numbers.each do |number|
        user.phone_number = number
        expect(user).to be_valid
      end
    end

    it 'invalidates incorrect phone numbers' do
      invalid_numbers = ['123', 'abc1234567', '+abc1234567']
      invalid_numbers.each do |number|
        user.phone_number = number
        expect(user).not_to be_valid
      end
    end
  end
end
