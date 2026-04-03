from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import Product
from app import db
import os
import json
from werkzeug.utils import secure_filename

products_bp = Blueprint('products', __name__)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# PUBLIC - No auth required for viewing
@products_bp.route('/products', methods=['GET'])
def get_products():
    try:
        print('✅ GET /products - Public access')
        
        query = Product.query.filter_by(is_active=True)
        
        # Filter by category if provided
        category = request.args.get('category')
        if category:
            query = query.filter_by(category=category)
        
        # Filter by featured
        featured = request.args.get('featured')
        if featured:
            query = query.filter_by(featured=featured.lower() == 'true')
        
        products = query.order_by(Product.created_at.desc()).all()
        
        return jsonify({
            'success': True,
            'products': [p.to_dict() for p in products]
        }), 200
    except Exception as e:
        print(f'❌ Error in get_products: {str(e)}')
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'message': str(e)}), 500

# PUBLIC - No auth required for viewing single product
@products_bp.route('/products/<int:id>', methods=['GET'])
def get_product(id):
    try:
        print(f'✅ GET /products/{id} - Public access')
        
        product = Product.query.get_or_404(id)
        return jsonify({
            'success': True,
            'product': product.to_dict()
        }), 200
    except Exception as e:
        print(f'❌ Error in get_product: {str(e)}')
        return jsonify({'success': False, 'message': str(e)}), 500

# PROTECTED - Auth required for creating
@products_bp.route('/products', methods=['POST'])
@jwt_required()
def create_product():
    try:
        current_user = get_jwt_identity()
        print(f'✅ POST /products - User: {current_user}')
        
        # Handle form data
        name = request.form.get('name')
        category = request.form.get('category')
        description = request.form.get('description')
        price = request.form.get('price', 0)
        stock = request.form.get('stock', 0)
        unit = request.form.get('unit', 'piece')
        featured = request.form.get('featured', 'false').lower() == 'true'
        
        print(f'📋 Form data: name={name}, category={category}')
        
        # Handle images
        images = request.files.getlist('images')
        image_paths = []
        
        for image in images:
            if image and allowed_file(image.filename):
                filename = secure_filename(image.filename)
                upload_path = os.path.join(current_app.root_path, '..', 'uploads', 'products', filename)
                image.save(upload_path)
                image_paths.append(f'uploads/products/{filename}')
                print(f'📸 Saved image: {filename}')
        
        # Create product with JSON string for images
        product = Product(
            name=name,
            category=category,
            description=description,
            price=float(price) if price else 0,
            stock=int(stock) if stock else 0,
            unit=unit,
            featured=featured,
            images=json.dumps(image_paths) if image_paths else '[]'
        )
        
        db.session.add(product)
        db.session.commit()
        
        print(f'✅ Product created: {product.id}')
        
        return jsonify({
            'success': True,
            'message': 'Product created successfully',
            'product': product.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        print(f'❌ Error creating product: {str(e)}')
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'message': str(e)}), 500

# PROTECTED - Auth required for updating
@products_bp.route('/products/<int:id>', methods=['PUT'])
@jwt_required()
def update_product(id):
    try:
        current_user = get_jwt_identity()
        print(f'✅ PUT /products/{id} - User: {current_user}')
        
        product = Product.query.get_or_404(id)
        
        # Update fields
        product.name = request.form.get('name', product.name)
        product.category = request.form.get('category', product.category)
        product.description = request.form.get('description', product.description)
        product.price = request.form.get('price', product.price)
        product.stock = request.form.get('stock', product.stock)
        product.unit = request.form.get('unit', product.unit)
        product.featured = request.form.get('featured', str(product.featured)).lower() == 'true'
        product.is_active = request.form.get('is_active', str(product.is_active)).lower() == 'true'
        
        # Handle new images
        images = request.files.getlist('images')
        current_images = []
        if product.images:
            try:
                current_images = json.loads(product.images) if isinstance(product.images, str) else product.images
            except:
                current_images = []
        
        for image in images:
            if image and allowed_file(image.filename):
                filename = secure_filename(image.filename)
                upload_path = os.path.join(current_app.root_path, '..', 'uploads', 'products', filename)
                image.save(upload_path)
                current_images.append(f'uploads/products/{filename}')
        
        product.images = json.dumps(current_images) if current_images else '[]'
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Product updated successfully',
            'product': product.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f'❌ Error updating product: {str(e)}')
        return jsonify({'success': False, 'message': str(e)}), 500

# PROTECTED - Auth required for deleting
@products_bp.route('/products/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_product(id):
    try:
        current_user = get_jwt_identity()
        print(f'✅ DELETE /products/{id} - User: {current_user}')
        
        product = Product.query.get_or_404(id)
        product.is_active = False  # Soft delete
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Product deleted successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f'❌ Error deleting product: {str(e)}')