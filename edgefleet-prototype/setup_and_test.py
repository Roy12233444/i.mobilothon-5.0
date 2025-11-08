import os
import sys
import time
import torch
import gdown
import shutil
import subprocess
import requests
from pathlib import Path
from tqdm import tqdm
import urllib.request
from typing import Dict, Optional, List, Tuple, Union

# Add project root to Python path
sys.path.append(str(Path(__file__).parent.absolute()))

# Import local modules
try:
    import ml.model_loader
    from ml.model_loader import ModelManager
except ImportError:
    print("⚠️  Could not import ml.model_loader. Make sure you're running from the project root.")
    sys.exit(1)

def run_command(command: str, cwd: Optional[str] = None) -> int:
    """Run a shell command and print its output in real-time with proper encoding."""
    try:
        process = subprocess.Popen(
            command,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            shell=True,
            cwd=cwd,
            universal_newlines=False
        )
        
        # Print output in real-time with proper encoding
        for line in iter(process.stdout.readline, b''):
            try:
                print(line.decode('utf-8', errors='replace').strip())
            except UnicodeDecodeError:
                print(line.decode(sys.stdout.encoding, errors='replace').strip())
        
        process.wait()
        return process.returncode
    except Exception as e:
        print(f"❌ Error executing command: {e}")
        return 1

def download_file(url: str, destination: Path, description: str = "Downloading", max_retries: int = 3) -> bool:
    """
    Download a file with progress bar and retry logic.
    
    Args:
        url: The URL of the file to download
        destination: Path where the file will be saved
        description: Description of the file being downloaded
        max_retries: Maximum number of download attempts
    
    Returns:
        bool: True if download was successful, False otherwise
    """
    import time
    from urllib.parse import urlparse
    
    for attempt in range(max_retries):
        try:
            destination.parent.mkdir(parents=True, exist_ok=True)
            
            # Check if file already exists
            if destination.exists():
                file_size = destination.stat().st_size
                if file_size > 0:  # Only skip if file has content
                    print(f"✅ {description} already exists at {destination} ({file_size/1024/1024:.2f} MB)")
                    return True
                else:
                    print(f"⚠️  Found empty file at {destination}, re-downloading...")
                    destination.unlink()
            
            print(f"\n⬇️  {description} (Attempt {attempt + 1}/{max_retries})"
                  f"\n   From: {url}"
                  f"\n   To:   {destination}")
            
            # Use gdown for Google Drive links
            if 'drive.google.com' in url or 'docs.google.com' in url:
                return gdown.download(url, str(destination), quiet=False) is not None
            
            # Handle Dropbox direct download links
            if 'dropbox.com' in url and '?dl=0' in url:
                url = url.replace('?dl=0', '?dl=1')
            
            # Use requests with streaming for better reliability
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
            
            with requests.get(url, stream=True, headers=headers, timeout=30) as response:
                response.raise_for_status()
                
                # Get file size for progress bar
                total_size = int(response.headers.get('content-length', 0))
                if total_size == 0:
                    print("⚠️  Could not determine file size, downloading anyway...")
                
                # Initialize progress bar
                progress_bar = tqdm(
                    total=total_size, 
                    unit='iB', 
                    unit_scale=True,
                    unit_divisor=1024,
                    desc=f"Downloading {destination.name}",
                    ncols=100
                )
                
                # Download in chunks
                with open(destination, 'wb') as f:
                    for chunk in response.iter_content(chunk_size=8192):
                        if chunk:  # filter out keep-alive chunks
                            f.write(chunk)
                            progress_bar.update(len(chunk))
                
                progress_bar.close()
                
                # Verify download
                if destination.exists() and destination.stat().st_size > 0:
                    print(f"✅ Successfully downloaded to {destination} ({destination.stat().st_size/1024/1024:.2f} MB)")
                    return True
                else:
                    raise Exception("Downloaded file is empty or missing")
        
        except Exception as e:
            print(f"❌ Attempt {attempt + 1} failed: {str(e)}")
            if destination.exists():
                try:
                    destination.unlink()  # Remove corrupted download
                except:
                    pass
            
            if attempt < max_retries - 1:
                wait_time = 2 ** attempt  # Exponential backoff
                print(f"⏳ Retrying in {wait_time} seconds...")
                time.sleep(wait_time)
            else:
                print(f"❌ Failed to download after {max_retries} attempts")
                return False
    
    return False

