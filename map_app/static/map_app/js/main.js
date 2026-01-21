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
const initialZoom = 6; 


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


const monuments = [
    { name: "Пам'ятний знак на честь заснування Житомира", lat: 50.25343756567173, lng: 28.654433190482916, id: "zamkova_gora", imagePath: "/static/map_app/images/zamkova.jpg", imageAlt: "Замкова Гора, Житомир", details: `<p><strong>Замкова Гора</strong> — це історичне серце Житомира, місце, де, за легендами, у IX столітті засновник міста Житомир збудував перше укріплення. З пагорба відкривається чудовий вид на річки Тетерів та Кам'янка. Сьогодні тут розташований пам'ятний знак і це є популярне місце для відпочинку та огляду панорами міста.</p>` },
    { name: "Тригірський монастир", lat: 50.19851548576178, lng: 28.372788481551822, id: "tryhirsky_monastyr", imagePath: "/static/map_app/images/tryhirsky_monastyr.jpg", imageAlt: "Свято-Преображенський Тригірський чоловічий монастир", details: `<p><strong>Свято-Преображенський Тригірський чоловічий монастир</strong> є однією з найстаріших та наймальовничіших святинь Житомирщини, заснованою орієнтовно в XVI столітті. Розташований на високій кручі над річкою Тетерів, він вражає своєю величчю та розташуванням. Архітектура поєднує елементи бароко та класицизму.</p>` },
    { name: "Свято-Василівський Собор", lat: 51.32173265861692, lng: 28.797728260293624, id: "sv_vasylivskyi_ovruch", imagePath: "/static/map_app/images/ghg.jpg", imageAlt: "Свято-Василівський Собор в Овручі", details: `<p><strong>Свято-Василівський Собор в Овручі</strong> — унікальна пам'ятка давньоруської архітектури кінця XII століття, зведена за часів князя Рюрика Ростиславича. Собор є одним із небагатьох храмів того періоду, що збереглися до наших днів. Він був відновлений відомим архітектором Олексієм Щусєвим і є справжньою окрасою Овруча.</p>` },
    { name: "Бердичівський Кармелітський монастир", lat: 49.89782631539752, lng: 28.574566488926934, id: "berdychiv_monastyr", imagePath: "/static/map_app/images/berdychiv_monastyr.jpg", imageAlt: "Бердичівський Кармелітський монастир-фортеця", details: `<p><strong>Бердичівський Кармелітський монастир-фортеця</strong> — це потужний оборонний і духовний комплекс XVII-XVIII століть. Він є одним із найкраще збережених зразків барокової фортифікаційної архітектури в Україні та є важливим центром паломництва завдяки чудотворній іконі Матері Божої Бердичівської.</p>` },
    { name: "Руїни палацу Терещенків", lat: 50.205551741762655, lng: 28.412307537375778, id: "tereshchenko_denyshi", imagePath: "/static/map_app/images/tereshchenko_denyshi.jpg", imageAlt: "Руїни палацу Терещенків", details: `<p><strong>Палац Терещенків</strong> у селі Дениші — це величні руїни колишнього розкішного маєтку відомої династії меценатів Терещенків. Побудований у стилі модерн, палац розташований на високому березі річки Тетерів, його оточує мальовничий парк та скелі. Руїни створюють атмосферу таємничості та приваблюють туристів.</p>` },
    { name: "Поліський природний заповідник", lat: 51.54568598175297, lng: 28.100461600750393, id: "polissia_zapovidnyk", imagePath: "/static/map_app/images/polissia_zapovidnyk.jpg", imageAlt: "Поліський природний заповідник", details: `<p><strong>Поліський природний заповідник</strong> — одна з найбільших природоохоронних зон на території України, створена для збереження унікальних лісових, болотних та озерних екосистем українського Полісся. Тут мешкають рідкісні види тварин і рослин, а також розташовані історичні пам'ятки.</p>` },
    
    { name: "Палац Бержинських-Терещенків", lat: 50.01647450985383, lng: 29.023309381540617, id: "berzhynski_palace", imagePath: "/static/map_app/images/palace_berzhynski.jpg", imageAlt: "Палац Бержинських-Терещенків у с. Червоне", details: `<p><strong>Палац Бержинських-Терещенків</strong> — видатний зразок неоготичної архітектури у селі Червоне. Він належав спочатку родинам Бержинських, а потім Терещенкам. Палац відомий своєю архітектурою з баштами та мальовничим парком. На жаль, зараз він знаходиться у стані руїни, але зберігає свою велич.</p>` },
    { name: "Курган-могила учасників Коліївщини 1768 р.", lat: 50.08349247490191, lng: 28.725181795038896, id: "koliivshchyna_kurhan", imagePath: "/static/map_app/images/koliivshchyna_kurhan.jpg", imageAlt: "Курган-могила учасників Коліївщини", details: `<p><strong>Курган-могила</strong> — це пам'ятка на честь героїв селянсько-козацького повстання Коліївщини 1768 року. Вона є важливим символом боротьби українського народу за свою незалежність у XVIII столітті. Курган розташований на мальовничій височині та є місцем пам'яті.</p>` },
    { name: "Костел Різдва Пресвятої Діви Марії", lat: 50.31849528081428, lng: 29.06615262388855, id: "kostel_rudnya", imagePath: "/static/map_app/images/kostel_rudnya.jpg", imageAlt: "Костел Різдва Пресвятої Діви Марії у с. Рудня", details: `<p><strong>Костел Різдва Пресвятої Діви Марії</strong> — католицький храм, пам'ятка архітектури місцевого значення. Він поєднує елементи бароко та класицизму і є важливим елементом поліської архітектурної спадщини. Це діючий храм, який привертає увагу своєю незвичайною архітектурою.</p>` },

];
let userMonuments = [];

