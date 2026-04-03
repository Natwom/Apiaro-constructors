from flask import Blueprint, request, jsonify, make_response
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import Message
from app import db
import threading

messages_bp = Blueprint('messages', __name__)

def cors_response(data, status=200):
    response = make_response(jsonify(data), status)
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

def send_email_notification(message_data):
    """Background task to send email notification"""
    try:
        from app.utils.email_service import send_contact_email
        send_contact_email(message_data)
    except Exception as e:
        print(f"Email notification failed: {e}")

@messages_bp.route('/messages', methods=['GET', 'OPTIONS'])
@jwt_required()
def get_messages():
    # Handle preflight
    if request.method == 'OPTIONS':
        response = make_response()
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,OPTIONS')
        return response
    
    try:
        is_read = request.args.get('is_read')
        query = Message.query
        
        if is_read is not None:
            query = query.filter_by(is_read=is_read == 'true')
        
        messages = query.order_by(Message.created_at.desc()).all()
        
        return cors_response({
            'success': True,
            'count': len(messages),
            'messages': [m.to_dict() for m in messages]
        }, 200)
    except Exception as e:
        return cors_response({'success': False, 'message': str(e)}, 500)

@messages_bp.route('/messages/<int:id>', methods=['GET', 'OPTIONS'])
@jwt_required()
def get_message(id):
    if request.method == 'OPTIONS':
        response = make_response()
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response
    
    try:
        message = Message.query.get_or_404(id)
        return cors_response({
            'success': True,
            'message': message.to_dict()
        }, 200)
    except Exception as e:
        return cors_response({'success': False, 'message': str(e)}, 404)

@messages_bp.route('/messages', methods=['POST', 'OPTIONS'])
def create_message():
    if request.method == 'OPTIONS':
        response = make_response()
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response
    
    try:
        data = request.get_json()
        
        if not data or not data.get('name') or not data.get('email') or not data.get('message'):
            return cors_response({'success': False, 'message': 'Name, email, and message are required'}, 400)
        
        message = Message(
            name=data.get('name'),
            email=data.get('email'),
            phone=data.get('phone'),
            subject=data.get('subject'),
            message=data.get('message')
        )
        
        db.session.add(message)
        db.session.commit()
        
        # Send email notification in background
        email_thread = threading.Thread(
            target=send_email_notification,
            args=(message.to_dict(),)
        )
        email_thread.start()
        
        return cors_response({
            'success': True,
            'message': 'Message sent successfully. We will contact you soon!'
        }, 201)
    except Exception as e:
        return cors_response({'success': False, 'message': str(e)}, 500)

@messages_bp.route('/messages/<int:id>/read', methods=['PUT', 'OPTIONS'])
@jwt_required()
def mark_as_read(id):
    if request.method == 'OPTIONS':
        response = make_response()
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response
    
    try:
        message = Message.query.get_or_404(id)
        message.is_read = True
        db.session.commit()
        
        return cors_response({
            'success': True,
            'message': 'Message marked as read'
        }, 200)
    except Exception as e:
        return cors_response({'success': False, 'message': str(e)}, 500)

@messages_bp.route('/messages/<int:id>', methods=['DELETE', 'OPTIONS'])
@jwt_required()
def delete_message(id):
    if request.method == 'OPTIONS':
        response = make_response()
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response
    
    try:
        message = Message.query.get_or_404(id)
        db.session.delete(message)
        db.session.commit()
        
        return cors_response({
            'success': True,
            'message': 'Message deleted successfully'
        }, 200)
    except Exception as e:
        return cors_response({'success': False, 'message': str(e)}, 500)