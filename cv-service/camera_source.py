import time
import os

OPENCV_AVAILABLE = False
try:
    import cv2
    import numpy as np
    OPENCV_AVAILABLE = True
except ImportError:
    pass


class CameraSource:
    def __init__(self, source_path=None, use_fallback_video=False):
        self.cap = None
        self.is_simulated = not OPENCV_AVAILABLE
        self.source_path = source_path
        self.use_fallback_video = use_fallback_video

        force_sim = os.getenv("FORCE_SIMULATION", "false").lower() in ("true", "1", "yes")

        if OPENCV_AVAILABLE and not force_sim:
            if use_fallback_video and source_path and os.path.exists(source_path):
                print(f"Initializing video playback source: {source_path}")
                self.cap = cv2.VideoCapture(source_path)
            else:
                print("Initializing webcam source (index 0)...")
                self.cap = cv2.VideoCapture(0)
                
                # Verify if webcam actually opened
                if not self.cap.isOpened():
                    print("Webcam not found or busy. Switching to simulated frame generation.")
                    self.cap = None
                    self.is_simulated = True
        else:
            if force_sim:
                print("FORCE_SIMULATION active in environment. Skipping camera capture to keep webcam free.")
            self.is_simulated = True

    def get_frame(self):
        """
        Reads a frame from the camera/video source.
        Returns a numpy array representing the frame (or None if simulated).
        """
        if self.is_simulated or not OPENCV_AVAILABLE:
            # Generate a simulated frame (dark blue matrix with a moving white rectangle)
            if OPENCV_AVAILABLE:
                frame = np.zeros((480, 640, 3), dtype=np.uint8)
                # Fill background with dark forest green
                frame[:] = [28, 54, 0]  # BGR for FULafia Forest Green
                
                # Draw a moving square
                t = time.time()
                cx = int(320 + 150 * np.sin(t))
                cy = int(240 + 100 * np.cos(t * 1.5))
                cv2.rectangle(frame, (cx - 40, cy - 40), (cx + 40, cy + 40), (255, 255, 255), 2)
                cv2.putText(frame, "Synthetic Feed (No camera)", (20, 440), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (200, 200, 200), 1)
                return frame
            else:
                return None

        # Real OpenCV capture
        ret, frame = self.cap.read()
        if not ret:
            # If playing a video, loop it when it finishes
            if self.use_fallback_video and self.cap is not None:
                self.cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                ret, frame = self.cap.read()
            
            if not ret:
                print("Failed to capture frame from source. Reverting to simulation.")
                self.is_simulated = True
                return self.get_frame()

        return frame

    def release(self):
        if self.cap is not None:
            self.cap.release()
            print("Camera source released.")
