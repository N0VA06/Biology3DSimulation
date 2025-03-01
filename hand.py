import cv2
import mediapipe as mp
import numpy as np
import time
from flask import Flask, Response, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Enable CORS for cross-origin requests

# Global variables
camera_active = False
hand_data = {"present": False, "x": 0, "y": 0, "z": 0, "fingers": []}

# Initialize MediaPipe Hands
mp_hands = mp.solutions.hands
mp_drawing = mp.solutions.drawing_utils
hands = mp_hands.Hands(
    max_num_hands=1,
    min_detection_confidence=0.3,  # Lowered for better detection
    min_tracking_confidence=0.3
)

def detect_hands(frame):
    global hand_data
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = hands.process(rgb_frame)
    annotated_frame = frame.copy()

    if results.multi_hand_landmarks:
        for hand_landmarks in results.multi_hand_landmarks:
            mp_drawing.draw_landmarks(annotated_frame, hand_landmarks, mp_hands.HAND_CONNECTIONS)
            wrist = hand_landmarks.landmark[mp_hands.HandLandmark.WRIST]

            hand_data["present"] = True
            hand_data["x"] = wrist.x  # Horizontal position (0 to 1)
            hand_data["y"] = wrist.y  # Vertical position (0 to 1)
            hand_data["z"] = wrist.z  # Depth

            # Detect finger states (up/down)
            fingers = []
            for i, tip_id in enumerate([4, 8, 12, 16, 20]):  # Thumb to pinky
                tip = hand_landmarks.landmark[tip_id]
                pip = hand_landmarks.landmark[tip_id - 2]
                fingers.append(1 if tip.y < pip.y else 0)

            hand_data["fingers"] = fingers
    else:
        hand_data["present"] = False

    return cv2.flip(annotated_frame, 1)

def generate_frames():
    global camera_active
    cap = cv2.VideoCapture(0)

    if not cap.isOpened():
        print("❌ Error: Could not open camera.")
        return

    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
    camera_active = True
    print("✅ Camera started")

    try:
        while camera_active:
            success, frame = cap.read()
            if not success:
                break

            frame = detect_hands(frame)
            _, buffer = cv2.imencode('.jpg', frame)
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')
            time.sleep(0.01)
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        cap.release()
        camera_active = False
        print("📷 Camera released")

@app.route('/video_feed')
def video_feed():
    return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/hand_data')
def get_hand_data():
    return jsonify(hand_data)

@app.route('/stop_camera')
def stop_camera():
    global camera_active
    camera_active = False
    return jsonify({"status": "Camera stopping"})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5050, debug=False, threaded=True)