def setup_environment() -> bool:
    """Set up Python environment and install dependencies."""
    print("\n1️⃣ Setting up Python environment...")
    
    # Create virtual environment if it doesn't exist
    venv_path = Path("E:/i.mobilothon 5.0/edgefleet-prototype/venv")
    if not venv_path.exists():
        print("Creating Python virtual environment...")
        return_code = run_command('"' + sys.executable + '" -m venv "' + str(venv_path) + '"')
        if return_code != 0:
            print("❌ Failed to create virtual environment.")
            return False
    
    # Install dependencies
    print("\n2️⃣ Installing Python dependencies...")
    requirements_path = Path("E:/i.mobilothon 5.0/edgefleet-prototype/ml/requirements.txt")
    python_exec = str(venv_path / 'Scripts' / 'python.exe')
    pip_cmd = f'"{python_exec}" -m pip install -r "{requirements_path}"'
    
    return_code = run_command(pip_cmd)
    if return_code != 0:
        print("❌ Failed to install dependencies. Please check your Python environment.")
        return False
    
    return True

def download_models() -> Dict[str, bool]:
    """Download all required pre-trained models with reliable sources and better error handling."""
    print("\n3️⃣ Downloading pre-trained models...")
    
    # Use absolute path with proper escaping for Windows
    models_dir = Path("E:/i.mobilothon 5.0/edgefleet-prototype/ml/saved_models")
    models_dir.mkdir(parents=True, exist_ok=True)
    
    # Model URLs and destinations with more reliable sources
    model_urls = {
        # Object Detection - Using direct download links from Ultralytics
        'yolov8n': 'https://github.com/ultralytics/assets/releases/download/v0.0.0/yolov8n.pt',
        'yolov8x': 'https://github.com/ultralytics/assets/releases/download/v0.0.0/yolov8x.pt',
        'yolov8x6': 'https://github.com/ultralytics/assets/releases/download/v0.0.0/yolov8x6.pt',
        
        # Updated DeepSORT and ByteTrack with more reliable sources
        'deepsort': 'https://github.com/mikel-brostrom/Yolov5_DeepSort_PyTorch/releases/download/v.2.0/deep_sort_pytorch.zip',
        'bytetrack': 'https://github.com/ifzhang/ByteTrack/releases/download/v0.1.0/pretrained/bytetrack_x_mot17.pth.tar',
        
        # Driver Monitoring - Using PyTorch Hub and alternative sources
        'slow_r50': 'https://dl.fbaipublicfiles.com/pytorchvideo/model_zoo/kinetics/SLOW_8x8_R50.pyth',
        'gaze360': 'https://www.dropbox.com/s/3t3kmqmgdrk7grf/gaze360_model.pth.tar?dl=1',
        'drowsiness': 'https://github.com/opencv/opencv/raw/4.x/samples/dnn/face_detector/opencv_face_detector.pbtxt',
        
        # Updated Emotion FER+ and Facial Landmarks with alternative sources
        'emotion_ferplus': 'https://github.com/onnx/models/raw/main/vision/body_analysis/emotion_ferplus/model/emotion-ferplus-8.onnx',
        'facial_landmarks': 'https://github.com/italojs/facial-landmarks-recognition/raw/master/model/shape_predictor_68_face_landmarks.dat',
        
        # Anomaly Detection - Using PyTorch Hub and direct downloads
        'resnet50': 'https://download.pytorch.org/models/resnet50-19c8e357.pth',
        'anomaly_autoencoder': 'https://www.dropbox.com/s/3t3kmqmgdrk7grf/autoencoder.pth?dl=1',
        'anomaly_gan': 'https://www.dropbox.com/s/3t3kmqmgdrk7grf/generator.pt?dl=1',
        
        # Traffic and License Plate - Using alternative sources
        'lprnet': 'https://www.dropbox.com/s/3t3kmqmgdrk7grf/Final_LPRNet_model.pth?dl=1',
        'traffic_sign_yolov5': 'https://github.com/ultralytics/yolov5/releases/download/v6.1/yolov5s.pt',
        
        # Pedestrian and Road - Using alternative sources
        'pedestrian_intent': 'https://www.dropbox.com/s/3t3kmqmgdrk7grf/social_pooling_model.pth?dl=1',
        'road_condition': 'https://www.dropbox.com/s/3t3kmqmgdrk7grf/road_condition_forecast.pth?dl=1',
        
        # Alternative sources for failed models with direct download links
        'deepsort_alt': 'https://github.com/mikel-brostrom/Yolov5_DeepSort_PyTorch/releases/download/v.2.0/deep_sort_pytorch.zip',
        'bytetrack_alt': 'https://github.com/ifzhang/ByteTrack/releases/download/v0.1.0/pretrained/bytetrack_x_mot17.pth.tar',
        'emotion_ferplus_alt': 'https://github.com/onnx/models/raw/main/vision/body_analysis/emotion_ferplus/model/emotion-ferplus-8.onnx',
        'facial_landmarks_alt': 'https://github.com/italojs/facial-landmarks-recognition/raw/master/model/shape_predictor_68_face_landmarks.dat.bz2',
        
        # Direct download links from alternative sources
        'emotion_ferplus_direct': 'https://github.com/onnx/models/raw/main/vision/body_analysis/emotion_ferplus/model/emotion-ferplus-8.onnx',
        'facial_landmarks_direct': 'https://github.com/italojs/facial-landmarks-recognition/raw/master/model/shape_predictor_68_face_landmarks.dat.bz2',
        'deepsort_direct': 'https://github.com/mikel-brostrom/Yolov5_DeepSort_PyTorch/releases/download/v.2.0/deep_sort_pytorch.zip',
        'bytetrack_direct': 'https://github.com/ifzhang/ByteTrack/releases/download/v0.1.0/pretrained/bytetrack_x_mot17.pth.tar'
    }
    
    results = {}
    
    # Download each model with proper file extensions
    model_extensions = {
        'yolov8n': '.pt',
        'yolov8x': '.pt',
        'yolov8x6': '.pt',
        'deepsort': '.pth',
        'bytetrack': '.pth',
        'slow_r50': '.pyth',
        'gaze360': '.pth.tar',
        'drowsiness': '.pb',
        'emotion_ferplus': '.onnx',
        'facial_landmarks': '.dat',
        'resnet50': '.pth',
        'anomaly_autoencoder': '.pth',
        'anomaly_gan': '.pt',
        'lprnet': '.pth',
        'traffic_sign_yolov5': '.pt',
        'pedestrian_intent': '.pth',
        'road_condition': '.pth'
    }
    
    # Download each model with proper file extension and fallback to alternative sources
    for name, url in model_urls.items():
        # Skip alternative sources for now, we'll handle them separately
        if name.endswith('_alt'):
            continue
            
        ext = model_extensions.get(name, Path(url).suffix)
        dest = models_dir / f"{name}{ext}"
        
        # Only attempt download if file doesn't exist or is empty
        if not dest.exists() or dest.stat().st_size == 0:
            print(f"\n📥 Downloading {name} model...")
            success = download_file(url, dest, f"Downloading {name} model")
            
            # If download failed, try alternative sources if available
            if not success and f"{name}_alt" in model_urls:
                # Try first alternative
                alt_url = model_urls[f"{name}_alt"]
                print(f"⚠️  Primary download failed, trying first alternative source...")
                success = download_file(alt_url, dest, f"Downloading {name} model (1st alternative)")
                
                # If still not successful, try direct download
                if not success and f"{name}_direct" in model_urls:
                    direct_url = model_urls[f"{name}_direct"]
                    print(f"⚠️  First alternative failed, trying direct download...")
                    success = download_file(direct_url, dest, f"Downloading {name} model (direct link)")
                    
                    # If still not successful, try one more time with a different source
                    if not success and name == 'facial_landmarks':
                        print("⚠️  Trying to download facial landmarks from dlib...")
                        success = download_file(
                            'http://dlib.net/files/shape_predictor_68_face_landmarks.dat.bz2',
                            dest,
                            "Downloading facial landmarks (dlib source)"
                        )
                
            results[name] = success
        else:
            file_size = dest.stat().st_size / (1024 * 1024)  # Convert to MB
            print(f"✅ {name} already exists at {dest} ({file_size:.2f} MB)")
            results[name] = True
        
        # Additional processing for specific models
        if name == 'deepsort' and results.get(name, False):
            # Download deepsort config
            cfg_urls = [
                'https://raw.githubusercontent.com/mikel-brostrom/Yolov5_DeepSort_PyTorch/master/deep_sort_pytorch/configs/deep_sort.yaml',
                'https://github.com/mikel-brostrom/Yolov5_DeepSort_PyTorch/raw/master/deep_sort_pytorch/configs/deep_sort.yaml'
            ]
            cfg_dest = models_dir / 'deepsort_config.yaml'
            if not cfg_dest.exists() or cfg_dest.stat().st_size == 0:
                for cfg_url in cfg_urls:
                    if download_file(cfg_url, cfg_dest, "Downloading DeepSORT config"):
                        break
                
        elif name == 'bytetrack' and results.get(name, False):
            # Download bytetrack config
            cfg_urls = [
                'https://raw.githubusercontent.com/ifzhang/ByteTrack/main/yolox/exp/yolox_x_ablation.py',
                'https://github.com/ifzhang/ByteTrack/raw/main/yolox/exp/yolox_x_ablation.py'
            ]
            cfg_dest = models_dir / 'bytetrack_config.py'
            if not cfg_dest.exists() or cfg_dest.stat().st_size == 0:
                for cfg_url in cfg_urls:
                    if download_file(cfg_url, cfg_dest, "Downloading ByteTrack config"):
                        break
                        
        # Special handling for facial landmarks .bz2 file
        if name == 'facial_landmarks' and results.get(name, False):
            bz2_path = dest
            if bz2_path.suffix == '.bz2':
                import bz2
                extracted_path = bz2_path.with_suffix('')  # Remove .bz2 extension
                if not extracted_path.exists():
                    try:
                        print(f"Extracting {bz2_path.name}...")
                        with bz2.open(bz2_path, 'rb') as f_in:
                            with open(extracted_path, 'wb') as f_out:
                                shutil.copyfileobj(f_in, f_out)
                        print(f"✅ Extracted to {extracted_path}")
                    except Exception as e:
                        print(f"❌ Failed to extract {bz2_path}: {e}")
                        results[name] = False
    
    return results

