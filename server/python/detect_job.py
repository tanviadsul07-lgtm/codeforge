"""
detect_job.py : PathRakshak AI Autonomous Road Hazard Detection Worker Script
Adapted from reference pipeline for integration with Node.js & React frontend.
"""
import argparse
import csv
import glob
import json
import math
import os
import sys

import cv2
import numpy as np
from huggingface_hub import hf_hub_download
from ultralytics import YOLO

MODELS = [
    ("samdutse/pothole-yolov8", "best.pt"),
]

M_PER_DEG = 111320.0  # Meters per degree of latitude

def parse_args():
    p = argparse.ArgumentParser(description="PathRakshak AI Video & GPS Hazard Detector")
    p.add_argument("--video", required=True, help="Path to input video file")
    p.add_argument("--gps", required=True, help="Path to input GPS CSV file")
    p.add_argument("--out", required=True, help="Path to output result JSON file")
    p.add_argument("--evidence-dir", required=True, help="Path to directory for evidence JPEG images")
    p.add_argument("--conf", type=float, default=0.25, help="Minimum detection confidence")
    p.add_argument("--sample-fps", type=float, default=3.0, help="Frames analysed per second")
    p.add_argument("--offset", type=float, default=0.0, help="Time offset in seconds (video vs GPS)")
    p.add_argument("--merge-m", type=float, default=12.0, help="Merge distance threshold in meters")
    p.add_argument("--merge-s", type=float, default=5.0, help="Merge time threshold in seconds")
    return p.parse_args()


class Track:
    def __init__(self, t, lat, lon):
        self.t, self.lat, self.lon = t, lat, lon
        self._last_heading = 0.0

    def pos(self, sec):
        return (float(np.interp(sec, self.t, self.lat)),
                float(np.interp(sec, self.t, self.lon)))

    def heading(self, sec):
        a = max(sec - 1.0, self.t[0])
        b = min(sec + 1.0, self.t[-1])
        la1, lo1 = self.pos(a)
        la2, lo2 = self.pos(b)
        dn = (la2 - la1) * M_PER_DEG
        de = (lo2 - lo1) * M_PER_DEG * math.cos(math.radians(la1))
        if math.hypot(dn, de) < 1.0:
            return self._last_heading
        self._last_heading = math.atan2(de, dn)
        return self._last_heading

    def place(self, sec, ahead_m, right_m):
        la, lo = self.pos(sec)
        h = self.heading(sec)
        north = ahead_m * math.cos(h) - right_m * math.sin(h)
        east = ahead_m * math.sin(h) + right_m * math.cos(h)
        return (la + north / M_PER_DEG,
                lo + east / (M_PER_DEG * math.cos(math.radians(la))))


