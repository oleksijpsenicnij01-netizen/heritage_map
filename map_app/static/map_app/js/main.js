let geoJsonLayer; 
let currentMarkers = L.markerClusterGroup(); 
let resetControlInstance = null;
let selectedLayer = null; 
let mapStateBeforeMarkerZoom = null; 
let activeDetailsMarker = null;

const detailsPanel = document.getElementById('details-panel');

let galleryState = {
  regionKey: null,
  monumentId: null,
  images: [],  
  index: 0
};
window.clearUIState = function () {
  const panel = document.getElementById('details-panel');

  if (panel) {
    panel.style.display = "none";
    panel.innerHTML = "";
  }

  if (activeDetailsMarker) {
    activeDetailsMarker.isZoomed = false;
    activeDetailsMarker = null;
  }
};

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function fetchApprovedImages(regionKey, monumentId) {
  const url =
    `/api/monuments/images/?region=${encodeURIComponent(regionKey)}&monument_id=${encodeURIComponent(monumentId)}`;

  const r = await fetch(url, { credentials: "same-origin" });
  const data = await r.json();

  if (!data.ok) return [];

  return (data.images || []).map(x => x.url).filter(Boolean);
}

function renderGalleryImage() {
  const img = document.getElementById("monument-main-img");
  if (!img) return;

  const list = galleryState.images || [];
  if (!list.length) return;

  img.src = list[galleryState.index];

  const counter = document.getElementById("monument-img-counter");
  if (counter) counter.textContent = `${galleryState.index + 1} / ${list.length}`;
}

window.galleryPrev = function () {
  const list = galleryState.images || [];
  if (!list.length) return;
  galleryState.index = (galleryState.index - 1 + list.length) % list.length;
  renderGalleryImage();
};

window.galleryNext = function () {
  const list = galleryState.images || [];
  if (!list.length) return;
  galleryState.index = (galleryState.index + 1) % list.length;
  renderGalleryImage();
};

const CustomIcon = L.Icon.extend({
    options: {
        iconUrl: '/static/map_app/leaflet/images/marker-icon.png',
        iconRetinaUrl: '/static/map_app/leaflet/images/marker-icon-2x.png',
        shadowUrl: '/static/map_app/leaflet/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    }
});
const defaultMarkerIcon = new CustomIcon(); 

const initialCenter = [48.3794, 31.1656];

const isMobile = window.innerWidth <= 768;
const initialZoom = isMobile ? 5 : 6;


window.map = L.map('map', {
  zoomControl: false,
  maxZoom: 18,
  minZoom: 5
}).setView(initialCenter, initialZoom);



window.map.createPane('tiles-pane').style.zIndex = 200; 
window.map.createPane('geojson-pane').style.zIndex = 600; 
window.map.createPane('marker-pane').style.zIndex = 700; 


const googleHybridLayer = L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
    maxZoom: 20,
    attribution: 'Map data ©2024 Google',
    pane: 'tiles-pane' 
}).addTo(window.map);

currentMarkers = L.markerClusterGroup({ 
    pane: 'marker-pane' 
});
currentMarkers.addTo(window.map);

window.map.on('zoomend', function() {
    currentMarkers.eachLayer(function(marker) {
        if (window.map.getZoom() < 14) {
            marker.isZoomed = false;
        }
    });
});

let userMonuments = [];

async function loadUserMonuments(regionKey) {
  try {
    const r = await fetch(`/api/monuments/?region=${encodeURIComponent(regionKey)}`, { credentials: "same-origin" });
    const data = await r.json();
    if (data && data.ok && Array.isArray(data.monuments)) {
      userMonuments = data.monuments;
    } else {
      userMonuments = [];
    }
  } catch (e) {
    userMonuments = [];
  }
}






function style(feature) {
    return { 
        fillColor: '#1a1a1a', 
        weight: 1.5, 
        opacity: 1, 
        color: 'white', 
        fillOpacity: 1.0 
    };
}

function highlightFeature(e) {
    const layer = e.target;

    if (layer !== selectedLayer) {
        layer.setStyle({ 
            weight: 5, 
            color: 'white', 
            dashArray: '', 
            fillOpacity: layer.options.fillOpacity 
        });
        if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) { layer.bringToFront(); }
    }
    

    if (!selectedLayer) { 
        let regionName = 
            layer.feature.properties['name:uk'] || 
            layer.feature.properties.uk || 
            layer.feature.properties.NAME_UKR ||
            layer.feature.properties.name || 
            'Область';

        layer.bindTooltip(regionName, {
            permanent: false, 
            direction: 'center',
            className: 'region-tooltip'
        }).openTooltip();
    }
}