def test_models() -> bool:
    """Run tests on the downloaded models."""
    print("\n4️⃣ Running model tests...")
    
    # Create test directories if they don't exist
    test_dirs = ["test_images", "test_videos", "test_data"]
    for dir_name in test_dirs:
        dir_path = Path(f"E:/i.mobilothon 5.0/edgefleet-prototype/tests/{dir_name}")
        dir_path.mkdir(parents=True, exist_ok=True)
        
        # Add sample test files if directory is empty
        if not any(dir_path.iterdir()) and dir_name == "test_images":
            sample_img_url = "https://ultralytics.com/images/zidane.jpg"
            download_file(sample_img_url, dir_path / "test.jpg", "Downloading test image")
    
    # Add the project root to the Python path
    project_root = Path("E:/i.mobilothon 5.0/edgefleet-prototype")
    sys.path.append(str(project_root))
    
    # Run the test script
    test_script = project_root / "test_models.py"
    if not test_script.exists():
        print("❌ Test script not found!")
        return False
    
    python_exec = str(project_root / "venv" / "Scripts" / "python.exe")
    return_code = run_command(f'"{python_exec}" "{test_script}"')
    
    if return_code == 0:
        print("\n✅ All models tested successfully!")
        return True
    else:
        print("\n❌ Some tests failed. Please check the output above for details.")
        return False