def load_gps(path):
    if not os.path.exists(path):
        raise FileNotFoundError(f"GPS file not found: {path}")

    rows = []
    with open(path, "r", encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        # Normalize header keys
        headers = {k.strip().lower(): k for k in reader.fieldnames or []}
        
        t_key = headers.get("time_sec") or headers.get("time") or headers.get("timestamp")
        lat_key = headers.get("lat") or headers.get("latitude")
        lon_key = headers.get("lon") or headers.get("lng") or headers.get("longitude")

        if not t_key or not lat_key or not lon_key:
            raise ValueError(f"GPS CSV missing required columns (time_sec, lat, lon). Found: {reader.fieldnames}")

        for r in reader:
            try:
                t_val = float(r[t_key])
                lat_val = float(r[lat_key])
                lon_val = float(r[lon_key])
                if -90.0 <= lat_val <= 90.0 and -180.0 <= lon_val <= 180.0:
                    rows.append((t_val, lat_val, lon_val))
            except (ValueError, TypeError):
                continue

    if len(rows) < 2:
        raise ValueError("GPS file needs at least 2 valid coordinate points.")

    rows.sort()
    return Track(np.array([r[0] for r in rows]),
                 np.array([r[1] for r in rows]),
                 np.array([r[2] for r in rows]))


def estimate_offsets(box, w, h):
    x1, y1, x2, y2 = box
    near = min(max((y2 / h - 0.5) / 0.5, 0.0), 1.0)
    ahead = 25.0 - near * 21.0
    right = ((x1 + x2) / 2 / w - 0.5) * 7.0
    return ahead, right


def severity(conf, area_frac):
    score = 0.6 * conf + 0.4 * min(area_frac / 0.05, 1.0)
    if score >= 0.65:
        return "High"
    if score >= 0.45:
        return "Medium"
    return "Low"


def dist_m(la1, lo1, la2, lo2):
    dn = (la2 - la1) * M_PER_DEG
    de = (lo2 - lo1) * M_PER_DEG * math.cos(math.radians(la1))
    return math.hypot(dn, de)


def make_evidence(frame, box, label, conf):
    img = frame.copy()
    x1, y1, x2, y2 = [int(v) for v in box]
    cv2.rectangle(img, (x1, y1), (x2, y2), (0, 0, 255), 3)
    cv2.putText(img, f"{label} {conf:.2f}", (x1, max(y1 - 8, 20)),
                cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 255), 2)
    scale = 640.0 / img.shape[1]
    if scale < 1:
        img = cv2.resize(img, None, fx=scale, fy=scale)
    return img


def load_models():
    loaded = []
    for repo, fname in MODELS:
        try:
            model_path = hf_hub_download(repo_id=repo, filename=fname)
            loaded.append(YOLO(model_path))
            print(f"[Python AI Worker] Loaded model: {repo}")
        except Exception as e:
            print(f"[Python AI Worker Warning] Could not download/load model {repo}: {e}")

    if not loaded:
        raise RuntimeError("No YOLO AI model could be loaded. Check internet connection or cache.")
    return loaded


def detect(args, track, models):
    if not os.path.exists(args.video):
        raise FileNotFoundError(f"Video file not found: {args.video}")

    cap = cv2.VideoCapture(args.video)
    if not cap.isOpened():
        raise RuntimeError(f"Could not open video file: {args.video}")

    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    step = max(int(round(fps / args.sample_fps)), 1)
    total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    
    print(f"[Python AI Worker] Video info: {total / fps:.1f}s, {fps:.0f} fps, sampling every {step} frames")

    raw, skipped, frame_no = [], 0, 0
    while True:
        ok, frame = cap.read()
        if not ok:
            break

        if frame_no % step == 0:
            sec = frame_no / fps
            gps_sec = sec + args.offset

            if gps_sec < track.t[0] or gps_sec > track.t[-1]:
                skipped += 1
            else:
                h, w = frame.shape[:2]
                for model in models:
                    result = model(frame, conf=args.conf, verbose=False)[0]
                    for box in result.boxes:
                        x1, y1, x2, y2 = [float(v) for v in box.xyxy[0].tolist()]
                        conf = float(box.conf)
                        label = model.names[int(box.cls)].capitalize()
                        ahead, right = estimate_offsets((x1, y1, x2, y2), w, h)
                        lat, lon = track.place(gps_sec, ahead, right)
                        raw.append({
                            "hazard": label,
                            "time": sec,
                            "conf": conf,
                            "area": ((x2 - x1) * (y2 - y1)) / (w * h),
                            "lat": lat,
                            "lon": lon,
                            "image": make_evidence(frame, (x1, y1, x2, y2), label, conf),
                        })

        frame_no += 1
        if total and frame_no % (step * 5) == 0:
            pct = int(100 * frame_no / total)
            print(f"PROGRESS: {pct}%", flush=True)

    cap.release()
    return raw, skipped


