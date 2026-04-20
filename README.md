# Interactive Globe-based Land Use Classification

A full-stack system that allows users to interact with a 3D globe (CesiumJS), click any location, fetch satellite images, perform CNN-based land cover classification, and detect land-use changes over time.

## Project Structure

- `frontend/`: Contains the CesiumJS web UI and Chart.js dashboards.
- `backend/`: Contains the Flask API serving the frontend and interfacing with models/APIs.
- `model/`: The CNN Transfer Learning scripts (MobileNetV2 based on EuroSAT).
- `data/`: Dataset download scripts and mocked realistic image patches.

## Setup Instructions

1. **Python Environment**:
    ```bash
    cd project
    python -m venv venv
    venv\Scripts\activate  # Windows
    # source venv/bin/activate # Mac/Linux
    pip install -r requirements.txt
    ```

2. **Model Setup**:
    We provide a pre-trained model for the 5-class Earth observation task (Forest, Urban, Agriculture, Water, Barren). If you wish to retrain it, run:
    ```bash
    cd project/model
    python train.py
    ```

3. **Running the Application**:
    Start the Backend (Flask):
    ```bash
    cd project/backend
    python app.py
    ```
    The API runs at `http://localhost:5000`.

    Start the Frontend:
    Since the frontend uses ES6 modules (CesiumJS), it needs a local server to avoid CORS issues:
    ```bash
    cd project/frontend
    python -m http.server 8000
    ```
    Open your browser to `http://localhost:8000`.

## Features
- **3D Globe Interface:** Interactive CesiumJS rendering.
- **CNN Classification:** A MobileNetV2 architecture fine-tuned on EuroSAT patches.
- **Multi-temporal Analysis:** Analyzes a region at two different time points (2015 vs 2025) and outputs classification percentage and change.

## Research Extension
**Base Paper Implementation (CNN + Change detection):**  
Standard satellite image analysis involves passing static RGB or Multispectral datasets (like EuroSAT) through a deep CNN (often ResNet or MobileNet) to classify land patches. Change detection introduces a temporal dimension, comparing inferences of $T_1$ and $T_2$ to isolate class transitions (e.g., Forest -> Urban deforestation).

**Our Contribution:**  
"Interactive globe + real-time satellite analysis + visualization"  
Instead of static batch processing, we deployed the model behind an interactive API driven by real-world geographic coordinate clicks. Using a 3D CesiumJS globe, users can select any location dynamically. Our system orchestrates fetching historical and modern imagery for that dynamic patch, chunking the image, running batched inference, scaling area distributions, and driving graphical pie charts on a web dashboard in real-time. This provides an intuitive, explorable GIS tool for non-technical users.
