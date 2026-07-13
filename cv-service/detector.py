import sys
import time
import random

# Global flags to trace import success
ULTRALYTICS_AVAILABLE = False
OPENCV_AVAILABLE = False

try:
    import cv2
    OPENCV_AVAILABLE = True
except ImportError:
    print("WARNING: OpenCV is not available. Using basic simulation logic.")

try:
    from ultralytics import YOLO
    ULTRALYTICS_AVAILABLE = True
except ImportError:
    print("WARNING: Ultralytics YOLOv8 library is not available. Falling back to simulated counting mode.")


class PersonDetector:
    def __init__(self, model_path='yolov8n.pt'):
        self.is_simulated = not ULTRALYTICS_AVAILABLE or not OPENCV_AVAILABLE
        self.model = None
        self.history = []
        self.max_history = 5
        self.simulated_counts = {1: 8, 2: 15, 3: 12}

        if not self.is_simulated:
            try:
                print(f"Loading YOLOv8 model from {model_path}...")
                self.model = YOLO(model_path)
                print("YOLOv8 model loaded successfully.")
            except Exception as e:
                print(f"Error loading YOLOv8 model: {e}. Switching to simulation mode.")
                self.is_simulated = True

    def detect(self, frame, zone_id=1):
        """
        Detects occupants (people) in the given frame.
        Returns a tuple: (person_count, annotated_frame)
        """
        if self.is_simulated:
            # Generate simulated count with small random walk to look realistic
            change = random.choice([-2, -1, 0, 1, 2])
            
            # Keep simulated count within realistic bounds depending on target zone
            # Zone 1 (Circulation) capacity: 50 -> keep count 5 - 15
            # Zone 2 (Reference) capacity: 80 -> keep count 10 - 25
            # Zone 3 (e-Library) capacity: 60 -> keep count 8 - 20
            min_c, max_c = 5, 15
            if zone_id == 2:
                min_c, max_c = 10, 25
            elif zone_id == 3:
                min_c, max_c = 8, 20

            current_sim_count = self.simulated_counts.get(zone_id, 10)
            self.simulated_counts[zone_id] = max(min_c, min(max_c, current_sim_count + change))
            
            annotated_frame = frame
            if OPENCV_AVAILABLE and frame is not None:
                # Make a copy and draw a status indicator text
                annotated_frame = frame.copy()
                h, w, _ = annotated_frame.shape
                cv2.putText(
                    annotated_frame, 
                    f"SIMULATED COUNT: {self.simulated_counts[zone_id]} (Zone {zone_id})", 
                    (20, 40), 
                    cv2.FONT_HERSHEY_SIMPLEX, 
                    0.8, 
                    (0, 199, 212), # Gold/Yellow-ish cyan
                    2
                )
                # Draw a green indicator dot
                cv2.circle(annotated_frame, (w - 30, 30), 10, (0, 255, 0), -1)

            return self.simulated_counts[zone_id], annotated_frame

        # Actual YOLOv8 Detection
        try:
            # Run inference on the frame, filtering for class 0 (person)
            results = self.model(frame, classes=[0], verbose=False)
            
            if len(results) == 0:
                raw_count = 0
                annotated_frame = frame
            else:
                result = results[0]
                raw_count = len(result.boxes)
                annotated_frame = result.plot()  # annotated frame with bounding boxes

            # Apply rolling average smoothing to prevent flicker
            self.history.append(raw_count)
            if len(self.history) > self.max_history:
                self.history.pop(0)
            
            smoothed_count = round(sum(self.history) / len(self.history))
            
            # Print count info to frame
            if OPENCV_AVAILABLE and annotated_frame is not None:
                cv2.putText(
                    annotated_frame,
                    f"AI COUNT (YOLOv8): {smoothed_count}",
                    (20, 40),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.8,
                    (0, 255, 0),
                    2
                )

            return smoothed_count, annotated_frame

        except Exception as e:
            print(f"Error during YOLOv8 detection: {e}. Returning simulated value.")
            return self.detect(None, zone_id)
