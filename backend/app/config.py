import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'apiaro-fixed-secret-key-2024'
    
    # CRITICAL: Fixed JWT secret - must be constant across restarts
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'apiaro-jwt-secret-key-2024-never-change'
    JWT_ACCESS_TOKEN_EXPIRES = False  # Tokens never expire (for testing)
    JWT_TOKEN_LOCATION = ['headers']
    JWT_HEADER_NAME = 'Authorization'
    JWT_HEADER_TYPE = 'Bearer'
    
    # CRITICAL: Ensure database path is absolute and correct
    basedir = os.path.abspath(os.path.dirname(__file__))
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or \
        'sqlite:///' + os.path.join(basedir, '..', 'apiaro.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    UPLOAD_FOLDER = 'uploads'
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size
    
    # M-PESA DARAJA API CONFIGURATION
    # Environment: 'sandbox' for testing, 'production' for live
    MPESA_ENVIRONMENT = os.environ.get('MPESA_ENVIRONMENT', 'sandbox')
    
    # Sandbox Credentials (Default - for testing)
    MPESA_CONSUMER_KEY = os.environ.get('MPESA_CONSUMER_KEY', 'tWV9HDO1b1tP7TUwgaXdZ4At6EDGflnzwuNcu1UDDKz9okLz')
    MPESA_CONSUMER_SECRET = os.environ.get('MPESA_CONSUMER_SECRET', 'GubkZYAZ03MzRlDVmywTDHDK4xnYPSekJHD0varFOqzdvXmPZO9TUNCFlqZXQeU8')
    MPESA_PASSKEY = os.environ.get('MPESA_PASSKEY', 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919')
    MPESA_SHORTCODE = os.environ.get('MPESA_SHORTCODE', '174379')
    
    # Callback URL - Set via environment or use localhost fallback
    # For production: https://yourdomain.com/api/mpesa/callback
    # For ngrok testing: https://your-ngrok-url.ngrok-free.app/api/mpesa/callback
    MPESA_CALLBACK_URL = os.environ.get('MPESA_CALLBACK_URL', 'http://localhost:5000/api/mpesa/callback')

class DevelopmentConfig(Config):
    DEBUG = True

class ProductionConfig(Config):
    DEBUG = False

class TestingConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'

config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}