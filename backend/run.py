#!/usr/bin/env python3
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
basedir = os.path.abspath(os.path.dirname(__file__))
env_path = os.path.join(basedir, '.env')
print(f"Loading .env from: {env_path}")
load_dotenv(env_path)

if os.getenv('MAIL_USERNAME'):
    print(f"Email configured for: {os.getenv('MAIL_USERNAME')}")
else:
    print("MAIL_USERNAME not found in .env - email will be disabled")

from app import create_app, db
from flask import send_from_directory, jsonify
from flask_cors import CORS

app = create_app(os.getenv('FLASK_ENV', 'development'))

CORS(app, resources={
    r"/uploads/*": {
        "origins": "*",
        "allow_headers": ["Content-Type", "Authorization"],
        "expose_headers": ["Content-Type", "Access-Control-Allow-Origin"]
    },
    r"/api/*": {
        "origins": "*",
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

UPLOAD_FOLDER = os.path.join(basedir, 'uploads')
print(f"Upload folder: {UPLOAD_FOLDER}")
print(f"Upload folder exists: {os.path.exists(UPLOAD_FOLDER)}")

if 'serve_upload' not in app.view_functions:
    @app.route('/uploads/<path:filename>')
    def serve_upload(filename):
        try:
            safe_path = os.path.normpath(filename)
            if safe_path.startswith('..') or safe_path.startswith('/'):
                return jsonify({'error': 'Invalid path'}), 400
            
            full_path = os.path.join(UPLOAD_FOLDER, safe_path)
            
            if not os.path.exists(full_path):
                print(f"File not found: {full_path}")
                return jsonify({'error': 'File not found', 'path': safe_path}), 404
            
            print(f"Serving file: {full_path}")
            
            response = send_from_directory(UPLOAD_FOLDER, safe_path)
            response.headers['Access-Control-Allow-Origin'] = '*'
            response.headers['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
            response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
            return response
            
        except Exception as e:
            print(f"Error serving file: {e}")
            return jsonify({'error': str(e)}), 500
else:
    print("Upload route already registered")

@app.cli.command()
def init_db():
    with app.app_context():
        db.create_all()
        print('Database initialized')

@app.cli.command()
def reset_db():
    with app.app_context():
        db.drop_all()
        db.create_all()
        print('Database reset complete')

if __name__ == '__main__':
    print('Starting Apiaro Backend Server')
    print(f"API Base: http://127.0.0.1:5000/api")
    print(f"Uploads URL: http://127.0.0.1:5000/uploads/")
    
    upload_dirs = ['uploads/products', 'uploads/projects']
    for dir_name in upload_dirs:
        dir_path = os.path.join(basedir, dir_name)
        if not os.path.exists(dir_path):
            os.makedirs(dir_path)
            print(f"Created directory: {dir_path}")
        else:
            files = os.listdir(dir_path)
            print(f"Directory exists: {dir_path} ({len(files)} files)")
    
    with app.app_context():
        db.create_all()
        print('Database tables verified')
    
    app.run(host='0.0.0.0', port=5000, debug=True)