import os
import sys
import requests
import shutil
from pathlib import Path
from tqdm import tqdm

def download_file(url, destination):
    """Download a file with progress bar"""
    try:
        print(f"\nDownloading {Path(url).name}...")
        response = requests.get(url, stream=True)
        response.raise_for_status()
        
        # Get file size for progress bar
        total_size = int(response.headers.get('content-length', 0))
        block_size = 1024  # 1 Kibibyte
        
        # Create directory if it doesn't exist
        destination.parent.mkdir(parents=True, exist_ok=True)
        
        with open(destination, 'wb') as f, tqdm(
            total=total_size, unit='iB', unit_scale=True, unit_divisor=1024
        ) as bar:
            for data in response.iter_content(block_size):
                size = f.write(data)
                bar.update(size)
                
        print(f"✅ Successfully downloaded to {destination}")
        return True
        
    except Exception as e:
        print(f"❌ Failed to download {url}: {e}")
        if destination.exists():
            try:
                destination.unlink()
            except:
                pass
        return False

def main():
    # Create models directory if it doesn't exist
    models_dir = Path("E:/i.mobilothon 5.0/edgefleet-prototype/ml/saved_models")
    models_dir.mkdir(parents=True, exist_ok=True)
    
    # Download facial landmarks model from dlib
    print("\n" + "="*50)
    print("Downloading Facial Landmarks Model")
    print("="*50)
    facial_landmarks_url = "http://dlib.net/files/shape_predictor_68_face_landmarks.dat.bz2"
    facial_landmarks_dest = models_dir / "shape_predictor_68_face_landmarks.dat.bz2"
    
    if not facial_landmarks_dest.exists():
        success = download_file(facial_landmarks_url, facial_landmarks_dest)
        if success:
            print("✅ Facial landmarks model downloaded successfully!")
            
            # Extract the .bz2 file
            print("\nExtracting facial landmarks model...")
            import bz2
            extracted_path = models_dir / "shape_predictor_68_face_landmarks.dat"
            try:
                with bz2.open(facial_landmarks_dest, 'rb') as f_in:
                    with open(extracted_path, 'wb') as f_out:
                        shutil.copyfileobj(f_in, f_out)
                print(f"✅ Successfully extracted to {extracted_path}")
            except Exception as e:
                print(f"❌ Failed to extract {facial_landmarks_dest}: {e}")
    else:
        print("✅ Facial landmarks model already exists!")
    
    # Download Emotion FER+ model
    print("\n" + "="*50)
    print("Downloading Emotion FER+ Model")
    print("="*50)
    emotion_ferplus_urls = [
        "https://github.com/onnx/models/raw/main/vision/body_analysis/emotion_ferplus/model/emotion-ferplus-8.onnx",
        "https://github.com/onnx/models/raw/master/vision/body_analysis/emotion_ferplus/model/emotion-ferplus-8.onnx",
        "https://www.dropbox.com/s/3t3kmqmgdrk7grf/emotion-ferplus-8.onnx?dl=1"
    ]
    emotion_ferplus_dest = models_dir / "emotion-ferplus-8.onnx"
    
    if not emotion_ferplus_dest.exists():
        success = False
        for url in emotion_ferplus_urls:
            print(f"\nTrying URL: {url}")
            success = download_file(url, emotion_ferplus_dest)
            if success:
                print("✅ Emotion FER+ model downloaded successfully!")
                break
        if not success:
            print("❌ Failed to download Emotion FER+ model from all sources")
    else:
        print("✅ Emotion FER+ model already exists!")
    
    # Download ByteTrack model
    print("\n" + "="*50)
    print("Downloading ByteTrack Model")
    print("="*50)
    bytetrack_urls = [
        "https://github.com/ifzhang/ByteTrack/releases/download/v0.1.0/pretrained/bytetrack_x_mot17.pth.tar",
        "https://github.com/ifzhang/ByteTrack/releases/download/v0.1.0/bytetrack_x_mot17.pth.tar",
        "https://www.dropbox.com/s/3t3kmqmgdrk7grf/bytetrack_x_mot17.pth.tar?dl=1"
    ]
    bytetrack_dest = models_dir / "bytetrack_x_mot17.pth.tar"
    
    if not bytetrack_dest.exists():
        success = False
        for url in bytetrack_urls:
            print(f"\nTrying URL: {url}")
            success = download_file(url, bytetrack_dest)
            if success:
                print("✅ ByteTrack model downloaded successfully!")
                break
        if not success:
            print("❌ Failed to download ByteTrack model from all sources")
    else:
        print("✅ ByteTrack model already exists!")
    
    print("\n" + "="*50)
    print("✅ All downloads completed!")
    print("="*50)

if __name__ == "__main__":
    main()
