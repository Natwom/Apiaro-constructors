from flask import Blueprint, request, jsonify, make_response, current_app
from flask_jwt_extended import jwt_required
from app.models import Order, Product
from app import db
import json
import requests
import base64
import random
import string
from datetime import datetime
from requests.auth import HTTPBasicAuth

orders_bp = Blueprint('orders', __name__)

def cors_response(data, status=200):
    response = make_response(jsonify(data), status)
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

def normalize_phone(phone):
    """Normalize phone number to 254XXXXXXXXX format for consistent comparison"""
    if not phone:
        return ''
    phone = str(phone).strip().replace('+', '').replace(' ', '').replace('-', '')
    if phone.startswith('0'):
        phone = '254' + phone[1:]
    elif not phone.startswith('254'):
        phone = '254' + phone
    return phone

def get_product_image_url(product):
    """Extract the first image URL from a product"""
    try:
        images = json.loads(product.images) if product.images else []
    except:
        images = []
    
    if images and len(images) > 0:
        image = images[0]
        # Return full URL if relative path
        if image.startswith('http'):
            return image
        elif image.startswith('/'):
            return image
        else:
            return f'/uploads/products/{image}'
    return ''

def get_mpesa_access_token():
    """Get M-Pesa OAuth access token"""
    config = current_app.config
    
    is_sandbox = config.get('MPESA_ENVIRONMENT', 'sandbox') == 'sandbox'
    base_url = 'https://sandbox.safaricom.co.ke' if is_sandbox else 'https://api.safaricom.co.ke'
    
    consumer_key = config.get('MPESA_CONSUMER_KEY')
    consumer_secret = config.get('MPESA_CONSUMER_SECRET')
    
    if not consumer_key or not consumer_secret:
        return None
    
    try:
        response = requests.get(
            f"{base_url}/oauth/v1/generate?grant_type=client_credentials",
            auth=(consumer_key, consumer_secret),
            timeout=30
        )
        
        if response.status_code == 200:
            return response.json().get('access_token')
        return None
            
    except Exception as e:
        print(f"Token error: {str(e)}")
        return None

def initiate_stk_push(phone_number, amount, order_id, access_token):
    """Initiate M-Pesa STK Push - SANDBOX WORKAROUND"""
    config = current_app.config
    
    is_sandbox = config.get('MPESA_ENVIRONMENT', 'sandbox') == 'sandbox'
    
    if is_sandbox:
        print(f"SANDBOX MODE: Simulating STK push for order {order_id}")
        checkout_id = 'ws_' + ''.join(random.choices(string.ascii_lowercase + string.digits, k=15))
        return {
            "MerchantRequestID": ''.join(random.choices(string.ascii_uppercase + string.digits, k=10)),
            "CheckoutRequestID": checkout_id,
            "ResponseCode": "0",
            "ResponseDescription": "Success. Request accepted for processing",
            "CustomerMessage": "Success. Request accepted for processing"
        }
    
    base_url = 'https://api.safaricom.co.ke'
    
    phone = normalize_phone(phone_number)
    
    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
    shortcode = str(config.get('MPESA_SHORTCODE', ''))
    passkey = config.get('MPESA_PASSKEY', '')
    password_str = f"{shortcode}{passkey}{timestamp}"
    password = base64.b64encode(password_str.encode()).decode()
    
    callback_url = config.get('MPESA_CALLBACK_URL', '')
    
    payload = {
        "BusinessShortCode": shortcode,
        "Password": password,
        "Timestamp": timestamp,
        "TransactionType": "CustomerPayBillOnline",
        "Amount": str(int(amount)),
        "PartyA": phone,
        "PartyB": shortcode,
        "PhoneNumber": phone,
        "CallBackURL": callback_url,
        "AccountReference": f"ORDER{order_id}",
        "TransactionDesc": f"Payment for Order #{order_id}"
    }
    
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.post(
            f"{base_url}/mpesa/stkpush/v1/processrequest",
            json=payload,
            headers=headers,
            timeout=30
        )
        return response.json()
    except Exception as e:
        return {"error": str(e)}

