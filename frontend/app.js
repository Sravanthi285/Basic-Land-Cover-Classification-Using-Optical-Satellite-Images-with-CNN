// Globals
let distributionChart = null;

// DOM Elements
const coordStatus = document.getElementById('coord-status');
const coordValues = document.getElementById('coord-values');
const areaName = document.getElementById('area-name');
const loadingIndicator = document.getElementById('loading-indicator');
const resultsPanel = document.getElementById('results-panel');
const imgBefore = document.getElementById('img-before');
const imgAfter = document.getElementById('img-after');
const changeText = document.getElementById('change-text');
const changeSubtext = document.getElementById('change-subtext');

// Handle coordinates selected from CesiumJS
window.handleLocationSelected = async function(lat, lon) {
    // Update UI
    coordStatus.textContent = "Analyzing...";
    coordStatus.className = "text-sm font-medium text-amber-400";
    coordValues.textContent = `Lat: ${lat.toFixed(6)}, Lon: ${lon.toFixed(6)}`;
    areaName.textContent = "Locating via Satellite...";
    
    // Prepare scanning & Show Loading
    loadingIndicator.classList.remove('hidden');
    resultsPanel.classList.remove('hidden');
    resultsPanel.classList.add('flex');
    imgBefore.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='256' height='256'%3E%3Crect width='100%25' height='100%25' fill='%231e293b'/%3E%3C/svg%3E";
    imgAfter.src = imgBefore.src;
    document.getElementById('scan-1').classList.remove('hidden');
    document.getElementById('scan-2').classList.remove('hidden');
    changeText.innerHTML = "Processing Satellite Data...";
    changeSubtext.innerHTML = "";
    document.getElementById('confidence-text').classList.add('hidden');
    const ndviEl = document.getElementById('ndvi-text');
    if (ndviEl) ndviEl.classList.add('hidden');

    // Make API Calls
    try {
        let isOcean = false;
        // 1. Await Reverse Geocode (Nominatim OpenStreetMap) to check if Ocean
        try {
            const geoResp = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
            const geo = await geoResp.json();
            if (geo && geo.display_name) {
                const parts = geo.display_name.split(',');
                areaName.textContent = parts.slice(0, 3).join(', ');
                // Flag as ocean if it's a natural waterbody
                if (geo.class === 'natural' && (geo.type === 'water' || geo.type === 'bay' || geo.type === 'strait')) {
                    isOcean = true;
                }
            } else if (geo && geo.error) {
                areaName.textContent = "Ocean / Unnamed Waterbody";
                isOcean = true;
            }
        } catch (e) {
            areaName.textContent = "Location Unknown";
        }

        // 2. Backend classification call (Pass isOcean flag and real data mode)
        const useRealData = document.getElementById('data-mode-toggle') ? document.getElementById('data-mode-toggle').checked : false;
        const response = await fetch('http://localhost:5000/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lat: lat, lon: lon, is_ocean: isOcean, use_real_data: useRealData })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to analyze region');
        }

        renderResults(data);
        
        coordStatus.textContent = "Success";
        coordStatus.className = "text-sm font-medium text-emerald-400";
        
    } catch (error) {
        console.error("API Error:", error);
        coordStatus.textContent = "Error occurred";
        coordStatus.className = "text-sm font-medium text-red-400";
        alert("Failed to analyze region: " + error.message);
    } finally {
        loadingIndicator.classList.add('hidden');
    }
};

function renderResults(data) {
    // Hide laser scanning layers
    document.getElementById('scan-1').classList.add('hidden');
    document.getElementById('scan-2').classList.add('hidden');
    
    // Reveal results panel

    // Set images
    // data.image_before and data.image_after should be base64 strings
    if (data.image_before) imgBefore.src = `data:image/jpeg;base64,${data.image_before}`;
    if (data.image_after) imgAfter.src = `data:image/jpeg;base64,${data.image_after}`;

    // Set change text
    changeText.innerHTML = data.change || "No significant change";
    changeSubtext.innerHTML = data.summary || "Area distribution is stable.";

    // Render confidence score
    const confEl = document.getElementById('confidence-text');
    if (confEl && data.confidence) {
        confEl.classList.remove('hidden');
        confEl.innerHTML = `🛡️ CNN Confidence: ${(data.confidence * 100).toFixed(1)}%`;
        confEl.className = "text-xs font-bold text-emerald-400 bg-slate-700/50 border border-slate-600/50 p-2 rounded inline-block";
    }

    // Render NDVI Math Metric
    const ndviEl = document.getElementById('ndvi-text');
    if (ndviEl && data.ndvi_before !== undefined) {
        ndviEl.classList.remove('hidden');
        let diff = data.ndvi_after - data.ndvi_before;
        let trend = diff >= 0 ? '↗' : '↘';
        ndviEl.innerHTML = `🍃 NDVI: ${data.ndvi_after.toFixed(2)} (${trend} ${diff.toFixed(2)})`;
        
        if (diff < 0) {
            ndviEl.className = "text-xs font-bold text-rose-400 bg-rose-900/30 border border-rose-500/30 p-2 rounded inline-block";
        } else {
            ndviEl.className = "text-xs font-bold text-emerald-400 bg-emerald-900/30 border border-emerald-500/30 p-2 rounded inline-block";
        }
    }

    // Render Charts
    renderChart(data.before, data.after);
}

function renderChart(beforeData, afterData) {
    const ctx = document.getElementById('distributionChart').getContext('2d');
    
    // Re-create chart if exists
    if (distributionChart) {
        distributionChart.destroy();
    }

    const labels = Object.keys(beforeData);
    const beforeValues = labels.map(l => beforeData[l]);
    const afterValues = labels.map(l => afterData[l]);

    distributionChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: '2020 (%)',
                    data: beforeValues,
                    backgroundColor: 'rgba(99, 102, 241, 0.7)',
                    borderColor: 'rgba(99, 102, 241, 1)',
                    borderWidth: 1
                },
                {
                    label: '2025 (%)',
                    data: afterValues,
                    backgroundColor: 'rgba(14, 165, 233, 0.7)',
                    borderColor: 'rgba(14, 165, 233, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: { color: 'rgba(255, 255, 255, 0.7)' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                },
                x: {
                    ticks: { color: 'rgba(255, 255, 255, 0.7)' },
                    grid: { display: false }
                }
            },
            plugins: {
                legend: {
                    labels: { color: 'white' }
                }
            }
        }
    });
}

// PDF Report Generation (Bonus Feature)
window.downloadReport = function() {
    // Convert Chart.js graph to Base64 image
    const chartImg = distributionChart ? document.getElementById('distributionChart').toDataURL('image/png') : '';
    
    // Grab dynamically injected HTML content
    const confHtml = document.getElementById('confidence-text') ? document.getElementById('confidence-text').innerHTML : '';
    const ndviEl = document.getElementById('ndvi-text');
    const ndviHtml = (ndviEl && !ndviEl.classList.contains('hidden')) ? 
        `<div class="stat"><strong>Vegetation Health (NDVI)</strong><br>${ndviEl.innerHTML}</div>` : '';

    const printContent = `
        <html>
        <head>
            <title>FAANG-Grade Land Analysis Report</title>
            <style>
                body { font-family: 'Inter', -apple-system, sans-serif; background: #f8fafc; color: #0f172a; margin: 0; padding: 40px; }
                .report-container { max-width: 900px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1); }
                h1 { color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 15px; margin-top: 0; }
                p { line-height: 1.6; }
                .grid { display: flex; gap: 30px; margin-top: 30px; }
                .grid > div { flex: 1; display: flex; flex-direction: column; align-items: center; }
                img.sat-img { width: 100%; border-radius: 10px; border: 1px solid #cbd5e1; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
                .summary-box { background: #f1f5f9; padding: 25px; border-left: 5px solid #3b82f6; border-radius: 6px; margin: 25px 0; }
                .summary-box h2 { margin-top: 0; color: #1e40af; }
                .chart-box { margin-top: 40px; text-align: center; }
                .stats-grid { display: flex; gap: 15px; margin-top: 20px; }
                .stat { background: #e0f2fe; color: #0369a1; padding: 12px 18px; border-radius: 8px; font-size: 14px; flex: 1; border: 1px solid #bae6fd; }
                .footer { margin-top: 60px; text-align: center; color: #64748b; font-size: 13px; font-weight: 500; border-top: 1px solid #e2e8f0; padding-top: 20px; }
            </style>
        </head>
        <body>
            <div class="report-container">
                <h1>Enterprise Land Survey Report</h1>
                <p><strong>Target Region Assessed:</strong> ${areaName.textContent}</p>
                <p><strong>Geospatial Coordinates:</strong> ${coordValues.textContent}</p>
                
                <div class="summary-box">
                    <h2>${changeText.innerText}</h2>
                    <p>${changeSubtext.innerText}</p>
                    <div class="stats-grid">
                        <div class="stat"><strong>AI System Confidence</strong><br>${confHtml}</div>
                        ${ndviHtml}
                    </div>
                </div>

                <div class="grid">
                    <div>
                        <h3 style="color:#475569; font-size: 15px; text-transform: uppercase;">Past (2020) Reference</h3>
                        <img class="sat-img" src="${imgBefore.src}">
                    </div>
                    <div>
                        <h3 style="color:#475569; font-size: 15px; text-transform: uppercase;">Present (2025) Scan</h3>
                        <img class="sat-img" src="${imgAfter.src}">
                    </div>
                </div>

                <div class="chart-box">
                    <h3 style="color:#475569; font-size: 15px; text-transform: uppercase;">Area Distribution Matrix</h3>
                    <img src="${chartImg}" style="max-height: 380px; width: auto; margin-top:15px;">
                </div>

                <div class="footer">
                    <p>Automatically generated via Convolutional Neural Network AI Engine & Google Earth Engine APIs.</p>
                </div>
            </div>
            <script>
                // Delay print command to guarantee base64 images process natively into DOM
                setTimeout(() => { window.print(); setTimeout(window.close, 100); }, 800);
            </script>
        </body>
        </html>
    `;
    const printWindow = window.open('', '', 'height=800,width=1000');
    printWindow.document.write(printContent);
    printWindow.document.close();
};

// Search System (Geocoder)
document.getElementById('search-btn').addEventListener('click', performSearch);
document.getElementById('search-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') performSearch();
});

async function performSearch() {
    const query = document.getElementById('search-input').value;
    if (!query) return;
    
    coordStatus.textContent = "Searching...";
    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
        const data = await res.json();
        
        if (data && data.length > 0) {
            const lat = parseFloat(data[0].lat);
            const lon = parseFloat(data[0].lon);
            
            // Call the globally exposed flyToLocation function in cesium.js
            if (window.flyToLocation) {
                window.flyToLocation(lat, lon);
            }
            
            // Execute analysis for the new coordinates
            window.handleLocationSelected(lat, lon);
        } else {
            alert("Sorry, location not found!");
            coordStatus.textContent = "Search failed";
        }
    } catch (e) {
        alert("Search error: " + e.message);
    }
}