def main():
    print("""
    ===========================================
    🚀 EdgeFleet AI - Model Setup & Installation
    ===========================================
    This script will:
    1. Set up Python environment
    2. Install required dependencies
    3. Download pre-trained models
    4. Run model tests
    ===========================================
    """)
    
    start_time = time.time()
    
    try:
        # Setup environment and install dependencies
        if not setup_environment():
            sys.exit(1)
        
        # Download models
        download_results = download_models()
        failed_downloads = [name for name, success in download_results.items() if not success]
        
        if failed_downloads:
            print(f"\n⚠️ Failed to download the following models: {', '.join(failed_downloads)}")
            print("Some features may not work as expected.")
        
        # Test models
        test_success = test_models()
        
        # Print summary
        print("\n" + "="*50)
        print("📋 Setup Summary")
        print("="*50)
        print(f"✅ Environment: {'Success' if 'setup_environment' in locals() else 'Failed'}")
        print(f"✅ Models Downloaded: {sum(download_results.values())}/{len(download_results)}")
        print(f"✅ Tests: {'Passed' if test_success else 'Failed'}")
        print(f"\n⏱️  Total setup time: {time.time() - start_time:.2f} seconds")
        
        if test_success:
            print("\n🎉 Setup completed successfully!")
            print("\nTo activate the virtual environment, run:")
            print("  .\\venv\\Scripts\\activate")
            print("\nThen you can run the test script with:")
            print("  python test_models.py")
        else:
            print("\n⚠️ Setup completed with some errors. Please check the output above.")
            
    except KeyboardInterrupt:
        print("\n\n⚠️ Setup was interrupted by user.")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ An unexpected error occurred: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    # Set console output to UTF-8 encoding
    if sys.platform == 'win32':
        import io
        import sys
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    
    main()