@orders_bp.route('/orders', methods=['GET', 'OPTIONS'])
@jwt_required()
def get_orders():
    if request.method == 'OPTIONS':
        response = make_response()
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,OPTIONS')
        return response
    
    try:
        status = request.args.get('status')
        query = Order.query
        
        if status:
            query = query.filter_by(status=status)
        
        orders = query.order_by(Order.created_at.desc()).all()
        
        return cors_response({
            'success': True,
            'count': len(orders),
            'orders': [o.to_dict() for o in orders]
        }, 200)
    except Exception as e:
        return cors_response({'success': False, 'message': str(e)}, 500)

@orders_bp.route('/orders/<int:id>', methods=['GET', 'OPTIONS'])
@jwt_required()
def get_order(id):
    if request.method == 'OPTIONS':
        response = make_response()
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response
    
    try:
        order = Order.query.get_or_404(id)
        return cors_response({
            'success': True,
            'order': order.to_dict()
        }, 200)
    except Exception as e:
        return cors_response({'success': False, 'message': str(e)}, 404)

@orders_bp.route('/orders/track', methods=['GET', 'OPTIONS'])
def track_order():
    """Public endpoint for customers to track their orders"""
    if request.method == 'OPTIONS':
        response = make_response()
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,OPTIONS')
        return response
    
    try:
        order_id = request.args.get('order_id', type=int)
        email = request.args.get('email', '').strip().lower()
        phone = request.args.get('phone', '').strip()
        
        if not order_id and not email and not phone:
            return cors_response({
                'success': False,
                'message': 'Please provide Order ID, Email, or Phone number'
            }, 400)
        
        if order_id:
            order = Order.query.get(order_id)
            if not order:
                return cors_response({
                    'success': False,
                    'message': 'Order not found'
                }, 404)
            
            if email:
                if not order.customer_email or order.customer_email.lower() != email:
                    return cors_response({
                        'success': False,
                        'message': 'Details do not match our records'
                    }, 403)
            
            if phone:
                normalized_input = normalize_phone(phone)
                normalized_stored = normalize_phone(order.customer_phone)
                if normalized_input != normalized_stored:
                    return cors_response({
                        'success': False,
                        'message': 'Details do not match our records'
                    }, 403)
            
            return cors_response({
                'success': True,
                'order': order.to_dict()
            }, 200)
        
        query = Order.query
        if email:
            query = query.filter(db.func.lower(Order.customer_email) == email)
        if phone:
            normalized_phone = normalize_phone(phone)
            query = query.filter(
                db.or_(
                    Order.customer_phone == normalized_phone,
                    Order.customer_phone == phone,
                    Order.customer_phone.like(f'%{normalized_phone[3:]}')
                )
            )
        
        orders = query.order_by(Order.created_at.desc()).all()
        
        return cors_response({
            'success': True,
            'count': len(orders),
            'orders': [o.to_dict() for o in orders]
        }, 200)
        
    except Exception as e:
        import traceback
        print(f"ERROR in track_order: {str(e)}")
        print(traceback.format_exc())
        return cors_response({'success': False, 'message': str(e)}, 500)

