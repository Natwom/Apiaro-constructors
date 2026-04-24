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
        r"/*": {
            "origins": "*",
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD"],
            "allow_headers": ["Authorization", "Content-Type", "Accept", "Origin", "X-Requested-With"],
            "expose_headers": ["Content-Type", "Authorization"],
            "supports_credentials": False,
            "send_wildcard": True
        }
    })
    
    # Global after_request handler to ensure CORS headers on ALL responses
    @app.after_request
    def after_request(response):
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS, HEAD'
        response.headers['Access-Control-Allow-Headers'] = 'Authorization, Content-Type, Accept, Origin, X-Requested-With'
        response.headers['Access-Control-Expose-Headers'] = 'Content-Type, Authorization'
        
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
    
    # ============================================
    # CRITICAL FIX: Add root API endpoint
    # ============================================
    @app.route('/api', methods=['GET'])
    def api_root():
        return jsonify({
            'success': True,
            'message': 'Apiaro Constructors API',
            'version': '1.0.0',
            'status': 'running',
            'endpoints': {
                'auth': '/api/login, /api/verify',
                'projects': '/api/projects',
                'products': '/api/products',
                'messages': '/api/messages',
                'orders': '/api/orders'
            }
        }), 200
    
    @app.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({
            'success': True,
            'status': 'healthy',
            'service': 'apiaro-backend'
        }), 200
    
    # ============================================
    # REGISTER BLUEPRINTS
    # ============================================
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
    
    # ============================================
    # SINGLE UPLOAD ROUTE HANDLER
    # ============================================
    @app.route('/uploads/<path:filename>')
    def serve_upload(filename):
        try:
            # Security: Prevent directory traversal
            safe_path = os.path.normpath(filename)
            if safe_path.startswith('..') or safe_path.startswith('/'):
                print(f'❌ Invalid path attempt: {filename}')
                return jsonify({'error': 'Invalid path'}), 400
            
            file_path = os.path.join(upload_folder, safe_path)
            
            if not os.path.exists(file_path):
                print(f'❌ File not found: {file_path}')
                return jsonify({'error': 'File not found', 'path': safe_path}), 404
                
            response = send_from_directory(upload_folder, safe_path)
            response.headers['Access-Control-Allow-Origin'] = '*'
            response.headers['Cache-Control'] = 'public, max-age=31536000'
            print(f'📸 Serving: {filename}')
            return response
            
        except Exception as e:
            print(f'❌ Error serving file: {e}')
            return jsonify({'error': str(e)}), 500
    
    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({
            'success': False,
            'error': 'Endpoint not found',
            'message': f'The requested URL {request.path} was not found on the server.',
            'available_endpoints': [
                '/api',
                '/api/health',
                '/api/login',
                '/api/verify',
                '/api/projects',
                '/api/products',
                '/api/messages',
                '/api/orders',
                '/uploads/<path>'
            ]
        }), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': 'Internal server error',
            'message': str(error)
        }), 500
    
    # Create database tables
    with app.app_context():
        print('🔧 Creating database tables...')
        db.create_all()
        from sqlalchemy import inspect
        inspector = inspect(db.engine)
        tables = inspector.get_table_names()
        print(f'✅ Database tables: {tables}')
    
    return app