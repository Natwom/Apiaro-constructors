import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'apiaro-fixed-secret-key-2024'
    
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'apiaro-jwt-secret-key-2024-never-change'
    JWT_ACCESS_TOKEN_EXPIRES = False
    JWT_TOKEN_LOCATION = ['headers']
    JWT_HEADER_NAME = 'Authorization'
    JWT_HEADER_TYPE = 'Bearer'
    
    # ============================================
    # NEON: PostgreSQL from env (Render injects this)
    # Fallback to SQLite only for local dev without env var
    # ============================================
    basedir = os.path.abspath(os.path.dirname(__file__))
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or \
        'sqlite:///' + os.path.join(basedir, '..', 'apiaro.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # ============================================
    # CLOUDINARY
    # ============================================
    CLOUDINARY_CLOUD_NAME = os.environ.get('CLOUDINARY_CLOUD_NAME')
    CLOUDINARY_API_KEY = os.environ.get('CLOUDINARY_API_KEY')
    CLOUDINARY_API_SECRET = os.environ.get('CLOUDINARY_API_SECRET')
    
    # Legacy upload config (kept for non-image files if needed)
    UPLOAD_FOLDER = 'uploads'
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024
    
    # M-PESA
    MPESA_ENVIRONMENT = os.environ.get('MPESA_ENVIRONMENT', 'sandbox')
    MPESA_CONSUMER_KEY = os.environ.get('MPESA_CONSUMER_KEY', 'tWV9HDO1b1tP7TUwgaXdZ4At6EDGflnzwuNcu1UDDKz9okLz')
    MPESA_CONSUMER_SECRET = os.environ.get('MPESA_CONSUMER_SECRET', 'GubkZYAZ03MzRlDVmywTDHDK4xnYPSekJHD0varFOqzdvXmPZO9TUNCFlqZXQeU8')
    MPESA_PASSKEY = os.environ.get('MPESA_PASSKEY', 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919')
    MPESA_SHORTCODE = os.environ.get('MPESA_SHORTCODE', '174379')
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