@orders_bp.route('/orders', methods=['POST', 'OPTIONS'])
def create_order():
    if request.method == 'OPTIONS':
        response = make_response()
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response
    
    try:
        data = request.get_json()
        
        if not data or not data.get('items') or not data.get('customer_name') or not data.get('customer_phone'):
            return cors_response({
                'success': False, 
                'message': 'Order items, customer name, and phone number are required'
            }, 400)
        
        items = data.get('items')
        phone_number = data.get('customer_phone')
        
        normalized_phone = normalize_phone(phone_number)
        
        total_amount = 0
        validated_items = []
        
        for item in items:
            product_id = item.get('product_id') or item.get('id')
            quantity = item.get('quantity', 0)
            
            if not product_id or quantity <= 0:
                continue
                
            product = Product.query.get(product_id)
            if not product:
                return cors_response({
                    'success': False, 
                    'message': f'Product {product_id} not found'
                }, 404)
            
            if product.stock < quantity:
                return cors_response({
                    'success': False, 
                    'message': f'Insufficient stock for {product.name}. Available: {product.stock}'
                }, 400)
            
            # Get product image URL
            product_image = get_product_image_url(product)
            
            validated_items.append({
                'product_id': product.id,
                'product_name': product.name,
                'quantity': quantity,
                'unit_price': str(product.price),
                'price': float(product.price) * quantity,
                'product_image': product_image  # <-- IMAGE SAVED WITH ORDER
            })
            total_amount += float(product.price) * quantity
        
        if total_amount <= 0:
            return cors_response({
                'success': False, 
                'message': 'Order total must be greater than 0'
            }, 400)
        
        order = Order(
            customer_name=data.get('customer_name').strip(),
            customer_email=data.get('customer_email', '').strip(),
            customer_phone=normalized_phone,
            customer_address=data.get('customer_address', '').strip(),
            items=json.dumps(validated_items),
            total_amount=total_amount,
            status='pending',
            payment_status='pending',
            notes=data.get('notes', '')
        )
        
        db.session.add(order)
        db.session.flush()
        
        access_token = get_mpesa_access_token()
        
        if not access_token:
            db.session.rollback()
            return cors_response({
                'success': False,
                'message': 'Unable to connect to payment service. Please try again.'
            }, 503)
        
        stk_response = initiate_stk_push(phone_number, total_amount, order.id, access_token)
        
        response_code = stk_response.get('ResponseCode')
        
        if response_code == '0' or response_code == 0:
            order.payment_status = 'initiated'
            order.mpesa_checkout_request_id = stk_response.get('CheckoutRequestID')
            
            for item in validated_items:
                product = Product.query.get(item['product_id'])
                product.stock -= item['quantity']
            
            db.session.commit()
            
            return cors_response({
                'success': True,
                'message': 'Payment request sent to your phone. Please enter M-Pesa PIN to complete payment.',
                'order': order.to_dict(),
                'checkout_request_id': stk_response.get('CheckoutRequestID'),
                'customer_message': stk_response.get('CustomerMessage', 'Check your phone for STK push')
            }, 201)
        else:
            db.session.rollback()
            error_message = stk_response.get('errorMessage') or stk_response.get('ResponseDescription') or 'Payment initiation failed'
            return cors_response({
                'success': False,
                'message': f'Payment failed: {error_message}'
            }, 400)
            
    except Exception as e:
        db.session.rollback()
        import traceback
        print(f"ERROR in create_order: {str(e)}")
        print(traceback.format_exc())
        return cors_response({'success': False, 'message': str(e)}, 500)

@orders_bp.route('/orders/<int:id>/status', methods=['PUT', 'OPTIONS'])
@jwt_required()
def update_order_status(id):
    if request.method == 'OPTIONS':
        response = make_response()
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response
    
    try:
        data = request.get_json()
        order = Order.query.get_or_404(id)
        
        valid_statuses = ['pending', 'processing', 'completed', 'cancelled']
        new_status = data.get('status')
        
        if new_status not in valid_statuses:
            return cors_response({'success': False, 'message': 'Invalid status'}, 400)
        
        order.status = new_status
        db.session.commit()
        
        return cors_response({
            'success': True,
            'message': 'Order status updated',
            'order': order.to_dict()
        }, 200)
    except Exception as e:
        return cors_response({'success': False, 'message': str(e)}, 500)

@orders_bp.route('/orders/<int:id>', methods=['DELETE', 'OPTIONS'])
@jwt_required()
def delete_order(id):
    if request.method == 'OPTIONS':
        response = make_response()
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response
    
    try:
        order = Order.query.get_or_404(id)
        db.session.delete(order)
        db.session.commit()
        
        return cors_response({
            'success': True,
            'message': 'Order deleted successfully'
        }, 200)
    except Exception as e:
        return cors_response({'success': False, 'message': str(e)}, 500)

