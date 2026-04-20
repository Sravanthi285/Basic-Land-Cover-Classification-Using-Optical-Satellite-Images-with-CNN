// =====================================================================
// STEP 1: PASTE YOUR CESIUM ION API TOKEN HERE
// =====================================================================
const myCesiumToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJiYTY4ZWEyOS02M2ZiLTQ0MTItYTI5My00ZWZiNDg3N2ZmMjciLCJpZCI6NDA3MDQ0LCJpYXQiOjE3NzQwOTYwMDN9.gkgwyLNjeqXw-pta7CnH4sAQAw-QlrqtyI0uYN2YbIg"; // <-- Paste inside the quotes

if (myCesiumToken !== "") {
    Cesium.Ion.defaultAccessToken = myCesiumToken;
} else {
    Cesium.Ion.defaultAccessToken = '';
}

// Initialize Cesium Viewer
const viewerConfig = {
    baseLayerPicker: false,
    geocoder: false,
    animation: false,
    timeline: false,
    navigationHelpButton: false,
    homeButton: true,
    infoBox: true,
    sceneModePicker: false,
    selectionIndicator: true
};

// If no token is provided, fall back to OpenStreetMap so the app still works!
if (myCesiumToken === "") {
    viewerConfig.imageryProvider = new Cesium.UrlTemplateImageryProvider({
        url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
        credit: '© OpenStreetMap contributors'
    });
    viewerConfig.terrainProvider = new Cesium.EllipsoidTerrainProvider();
}

const viewer = new Cesium.Viewer('cesiumContainer', viewerConfig);

// Remove credit container to keep UI clean
const creditContainer = viewer.bottomContainer;
if (creditContainer) {
    creditContainer.style.display = 'none';
}

// Ensure the globe starts at a nice angle (e.g., looking at Europe)
viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(10.0, 50.0, 5000000.0)
});

// Create a pin builder
const pinBuilder = new Cesium.PinBuilder();
let currentEntity = null;

// Left-click event handler
const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);

handler.setInputAction(function (click) {
    // Pick the globe coordinates based on click
    const ray = viewer.camera.getPickRay(click.position);
    const earthPosition = viewer.scene.globe.pick(ray, viewer.scene);

    if (Cesium.defined(earthPosition)) {
        // Convert to Cartesian (lat, lon)
        const cartographic = Cesium.Cartographic.fromCartesian(earthPosition);
        const longitude = Cesium.Math.toDegrees(cartographic.longitude);
        const latitude = Cesium.Math.toDegrees(cartographic.latitude);

        // Remove previous marker
        if (currentEntity) {
            viewer.entities.remove(currentEntity);
        }

        // Add new marker
        currentEntity = viewer.entities.add({
            name: 'Selected Area',
            position: earthPosition,
            billboard: {
                image: pinBuilder.fromColor(Cesium.Color.RED, 48).toDataURL(),
                verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            }
        });

        // Trigger our global app logic
        if (window.handleLocationSelected) {
            window.handleLocationSelected(latitude, longitude);
        }
    }
}, Cesium.ScreenSpaceEventType.LEFT_CLICK);

// Export map flying to global window for Search UI
window.flyToLocation = function(lat, lon) {
    viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(lon, lat, 500000.0) // 500km altitude
    });
    isAutoRotating = false;
    
    // Add Marker
    if (currentEntity) viewer.entities.remove(currentEntity);
    currentEntity = viewer.entities.add({
        name: 'Searched Area',
        position: Cesium.Cartesian3.fromDegrees(lon, lat),
        billboard: {
            image: pinBuilder.fromColor(Cesium.Color.RED, 48).toDataURL(),
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        }
    });
};

// ==========================================
// AUTO-ROTATION & MANUAL PAN CONTROLS
// ==========================================
let isAutoRotating = true;

// Spin the globe automatically on every frame tick (360 effect)
viewer.clock.onTick.addEventListener(function() {
    if (isAutoRotating) {
        viewer.scene.camera.rotateLeft(0.001); // Adjust speed here
    }
});

// Stop auto-rotating if the user interacts manually so it doesn't fight them
viewer.scene.canvas.addEventListener('mousedown', () => isAutoRotating = false);
viewer.scene.canvas.addEventListener('wheel', () => isAutoRotating = false);
viewer.scene.canvas.addEventListener('touchstart', () => isAutoRotating = false);

// Wire up the Up/Down/Left/Right HTML buttons for easier globe navigation
const rotAmount = 0.15; // Set how far a button click rotates
document.getElementById('pan-up').addEventListener('click', () => { 
    viewer.scene.camera.rotateUp(rotAmount); 
    isAutoRotating = false; 
});
document.getElementById('pan-down').addEventListener('click', () => { 
    viewer.scene.camera.rotateDown(rotAmount); 
    isAutoRotating = false; 
});
document.getElementById('pan-left').addEventListener('click', () => { 
    viewer.scene.camera.rotateLeft(rotAmount); 
    isAutoRotating = false; 
});
document.getElementById('pan-right').addEventListener('click', () => { 
    viewer.scene.camera.rotateRight(rotAmount); 
    isAutoRotating = false; 
});
