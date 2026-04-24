#!/usr/bin/env python3
import os
import sys

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv

# Load environment variables
basedir = os.path.abspath(os.path.dirname(__file__))
env_path = os.path.join(basedir, '.env')
print(f"Loading .env from: {env_path}")
load_dotenv(env_path)

if os.getenv('MAIL_USERNAME'):
    print(f"Email configured for: {os.getenv('MAIL_USERNAME')}")
else:
    print("MAIL_USERNAME not found in .env - email will be disabled")

from app import create_app, db

# Create app instance
app = create_app(os.getenv('FLASK_ENV', 'development'))

UPLOAD_FOLDER = os.path.join(basedir, 'uploads')
print(f"Upload folder: {UPLOAD_FOLDER}")
print(f"Upload folder exists: {os.path.exists(UPLOAD_FOLDER)}")

# CLI Commands
@app.cli.command()
def init_db():
    """Initialize the database"""
    with app.app_context():
        db.create_all()
        print('✅ Database initialized')

@app.cli.command()
def reset_db():
    """Reset the database (WARNING: Deletes all data)"""
    with app.app_context():
        db.drop_all()
        db.create_all()
        print('✅ Database reset complete')

@app.cli.command()
def list_routes():
    """List all registered routes"""
    with app.app_context():
        print("\n🔍 Registered Routes:")
        print("-" * 80)
        for rule in app.url_map.iter_rules():
            methods = ','.join(sorted(rule.methods - {'HEAD', 'OPTIONS'}))
            print(f"{rule.endpoint:30s} {methods:20s} {rule.rule}")
        print("-" * 80)

if __name__ == '__main__':
    print('\n' + '='*60)
    print('Starting Apiaro Backend Server')
    print('='*60)
    print(f"API Base:      http://127.0.0.1:5000/api")
    print(f"Health Check:  http://127.0.0.1:5000/api/health")
    print(f"Uploads URL:   http://127.0.0.1:5000/uploads/")
    print('='*60 + '\n')
    
    # Ensure upload directories exist
    upload_dirs = ['uploads/products', 'uploads/projects']
    for dir_name in upload_dirs:
        dir_path = os.path.join(basedir, dir_name)
        if not os.path.exists(dir_path):
            os.makedirs(dir_path)
            print(f"📁 Created directory: {dir_path}")
        else:
            files = os.listdir(dir_path)
            print(f"📁 Directory exists: {dir_path} ({len(files)} files)")
    
    # Verify database
    with app.app_context():
        db.create_all()
        from sqlalchemy import inspect
        inspector = inspect(db.engine)
        tables = inspector.get_table_names()
        print(f"\n✅ Database tables verified: {tables}\n")
    
    # Run server
    app.run(host='0.0.0.0', port=5000, debug=True)