from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import Project
from app import db
import os
import json
from werkzeug.utils import secure_filename

projects_bp = Blueprint('projects', __name__)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# PUBLIC - No auth required for viewing
@projects_bp.route('/projects', methods=['GET'])
def get_projects():
    try:
        print('✅ GET /projects - Public access')
        
        # Optional filtering
        category = request.args.get('category')
        status = request.args.get('status')
        featured = request.args.get('featured')
        
        query = Project.query
        
        if category:
            query = query.filter_by(category=category)
        if status:
            query = query.filter_by(status=status)
        if featured:
            query = query.filter_by(featured=featured.lower() == 'true')
        
        projects = query.order_by(Project.created_at.desc()).all()
        
        return jsonify({
            'success': True,
            'projects': [p.to_dict() for p in projects]
        }), 200
    except Exception as e:
        print(f'❌ Error in get_projects: {str(e)}')
        return jsonify({'success': False, 'message': str(e)}), 500

# PUBLIC - No auth required for viewing single project
@projects_bp.route('/projects/<int:id>', methods=['GET'])
def get_project(id):
    try:
        print(f'✅ GET /projects/{id} - Public access')
        
        project = Project.query.get_or_404(id)
        return jsonify({
            'success': True,
            'project': project.to_dict()
        }), 200
    except Exception as e:
        print(f'❌ Error in get_project: {str(e)}')
        return jsonify({'success': False, 'message': str(e)}), 500

# PROTECTED - Auth required for creating
@projects_bp.route('/projects', methods=['POST'])
@jwt_required()
def create_project():
    try:
        current_user = get_jwt_identity()
        print(f'✅ POST /projects - User: {current_user}')
        
        # Handle form data
        title = request.form.get('title')
        category = request.form.get('category')
        status = request.form.get('status')
        location = request.form.get('location')
        budget = request.form.get('budget', 0)
        client_name = request.form.get('client_name')
        description = request.form.get('description')
        featured = request.form.get('featured', 'false').lower() == 'true'
        start_date = request.form.get('start_date')
        end_date = request.form.get('end_date')
        
        print(f'📋 Form data: title={title}, category={category}')
        
        # Handle images
        images = request.files.getlist('images')
        image_paths = []
        
        for image in images:
            if image and allowed_file(image.filename):
                filename = secure_filename(image.filename)
                upload_path = os.path.join(current_app.root_path, '..', 'uploads', 'projects', filename)
                image.save(upload_path)
                image_paths.append(f'uploads/projects/{filename}')
                print(f'📸 Saved image: {filename}')
        
        # Create project with JSON string for images
        project = Project(
            title=title,
            category=category,
            status=status,
            location=location,
            budget=float(budget) if budget else 0,
            client_name=client_name,
            description=description,
            featured=featured,
            start_date=start_date,
            end_date=end_date,
            images=json.dumps(image_paths) if image_paths else '[]'
        )
        
        db.session.add(project)
        db.session.commit()
        
        print(f'✅ Project created: {project.id}')
        
        return jsonify({
            'success': True,
            'message': 'Project created successfully',
            'project': project.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        print(f'❌ Error creating project: {str(e)}')
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'message': str(e)}), 500

# PROTECTED - Auth required for updating
@projects_bp.route('/projects/<int:id>', methods=['PUT'])
@jwt_required()
def update_project(id):
    try:
        current_user = get_jwt_identity()
        print(f'✅ PUT /projects/{id} - User: {current_user}')
        
        project = Project.query.get_or_404(id)
        
        # Update fields
        project.title = request.form.get('title', project.title)
        project.category = request.form.get('category', project.category)
        project.status = request.form.get('status', project.status)
        project.location = request.form.get('location', project.location)
        project.budget = request.form.get('budget', project.budget)
        project.client_name = request.form.get('client_name', project.client_name)
        project.description = request.form.get('description', project.description)
        project.featured = request.form.get('featured', str(project.featured)).lower() == 'true'
        project.start_date = request.form.get('start_date', project.start_date)
        project.end_date = request.form.get('end_date', project.end_date)
        
        # Handle new images
        images = request.files.getlist('images')
        current_images = []
        if project.images:
            try:
                current_images = json.loads(project.images) if isinstance(project.images, str) else project.images
            except:
                current_images = []
        
        for image in images:
            if image and allowed_file(image.filename):
                filename = secure_filename(image.filename)
                upload_path = os.path.join(current_app.root_path, '..', 'uploads', 'projects', filename)
                image.save(upload_path)
                current_images.append(f'uploads/projects/{filename}')
        
        project.images = json.dumps(current_images) if current_images else '[]'
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Project updated successfully',
            'project': project.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f'❌ Error updating project: {str(e)}')
        return jsonify({'success': False, 'message': str(e)}), 500

# PROTECTED - Auth required for deleting
@projects_bp.route('/projects/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_project(id):
    try:
        current_user = get_jwt_identity()
        print(f'✅ DELETE /projects/{id} - User: {current_user}')
        
        project = Project.query.get_or_404(id)
        db.session.delete(project)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Project deleted successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f'❌ Error deleting project: {str(e)}')
        return jsonify({'success': False, 'message': str(e)}), 500