@orders_bp.route('/mpesa/callback', methods=['POST', 'OPTIONS'])
def mpesa_callback():
    if request.method == 'OPTIONS':
        response = make_response()
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response
    
    try:
        data = request.get_json()
        print(f"M-Pesa Callback received: {json.dumps(data, indent=2)}")
        
        config = current_app.config
        is_sandbox = config.get('MPESA_ENVIRONMENT', 'sandbox') == 'sandbox'
        
        if is_sandbox and not data.get('Body'):
            return cors_response({'success': True, 'message': 'Sandbox callback simulated'}, 200)
        
        stk_callback = data.get('Body', {}).get('stkCallback', {})
        result_code = stk_callback.get('ResultCode')
        checkout_request_id = stk_callback.get('CheckoutRequestID')
        
        order = Order.query.filter_by(mpesa_checkout_request_id=checkout_request_id).first()
        
        if not order:
            print(f"Order not found for checkout request: {checkout_request_id}")
            return cors_response({'success': True}, 200)
        
        if result_code == 0:
            callback_metadata = stk_callback.get('CallbackMetadata', {}).get('Item', [])
            receipt_number = None
            transaction_date = None
            
            for item in callback_metadata:
                if item.get('Name') == 'MpesaReceiptNumber':
                    receipt_number = item.get('Value')
                elif item.get('Name') == 'TransactionDate':
                    transaction_date = str(item.get('Value'))
            
            order.payment_status = 'completed'
            order.status = 'processing'
            order.mpesa_receipt_number = receipt_number
            
            if transaction_date:
                try:
                    order.mpesa_transaction_date = datetime.strptime(transaction_date, '%Y%m%d%H%M%S')
                except:
                    pass
            
            print(f"Payment successful for order {order.id}, receipt: {receipt_number}")
        else:
            order.payment_status = 'failed'
            order.status = 'payment_failed'
            result_desc = stk_callback.get('ResultDesc', 'Unknown error')
            print(f"Payment failed for order {order.id}: {result_desc}")
        
        db.session.commit()
        return cors_response({'success': True}, 200)
        
    except Exception as e:
        print(f"Error processing M-Pesa callback: {str(e)}")
        return cors_response({'success': True}, 200)

@orders_bp.route('/orders/<int:id>/payment-status', methods=['GET', 'OPTIONS'])
def check_payment_status(id):
    if request.method == 'OPTIONS':
        response = make_response()
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response
    
    try:
        order = Order.query.get_or_404(id)
        
        config = current_app.config
        is_sandbox = config.get('MPESA_ENVIRONMENT', 'sandbox') == 'sandbox'
        
        if is_sandbox and order.payment_status == 'initiated':
            time_diff = (datetime.utcnow() - order.created_at).total_seconds()
            if time_diff > 10:
                order.payment_status = 'completed'
                order.status = 'processing'
                order.mpesa_receipt_number = 'TEST' + ''.join(random.choices(string.digits, k=8))
                db.session.commit()
                print(f"SANDBOX: Auto-completed payment for order {order.id}")
        
        return cors_response({
            'success': True,
            'order_id': order.id,
            'payment_status': order.payment_status,
            'status': order.status,
            'mpesa_receipt_number': order.mpesa_receipt_number
        }, 200)
    except Exception as e:
        return cors_response({'success': False, 'message': str(e)}, 500)

@orders_bp.route('/orders/<int:id>/confirm-payment', methods=['POST', 'OPTIONS'])
@jwt_required()
def confirm_payment(id):
    if request.method == 'OPTIONS':
        response = make_response()
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response
    
    try:
        order = Order.query.get_or_404(id)
        
        order.payment_status = 'completed'
        order.status = 'processing'
        order.mpesa_receipt_number = 'MANUAL' + ''.join(random.choices(string.digits, k=6))
        
        db.session.commit()
        
        return cors_response({
            'success': True,
            'message': 'Payment confirmed manually',
            'order': order.to_dict()
        }, 200)
    except Exception as e:
        return cors_response({'success': False, 'message': str(e)}, 500)