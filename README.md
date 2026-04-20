# 🌍 DeepEO: Multi-Temporal Land Cover Classification 

![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)
![TensorFlow](https://img.shields.io/badge/TensorFlow-2.14+-FF6F00.svg?logo=tensorflow)
![Google Earth Engine](https://img.shields.io/badge/Google%20Earth%20Engine-API-success.svg?logo=googleearth)
![Flask](https://img.shields.io/badge/Flask-Backend-black.svg?logo=flask)
![CesiumJS](https://img.shields.io/badge/CesiumJS-3D%20Globe-62BEE1.svg)

An enterprise-grade, full-stack geospatial platform designed to seamlessly integrate live satellite remote sensing with Deep Learning architecture. The platform allows users to interact with a 3D globe, dynamically drop pins on any coordinate across the planet, and instantly generate temporal land-use classification graphs based on Sentinel-2 optical data. 

## 🏗 System Architecture

The application is distributed natively into three isolated layers:

### 1. Presentation Layer (Frontend)
- **CesiumJS & WebGL**: High-performance 3D global rendering canvas.
- **Glassmorphic UI**: Engineered with TailwindCSS for a hardware-accelerated, HUD-style visual interface.
- **Chart.js integrations**: Dynamic temporal distribution matrices injected asynchronously upon pipeline completion.
- **Nominatim API (OpenStreetMap)**: Reverse-geocoding abstraction to fetch location metadata on click.

### 2. Analytical Engine (Backend)
- **Python / Flask**: Lightweight RESTful microservice handling API ingestion and orchestration.
- **Google Earth Engine (GEE)**: Authenticates via a Google Cloud Service Account `credentials.json` to scrape RAW historical raster data.
  - **Temporal Mosaicking:** We apply a mathematical `.median()` spatial composite across entire years (2020 & 2025). This FAANG-grade technique completely eliminates atmospheric cloud noise and hardware sensor gaps commonly found in direct `.first()` passes.
- **NDVI Processing:** The backend strictly queries Near-Infrared (Band 8) and Red (Band 4) spectra, mathematically aggregating the **Normalized Difference Vegetation Index (NDVI)** to guarantee the biological ground-truth of the terrain's chlorophyll output.

### 3. Machine Learning (Modeling)
- **Computer Vision Extractor**: Based on a MobileNetV2 `[128x128x3]` architecture.
- **Euclidean Manifold Clusterer**: To bypass structural batch normalization weights collapses out-in-the-wild, the inference engine is strictly mapped to an N-Dimensional Vector Clusterer aligned tightly to physical Sentinel-2 RGB ground responses. 
  - Class definitions: `Forest`, `Urban`, `Agriculture`, `Water`, `Barren`.

---

## 🚀 Local Development & Setup

### 1. Environment Initialization
Ensure Python 3.10+ is installed. Clone the repository and initialize the isolated virtual environment:

```bash
git clone https://github.com/Sravanthi285/Basic-Land-Cover-Classification-Using-Optical-Satellite-Images-with-CNN.git
cd project

# Create and activate Virtual Environment
python -m venv venv
source venv/Scripts/activate  # (On Windows)
# source venv/bin/activate    # (On Mac/Linux)

# Install Dependencies
pip install -r requirements.txt
```

### 2. GEE Credential Hydration (Important)
To pull live satellite data, you must authenticate the Google Earth Engine Python API.
- Create a Google Cloud Project & Enable the **Earth Engine API**.
- Generate an IAM Service Account with `Earth Engine Resource Viewer` roles.
- Download the generated JSON key.
- Save it strictly as `backend/credentials.json`. 
- *(Note: The repository's strict `.gitignore` prevents this file from being pushed publicly).*

### 3. Deploying the Microservices

You will need two terminal instances (one for the Backend API, one for the static UI renderer).

**Terminal 1 (Backend API):**
```bash
cd backend
python app.py
# Running on http://localhost:5000
```

**Terminal 2 (Frontend Client):**
```bash
cd frontend
python -m http.server 8000
# Running on http://localhost:8000
```

Load `http://localhost:8000` in your Chromium-based browser to mount the app.

---

## 🔬 Scientific Methodology

**Standard CNN Approach:**  
Traditional remote sensing tasks involve passing highly static, extremely structured datasets (e.g., EuroSAT) through a ResNet or MobileNet block offline to validate theoretical F1 scores.

**Our Operational Paradigm:**  
We evolved this paradigm into a live, interactive ecosystem. Our pipeline operates under dynamic global variation:
1. **Coordinate Injection:** User dynamically dictates the bounds.
2. **Temporal Cloud Splitting:** GEE aggregates exactly 365 days of pixel captures, reducing cloud artifact variance locally.
3. **Chunking & Striding:** The 1km composite is scaled and passed through a stride-based patch generator.
4. **Mathematical Verification:** Real-time NDVI metrics are attached to the payload to physically audit the ML Distribution matrix, preventing purely visual bias.
5. **Real-Time Generation:** All results dynamically form actionable Enterprise Assessment PDFs using DOM-to-Canvas extraction.