function resetHighlight(e) {
    if (geoJsonLayer && e.target !== selectedLayer) { 
        geoJsonLayer.resetStyle(e.target); 
    }

    e.target.closeTooltip();
    e.target.unbindTooltip(); 
}


function zoomToFeature(e) {
    const layer = e.target;
    
   
    if (selectedLayer && selectedLayer !== layer) {
        geoJsonLayer.resetStyle(selectedLayer);
        
    
        const prevLayerElement = selectedLayer.getElement();
        if (prevLayerElement) {
             L.DomUtil.removeClass(prevLayerElement, 'no-pointer');
             prevLayerElement.style.outline = '';
        }
        selectedLayer._path.style.pointerEvents = 'auto'; 
        
        selectedLayer.on('click', zoomToFeature);
        currentMarkers.clearLayers(); 
    }
    

    layer.setStyle({ 
        weight: 6, 
        color: 'white', 
        dashArray: '', 
        fillOpacity: 0.0
    });
    

    mapStateBeforeMarkerZoom = layer.getBounds().pad(0.05);
    

    const layerElement = layer.getElement();
    if (layerElement) {
        L.DomUtil.addClass(layerElement, 'no-pointer'); 
        layerElement.style.outline = 'none'; 
    }
    
    layer._path.style.pointerEvents = 'none';
    
    layer.bringToFront(); 
    selectedLayer = layer; 
    

    layer.off('click', zoomToFeature); 
    

    let regionName = 
        layer.feature.properties['name:uk'] || 
        layer.feature.properties.uk || 
        layer.feature.properties.NAME_UKR ||
        layer.feature.properties.name; 
    
    const regionNameLower = regionName ? regionName.toLowerCase() : '';


    const isZhytomyr = regionName && (regionNameLower.includes('житомирська'));
    
const regionMap = {
  "житомирська": "zhytomyr",
  "львівська": "lviv",
  "київська": "kyiv",
  "одеська": "odesa",
  "харківська": "kharkiv",
  "дніпропетровська": "dnipro",
  "закарпатська": "zakarpattia",
  "івано-франківська": "ivano-frankivsk",
  "черкаська": "cherkasy",
  "чернігівська": "chernihiv",
  "чернівецька": "chernivtsi",
  "хмельницька": "khmelnytskyi",
  "тернопільська": "ternopil",
  "рівненська": "rivne",
  "волинська": "volyn",
  "сумська": "sumy",
  "полтавська": "poltava",
  "миколаївська": "mykolaiv",
  "кіровоградська": "kyrovohrad",
  "луганська": "luhansk",
  "донецька": "donetsk",
  "херсонська": "kherson",
  "запорізька": "zaporizhzhia",
  "вінницька": "vinnytsia",
  "крим": "crimea"
};

const matchedRegion = Object.keys(regionMap).find(key => regionNameLower.includes(key));

if (matchedRegion) {
  const regionKey = regionMap[matchedRegion];

  galleryState.regionKey = regionKey; 

  loadUserMonuments(regionKey).then(() => {
    addMarkers(userMonuments);
  });
} else {
  currentMarkers.clearLayers();
}



let padValue = 0.05;

if (matchedRegion === 'київська') padValue = 0.01;
if (matchedRegion === 'одеська') padValue = -0.01;
if (matchedRegion === 'сумська') padValue = isMobile ? -0.2 : -0.6;
if (matchedRegion === 'дніпропетровська') padValue = isMobile ? 0.02 : 0.05;
if (matchedRegion === 'кіровоградська') padValue = isMobile ? 0.02 : 0.05;

window.map.flyToBounds(layer.getBounds().pad(padValue), {
  duration: 0.5,
  padding: isMobile ? L.point(5, 5) : L.point(10, 10)
});

    

    if (!resetControlInstance) {
        resetControlInstance = new ResetControl({ position: 'topleft' }); 
        resetControlInstance.addTo(window.map); 
    }

    if (detailsPanel) detailsPanel.style.display = 'none';
}



function onEachFeature(feature, layer) {
    layer.on({
        mouseover: highlightFeature, 
        mouseout: resetHighlight, 
        click: zoomToFeature 
    });
}


function addMarkers(monumentsArray) {
    currentMarkers.clearLayers(); 
    monumentsArray.forEach(monument => {
  if (typeof monument.id !== "number") return;
       const lat = parseFloat(monument.lat);
const lng = parseFloat(monument.lng);

if (isNaN(lat) || isNaN(lng)) return;

const marker = L.marker([lat, lng], { icon: defaultMarkerIcon });

currentMarkers.addLayer(marker);

if (monument.name) {
    marker.bindTooltip(monument.name, {
        permanent: false,
        direction: 'top',
        offset: [0, -40],
        className: 'marker-tooltip'
    });
}
        
        marker.isZoomed = false; 


        marker.on('click', function(e) { 
            const clickedMarker = e.target;
            
            if (!clickedMarker.isZoomed) {
           
const desiredZoomLevel = 15;
const currentZoom = window.map.getZoom();

if (currentZoom < desiredZoomLevel) {
    window.map.flyTo(clickedMarker.getLatLng(), desiredZoomLevel, { 
        duration: 0.5 
    });
} else {

    activeDetailsMarker = clickedMarker;
    displayDetails(monument);
    return;
}
                clickedMarker.isZoomed = true;
                
} else {
    activeDetailsMarker = clickedMarker;
    displayDetails(monument); 
    clickedMarker.isZoomed = false;
}

        });
window.closeDetailsPanel = function () {
  if (detailsPanel) detailsPanel.style.display = "none";

  if (activeDetailsMarker) {
    activeDetailsMarker.isZoomed = true;
    activeDetailsMarker = null;
  }
};



       

    });

}


async function displayDetails(monument) {
  if (!detailsPanel) return;

  const regionKey = galleryState.regionKey || "zhytomyr";


  const baseUrl = monument.imagePath ? String(monument.imagePath) : "";
  const baseAlt = monument.imageAlt ? String(monument.imageAlt) : monument.name;


let approved = [];

if (monument.id) {
  try {
    approved = await fetchApprovedImages(regionKey, monument.id);
  } catch (e) {
    approved = [];
  }
}

  const urls = [];
  if (baseUrl) urls.push(baseUrl);

  for (const u of approved) {
    if (!u) continue;
    if (!urls.includes(u)) urls.push(u);
  }


  galleryState.regionKey = regionKey;
  galleryState.monumentId = monument.id;
  galleryState.images = urls;
  galleryState.index = 0;


  const hasImages = urls.length > 0;

  const imageBlock = hasImages
    ? `
      <div class="monument-slider">
        <button class="monument-slider-btn" type="button" onclick="window.galleryPrev()">‹</button>

        <a id="monument-img-link" href="${escapeHtml(urls[0])}" target="_blank" title="Відкрити фото">
          <img id="monument-main-img" src="${escapeHtml(urls[0])}" alt="${escapeHtml(baseAlt)}">
        </a>

        <button class="monument-slider-btn" type="button" onclick="window.galleryNext()">›</button>
      </div>
      <div class="monument-slider-meta">
        <span id="monument-img-counter">${urls.length ? "1 / " + urls.length : ""}</span>
        ${approved.length ? `<span class="monument-user-photos-note">є фото від користувачів ✅</span>` : ""}
      </div>
    `
    : "";

detailsPanel.innerHTML = `
    <button class="details-close" type="button" onclick="window.closeDetailsPanel()">✕</button>
    <h2>${escapeHtml(monument.name)}</h2>
    ${imageBlock}
    ${monument.details}
    <button onclick="window.zoomBackToRegion()">Назад на область</button>
  `;


  detailsPanel.style.display = "flex";


  const link = document.getElementById("monument-img-link");
  const img = document.getElementById("monument-main-img");
  if (link && img) {
    const obs = new MutationObserver(() => {
      link.href = img.src;
    });
    obs.observe(img, { attributes: true, attributeFilter: ["src"] });
  }
}



window.zoomBackToRegion = function() {
    if (detailsPanel) detailsPanel.style.display = 'none';

    if (mapStateBeforeMarkerZoom) {

        window.map.flyToBounds(mapStateBeforeMarkerZoom, { 
            duration: 0.5
        });
        

        currentMarkers.eachLayer(function(marker) {
            marker.isZoomed = false;
        });
        
    } else if (selectedLayer) {

        window.map.flyToBounds(selectedLayer.getBounds().pad(0.05), { 
            duration: 0.5
        });
    }
}



const ResetControl = L.Control.extend({
    options: { position: 'topleft' }, 
    onAdd: function (map) {
        const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom');
        container.style.backgroundColor = 'white';
        container.style.width = '70px'; 
        container.style.height = '30px';
        container.style.lineHeight = '30px';
        container.style.textAlign = 'center';
        container.style.cursor = 'pointer';
        

        container.style.marginLeft = '50px'; 
        container.style.marginTop = '18px'; 

        container.innerHTML = 'Назад'; 

        container.onclick = function(){

            window.map.flyToBounds(L.latLngBounds(initialCenter, initialCenter).pad(2), { 
                maxZoom: initialZoom,
                duration: 0.5 
            });
            currentMarkers.clearLayers();
            if (detailsPanel) detailsPanel.style.display = 'none';

            if (selectedLayer) {

                geoJsonLayer.resetStyle(selectedLayer);
                

                const layerElement = selectedLayer.getElement();
                if (layerElement) {

                    L.DomUtil.removeClass(layerElement, 'no-pointer');
                    

                    if (layerElement.blur) {
                        layerElement.blur(); 
                    } else if (layerElement.parentNode && layerElement.parentNode.blur) {
                        layerElement.parentNode.blur();
                    }
                    
                    layerElement.style.outline = '';

                }
                selectedLayer._path.style.pointerEvents = 'auto'; 
                
                

                selectedLayer.on('click', zoomToFeature);

                selectedLayer = null; 
            }
            

            if (resetControlInstance) {
                window.map.removeControl(resetControlInstance); 
                resetControlInstance = null;
            }
            mapStateBeforeMarkerZoom = null; 
            

            currentMarkers.eachLayer(function(marker) {
                marker.isZoomed = false;
            });
        }
        return container;
    }
});




/**
 * 
 * @param {string} mode 
 */
window.toggleMapMode = function(mode) {
    if (mode === 'quiz') {
 
        window.map.dragging.disable(); 
        window.map.touchZoom.disable(); 
        window.map.doubleClickZoom.disable(); 
        window.map.scrollWheelZoom.disable(); 
        window.map.boxZoom.disable(); 
        window.map.keyboard.disable(); 
        if (window.map.tap) window.map.tap.disable(); 

      
        if (mapStateBeforeMarkerZoom) {
             window.map.flyToBounds(mapStateBeforeMarkerZoom, { 
                 duration: 0.5,
                 padding: L.point(10, 10)
             });
        }
        
     
        if (selectedLayer) {
            selectedLayer.setStyle({ 
                weight: 6,      
                color: 'white', 
                fillOpacity: 0.0 
            });
            selectedLayer.bringToFront();
            
           
            const layerElement = selectedLayer.getElement();
            if (layerElement) {
                 L.DomUtil.removeClass(layerElement, 'no-pointer'); 
                 layerElement.style.outline = '';
            }
        }
        
   
        if (resetControlInstance) {
             window.map.removeControl(resetControlInstance); 
             resetControlInstance = null;
        }


    } else if (mode === 'main') {
   
        window.map.dragging.enable(); 
        window.map.touchZoom.enable(); 
        window.map.doubleClickZoom.enable(); 
        window.map.scrollWheelZoom.enable(); 
        window.map.boxZoom.enable(); 
        window.map.keyboard.enable(); 
        if (window.map.tap) window.map.tap.enable(); 
        
       
        window.zoomBackToRegion();
        
        
        if (selectedLayer && mapStateBeforeMarkerZoom) {
           
addMarkers(userMonuments);

             
             if (!resetControlInstance) {
                 resetControlInstance = new ResetControl({ position: 'topleft' }); 
                 resetControlInstance.addTo(window.map); 
             }
        } else {
             
             currentMarkers.clearLayers();
        }
        
       
        if (selectedLayer) {
             selectedLayer.setStyle({ 
                 weight: 6, 
                 color: 'white', 
                 dashArray: '', 
                 fillOpacity: 0.0
             });
        }
    }
};


const geoJsonPath = '/static/map_app/js/ukraine_regions.json/UA_FULL_Ukraine.geojson'; 

fetch(geoJsonPath)
    .then(response => {
        if (!response.ok) {
            console.error(`Помилка завантаження GeoJSON: Статус ${response.status}`);
            throw new Error(`Помилка завантаження GeoJSON: Статус ${response.status} (файл: ${geoJsonPath})`);
        }
        return response.json();
    })
    .then(data => {
        geoJsonLayer = L.geoJson(data, {
            style: style,
            onEachFeature: onEachFeature,
            pane: 'geojson-pane' 
        }).addTo(window.map); 
        
        console.log('Карта регіонів успішно завантажена та відображена.');
    })
    .catch(error => {
        console.error('Критична помибка завантаження GeoJSON або ініціалізації карти:', error);
    });



L.control.zoom({
    position:'topleft' 
}).addTo(window.map);



