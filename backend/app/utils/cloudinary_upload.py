import cloudinary
import cloudinary.uploader
from werkzeug.utils import secure_filename

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def upload_image_to_cloudinary(file, folder='apiaro'):
    """
    Upload a file to Cloudinary and return the secure URL.
    """
    if not file or not allowed_file(file.filename):
        return None
    
    try:
        result = cloudinary.uploader.upload(
            file,
            folder=folder,
            resource_type='image',
            use_filename=True,
            unique_filename=True,
            overwrite=False
        )
        print(f'☁️ Cloudinary upload: {result["secure_url"]}')
        return result['secure_url']
    except Exception as e:
        print(f'❌ Cloudinary upload failed: {e}')
        return None

def upload_multiple_images(files, folder='apiaro'):
    urls = []
    for file in files:
        if file and allowed_file(file.filename):
            url = upload_image_to_cloudinary(file, folder)
            if url:
                urls.append(url)
    return urls