def merge(raw, merge_m, merge_s):
    clusters = []
    for d in sorted(raw, key=lambda d: d["time"]):
        for c in clusters:
            if (c["hazard"] == d["hazard"]
                    and d["time"] - c["last_time"] <= merge_s
                    and dist_m(c["lat"], c["lon"], d["lat"], d["lon"]) <= merge_m):
                n = c["seen"]
                c["lat"] = (c["lat"] * n + d["lat"]) / (n + 1)
                c["lon"] = (c["lon"] * n + d["lon"]) / (n + 1)
                c["seen"] = n + 1
                c["last_time"] = d["time"]
                if d["conf"] > c["conf"]:
                    c["conf"], c["area"], c["image"] = d["conf"], d["area"], d["image"]
                break
        else:
            clusters.append({
                "hazard": d["hazard"], "time": d["time"], "last_time": d["time"],
                "lat": d["lat"], "lon": d["lon"], "seen": 1,
                "conf": d["conf"], "area": d["area"], "image": d["image"],
            })
    return clusters


def write_outputs(clusters, track, args):
    os.makedirs(args.evidence_dir, exist_ok=True)

    features = []
    for i, c in enumerate(clusters, 1):
        hid = f"HZ-2026-AI-{i:03d}"
        fileName = f"evidence_{i:03d}.jpg"
        filePath = os.path.join(args.evidence_dir, fileName)
        cv2.imwrite(filePath, c["image"], [cv2.IMWRITE_JPEG_QUALITY, 85])

        features.append({
            "id": hid,
            "hazardId": hid,
            "hazard": c["hazard"],
            "category": c["hazard"] if c["hazard"] in ["Pothole", "Waterlogging", "Fallen tree", "Road debris", "Road obstruction"] else "Pothole",
            "severity": severity(c["conf"], c["area"]),
            "confidence": round(float(c["conf"]), 3),
            "seenCount": c["seen"],
            "videoTimestamp": f"{int(c['time'] // 60):02d}:{int(c['time'] % 60):02d}",
            "timeSec": round(float(c["time"]), 1),
            "latitude": float(c["lat"]),
            "longitude": float(c["lon"]),
            "evidenceImageFileName": fileName,
            "evidenceImagePath": filePath
        })

    route_coords = [[float(lo), float(la)] for la, lo in zip(track.lat, track.lon)]
    route_geojson = {
        "type": "FeatureCollection",
        "features": [{
            "type": "Feature",
            "geometry": {
                "type": "LineString",
                "coordinates": route_coords
            },
            "properties": {
                "name": "Vehicular Inspection Route Trajectory",
                "pointsCount": len(route_coords)
            }
        }]
    }

    result_data = {
        "success": True,
        "hazardCount": len(features),
        "skippedSeconds": 0,
        "modelDetails": {
            "name": "YOLOv8 Pothole Detector",
            "repository": "samdutse/pothole-yolov8",
            "supportedClasses": ["Pothole"]
        },
        "features": features,
        "route": route_geojson
    }

    with open(args.out, "w", encoding="utf-8") as f:
        json.dump(result_data, f, indent=2)

    return result_data


def main():
    args = parse_args()
    print(f"[Python AI Worker] Starting detection job...")
    try:
        track = load_gps(args.gps)
        models = load_models()
        raw, skipped = detect(args, track, models)
        clusters = merge(raw, args.merge_m, args.merge_s)
        result = write_outputs(clusters, track, args)
        result["skippedSeconds"] = skipped

        # Re-write final JSON with skipped seconds
        with open(args.out, "w", encoding="utf-8") as f:
            json.dump(result, f, indent=2)

        print(f"PROGRESS: 100%", flush=True)
        print(f"[Python AI Worker] Detection completed. Hazards detected: {len(result['features'])}")
    except Exception as err:
        print(f"[Python AI Worker Error] {err}", file=sys.stderr)
        err_res = {"success": False, "error": str(err)}
        with open(args.out, "w", encoding="utf-8") as f:
            json.dump(err_res, f, indent=2)
        sys.exit(1)


if __name__ == "__main__":
    main()
