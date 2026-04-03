from flask import Flask, request, send_from_directory, make_response, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from app.config import config
import os

db = SQLAlchemy()
jwt = JWTManager()

def create_app(config_name='default'):
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    
    # Initialize extensions
    db.init_app(app)
    jwt.init_app(app)
    
    # CRITICAL: Enable CORS for ALL routes including uploads
    CORS(app, resources={
        r"/*": {  # Changed from /api/* to /* to cover all routes
            "origins": "*",
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD"],
            "allow_headers": ["Authorization", "Content-Type", "Accept", "Origin", "X-Requested-With"],
            "expose_headers": ["Content-Type", "Authorization"],
            "supports_credentials": False,  # Changed to False to avoid credential issues
            "send_wildcard": True
        }
    })
    
    # Global after_request handler to ensure CORS headers on ALL responses
    @app.after_request
    def after_request(response):
        # Add CORS headers to every response
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS, HEAD'
        response.headers['Access-Control-Allow-Headers'] = 'Authorization, Content-Type, Accept, Origin, X-Requested-With'
        response.headers['Access-Control-Expose-Headers'] = 'Content-Type, Authorization'
        
        # Handle preflight
        if request.method == 'OPTIONS':
            response.status_code = 200
            
        return response
    
    # DEBUG: Log all requests
    @app.before_request
    def log_request():
        if request.method != 'OPTIONS':
            print(f'📥 {request.method} {request.path}')
            if request.path.startswith('/uploads'):
                print(f'📸 Image request: {request.path}')
    
    # JWT error handlers
    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return {'success': False, 'message': 'Invalid token'}, 401

    @jwt.unauthorized_loader
    def unauthorized_callback(error):
        return {'success': False, 'message': 'Missing Authorization header'}, 401

    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return {'success': False, 'message': 'Token expired'}, 401
    
    # Register blueprints
    from app.routes.auth import auth_bp
    from app.routes.projects import projects_bp
    from app.routes.products import products_bp
    from app.routes.messages import messages_bp
    from app.routes.orders import orders_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api')
    app.register_blueprint(projects_bp, url_prefix='/api')
    app.register_blueprint(products_bp, url_prefix='/api')
    app.register_blueprint(messages_bp, url_prefix='/api')
    app.register_blueprint(orders_bp, url_prefix='/api')
    
    # Create upload directories
    upload_folder = os.path.join(app.root_path, '..', 'uploads')
    projects_folder = os.path.join(upload_folder, 'projects')
    products_folder = os.path.join(upload_folder, 'products')
    
    os.makedirs(projects_folder, exist_ok=True)
    os.makedirs(products_folder, exist_ok=True)
    
    print(f'📁 Upload folder: {upload_folder}')
    
    # CRITICAL: Serve uploaded files with explicit CORS headers
    @app.route('/uploads/<path:filename>')
    def serve_upload(filename):
        try:
            file_path = os.path.join(upload_folder, filename)
            if not os.path.exists(file_path):
                print(f'❌ File not found: {file_path}')
                return jsonify({'error': 'File not found'}), 404
                
            response = send_from_directory(upload_folder, filename)
            # Add CORS headers explicitly
            response.headers['Access-Control-Allow-Origin'] = '*'
            response.headers['Cache-Control'] = 'public, max-age=31536000'
            print(f'📸 Serving: {filename}')
            return response
        except Exception as e:
            print(f'❌ Error serving file: {e}')
            return jsonify({'error': str(e)}), 500
    
    @app.route('/uploads/projects/<path:filename>')
    def serve_project_upload(filename):
        try:
            response = send_from_directory(projects_folder, filename)
            response.headers['Access-Control-Allow-Origin'] = '*'
            response.headers['Cache-Control'] = 'public, max-age=31536000'
            return response
        except Exception as e:
            return jsonify({'error': str(e)}), 404
    
    @app.route('/uploads/products/<path:filename>')
    def serve_product_upload(filename):
        try:
            response = send_from_directory(products_folder, filename)
            response.headers['Access-Control-Allow-Origin'] = '*'
            response.headers['Cache-Control'] = 'public, max-age=31536000'
            return response
        except Exception as e:
            return jsonify({'error': str(e)}), 404
    
    # Create database tables
    with app.app_context():
        print('🔧 Creating database tables...')
        db.create_all()
        from sqlalchemy import inspect
        inspector = inspect(db.engine)
        tables = inspector.get_table_names()
        print(f'✅ Database tables: {tables}')
    
    return app