from app import db
from datetime import datetime
import json

class Project(db.Model):
    __tablename__ = 'projects'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    category = db.Column(db.String(50), nullable=False)
    status = db.Column(db.String(20), default='ongoing')
    location = db.Column(db.String(200))
    budget = db.Column(db.Float, default=0)
    client_name = db.Column(db.String(100))
    description = db.Column(db.Text)
    featured = db.Column(db.Boolean, default=False)
    start_date = db.Column(db.String(20))
    end_date = db.Column(db.String(20))
    images = db.Column(db.Text, default='[]')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        try:
            images_list = json.loads(self.images) if self.images else []
        except:
            images_list = []
        return {
            'id': self.id,
            'title': self.title,
            'category': self.category,
            'status': self.status,
            'location': self.location,
            'budget': self.budget,
            'client_name': self.client_name,
            'description': self.description,
            'featured': self.featured,
            'start_date': self.start_date,
            'end_date': self.end_date,
            'images': images_list,
            'image_url': images_list[0] if images_list else '',
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Product(db.Model):
    __tablename__ = 'products'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    category = db.Column(db.String(50), nullable=False)
    description = db.Column(db.Text)
    price = db.Column(db.Float, default=0)
    stock = db.Column(db.Integer, default=0)
    unit = db.Column(db.String(20), default='piece')
    featured = db.Column(db.Boolean, default=False)
    is_active = db.Column(db.Boolean, default=True)
    images = db.Column(db.Text, default='[]')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        try:
            images_list = json.loads(self.images) if self.images else []
        except:
            images_list = []
        return {
            'id': self.id,
            'name': self.name,
            'category': self.category,
            'description': self.description,
            'price': self.price,
            'stock': self.stock,
            'unit': self.unit,
            'featured': self.featured,
            'is_active': self.is_active,
            'images': images_list,
            'image_url': images_list[0] if images_list else '',
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Order(db.Model):
    __tablename__ = 'orders'
    
    id = db.Column(db.Integer, primary_key=True)
    customer_name = db.Column(db.String(100), nullable=False)
    customer_email = db.Column(db.String(100))
    customer_phone = db.Column(db.String(20))
    customer_address = db.Column(db.Text)
    items = db.Column(db.Text, default='[]')
    total_amount = db.Column(db.Float, default=0)
    status = db.Column(db.String(20), default='pending')
    payment_status = db.Column(db.String(20), default='pending')
    mpesa_receipt_number = db.Column(db.String(50))
    mpesa_checkout_request_id = db.Column(db.String(100))
    mpesa_transaction_date = db.Column(db.DateTime)
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        try:
            items_list = json.loads(self.items) if self.items else []
        except:
            items_list = []
        return {
            'id': self.id,
            'customer_name': self.customer_name,
            'customer_email': self.customer_email,
            'customer_phone': self.customer_phone,
            'customer_address': self.customer_address,
            'items': items_list,
            'total_amount': self.total_amount,
            'status': self.status,
            'payment_status': self.payment_status,
            'mpesa_receipt_number': self.mpesa_receipt_number,
            'mpesa_checkout_request_id': self.mpesa_checkout_request_id,
            'mpesa_transaction_date': self.mpesa_transaction_date.isoformat() if self.mpesa_transaction_date else None,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Message(db.Model):
    __tablename__ = 'messages'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(20))
    subject = db.Column(db.String(200))
    message = db.Column(db.Text, nullable=False)
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'phone': self.phone,
            'subject': self.subject,
            'message': self.message,
            'is_read': self.is_read,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    full_name = db.Column(db.String(100))
    role = db.Column(db.String(20), default='admin')
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'full_name': self.full_name,
            'role': self.role,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }