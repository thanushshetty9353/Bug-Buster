import os
import base64
from flask import Flask, render_template, request, jsonify, redirect, url_for
from flask_socketio import SocketIO, emit
from io import BytesIO
from PIL import Image
import time

app = Flask(__name__)
socketio = SocketIO(app)

UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

def save_image(image, user_id):
    filename = os.path.join(UPLOAD_FOLDER, f'captured_image_{user_id}_{int(time.time())}.png')
    image.save(filename)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/verify_student', methods=['POST'])
def verify_student():
    data = request.get_json()
    image_data = data['image']
    user_id = data.get('user_id', 'unknown_user')

    image_data = image_data.split(',')[1]
    image_bytes = base64.b64decode(image_data)
    image = Image.open(BytesIO(image_bytes))

    save_image(image, user_id)

    if is_verified(image):
        return jsonify({'verified': True})
    else:
        return jsonify({'verified': False})

@app.route('/exam')
def exam():
    return render_template('exam.html')

@socketio.on('tabViolation')
def handle_tab_violation(message):
    print(f"Tab violation detected: {message}")
    emit('warning', 'Please don\'t switch tabs!', broadcast=True)

@app.route('/submit_exam', methods=['POST'])
def submit_exam():
    answers = request.json
    return jsonify({'status': 'success'}), 200

@app.route('/submission_success')
def submission_success():
    return render_template('submission_success.html')

def is_verified(image):
    return True

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000)