async function loadUserMonuments() {
  try {
    const regionKey = "zhytomyr";
    const r = await fetch(`/api/monuments/user/?region=${encodeURIComponent(regionKey)}`, { credentials: "same-origin" });
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

loadUserMonuments();




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
    
if (isZhytomyr) {
    loadUserMonuments("zhytomyr").then(() => {
        addMarkers(monuments.concat(userMonuments));
    });
} else {
    currentMarkers.clearLayers();
}


    window.map.flyToBounds(layer.getBounds().pad(0.05), { 
        duration: 0.5, 
        padding: L.point(10, 10) 
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
    const markers = []; 
    monumentsArray.forEach(monument => {
        const marker = L.marker([monument.lat, monument.lng], {icon: defaultMarkerIcon})
            .bindTooltip(monument.name, {
                permanent: false, 
                direction: 'top',
                offset: [0, -40], 
                className: 'marker-tooltip'
            }); 
        
        marker.isZoomed = false; 


        marker.on('click', function(e) { 
            const clickedMarker = e.target;
            
            if (!clickedMarker.isZoomed) {
           
                const desiredZoomLevel = 15;
                window.map.flyTo(clickedMarker.getLatLng(), desiredZoomLevel, { 
                    duration: 0.5 
                });
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



       
        window.map.on('zoomend', function() { 
            if (window.map.getZoom() < 14) { 
                marker.isZoomed = false;
            }
        });
        
        markers.push(marker);
    });
    currentMarkers.addLayers(markers);
}


async function displayDetails(monument) {
  if (!detailsPanel) return;

  const regionKey = "zhytomyr";


  const baseUrl = monument.imagePath ? String(monument.imagePath) : "";
  const baseAlt = monument.imageAlt ? String(monument.imageAlt) : monument.name;


  let approved = [];
  try {
    approved = await fetchApprovedImages(regionKey, monument.id);
  } catch (e) {
    approved = [];
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


window.getZhytomyrData = function() {
    return monuments;
};

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
           
addMarkers(monuments.concat(userMonuments));

             
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



