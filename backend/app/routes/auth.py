from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from app.models import User
from app import db

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        
        print(f'🔐 Login attempt: {username}')
        
        # Simple admin auth (replace with database check in production)
        if username == 'admin' and password == 'admin123':
            access_token = create_access_token(identity=username)
            print(f'✅ Token created: {access_token[:30]}...')
            
            return jsonify({
                'success': True,
                'access_token': access_token,
                'user': {
                    'username': username,
                    'full_name': 'Administrator',
                    'role': 'admin'
                }
            }), 200
        
        print('❌ Invalid credentials')
        return jsonify({
            'success': False,
            'message': 'Invalid username or password'
        }), 401
        
    except Exception as e:
        print(f'❌ Login error: {str(e)}')
        return jsonify({
            'success': False,
            'message': f'Server error: {str(e)}'
        }), 500

@auth_bp.route('/verify', methods=['GET'])
@jwt_required()
def verify():
    current_user = get_jwt_identity()
    return jsonify({
        'success': True,
        'user': current_user
    }), 200