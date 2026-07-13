import os
import time
import threading
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import requests

from camera_source import CameraSource, OPENCV_AVAILABLE
from detector import PersonDetector

# Load environment
load_dotenv()

# Env Configs
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:5000/api")
CV_SERVICE_SECRET = os.getenv("CV_SERVICE_SECRET", "fulafia_cv_shared_secret_key")
ZONE_ID = int(os.getenv("ZONE_ID", "3"))  # Default to e-Library Section
INTERVAL = int(os.getenv("CV_UPLOAD_INTERVAL", "3"))  # Upload count every 3 seconds
PORT = int(os.getenv("PORT", "8000"))

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Start the worker thread
    thread = threading.Thread(target=upload_occupancy_loop, daemon=True)
    thread.start()
    yield
    # Stop worker and release camera
    global running
    running = False
    camera.release()
    print("CV Analytics Service shutting down.")

app = FastAPI(title="FULafia Library CV Analytics Service", lifespan=lifespan)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global instances
camera = CameraSource(use_fallback_video=False)
detector = PersonDetector()

if camera.is_simulated:
    print("Camera is simulated. Forcing detector to simulation mode for fluctuating counts.")
    detector.is_simulated = True


current_count = 0
last_update_time = 0
running = True


def upload_occupancy_loop():
    """
    Background worker loop that captures frames, calculates counts,
    and sends them to the Node.js API server.
    """
    global current_count, last_update_time, running
    
    print(f"Starting background CV occupancy worker for Zone ID {ZONE_ID}...")
    headers = {
        "x-cv-service-key": CV_SERVICE_SECRET,
        "Content-Type": "application/json"
    }

    while running:
        try:
            if camera.is_simulated:
                # In simulation mode, simulate and post for all zones so the dashboard is fully dynamic
                for z_id in [1, 2, 3]:
                    frame = camera.get_frame()
                    count, _ = detector.detect(frame, zone_id=z_id)
                    
                    if z_id == ZONE_ID:
                        current_count = count
                        last_update_time = time.time()

                    payload = {
                        "zoneId": z_id,
                        "count": count
                    }
                    
                    response = requests.post(
                        f"{BACKEND_URL}/cv/occupancy",
                        json=payload,
                        headers=headers,
                        timeout=5
                    )
                    if response.status_code != 201:
                        print(f"Backend rejected CV upload for Zone {z_id} (Status {response.status_code}): {response.text}")
            else:
                # Real webcam mode: only capture and post for the configured ZONE_ID
                frame = camera.get_frame()
                count, _ = detector.detect(frame, zone_id=ZONE_ID)
                current_count = count
                last_update_time = time.time()

                payload = {
                    "zoneId": ZONE_ID,
                    "count": current_count
                }
                
                response = requests.post(
                    f"{BACKEND_URL}/cv/occupancy",
                    json=payload,
                    headers=headers,
                    timeout=5
                )
                
                if response.status_code != 201:
                    print(f"Backend rejected CV upload (Status {response.status_code}): {response.text}")
                
        except Exception as e:
            print(f"Worker encountered connection error to backend: {e}")

        time.sleep(INTERVAL)


@app.get("/")
def get_status():
    """
    Returns active configuration and status variables.
    """
    return JSONResponse({
        "status": "active",
        "zone_id": ZONE_ID,
        "current_occupancy": current_count,
        "is_simulated": detector.is_simulated,
        "opencv_available": OPENCV_AVAILABLE,
        "backend_url": BACKEND_URL,
        "last_update_timestamp": last_update_time
    })


def generate_mjpeg_stream():
    """
    Generates MJPEG streaming frame boundaries.
    """
    while running:
        try:
            frame = camera.get_frame()
            _, annotated_frame = detector.detect(frame, zone_id=ZONE_ID)

            if OPENCV_AVAILABLE and annotated_frame is not None:
                import cv2
                # Compress to JPEG
                ret, jpeg_buffer = cv2.imencode('.jpg', annotated_frame)
                if ret:
                    frame_bytes = jpeg_buffer.tobytes()
                    yield (b'--frame\r\n'
                           b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
            else:
                # If OpenCV is missing, sleep to prevent CPU spin
                time.sleep(0.5)
        except Exception as e:
            print(f"Streaming error: {e}")
            time.sleep(0.1)
        
        # Throttled stream refresh rate (~15 FPS)
        time.sleep(0.06)


@app.get("/stream")
def get_stream():
    """
    Serves the live video stream annotated by YOLO or simulation overlays.
    """
    if not OPENCV_AVAILABLE:
        return JSONResponse(
            status_code=501, 
            content={"message": "Streaming requires OpenCV packages to encode JPEG payloads."}
        )
    return StreamingResponse(
        generate_mjpeg_stream(),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )





if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=PORT)
