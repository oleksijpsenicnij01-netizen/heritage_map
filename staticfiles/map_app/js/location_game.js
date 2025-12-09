let locationGameMap = null; 
let zhytomyrBorderLayer = null; 
let locationMarkersLayer = L.markerClusterGroup({
    spiderfyOnMaxZoom: false, 
    showCoverageOnHover: false,
    zoomToBoundsOnClick: true
}); 
let monumentMarkers = []; 
let userMarkersLayer = L.layerGroup(); 
let userSnaps = {}; 

const allZhytomyrMonuments = window.getZhytomyrData ? window.getZhytomyrData() : null;



window.initLocationGame = function() {
    if (!allZhytomyrMonuments || !window.L) {
        console.error("Критична помилка: Не знайдено даних або бібліотеки Leaflet.");
        window.goToTypeSelection();
        return;
    }
    
    console.log("[Game] Ініціалізація гри 'Де знаходиться?' для", allZhytomyrMonuments.length, "пам'яток.");
    
    const regionSelection = document.getElementById('region-selection-view');
    if (regionSelection) { regionSelection.style.display = 'none'; }
    const typeSelection = document.getElementById('type-selection-view');
    if (typeSelection) { typeSelection.style.display = 'none'; }
    const quizScreen = document.getElementById('quiz-screen');
    if (quizScreen) { quizScreen.style.display = 'flex'; }
    
    userSnaps = {}; 
    
    generateGameUI(allZhytomyrMonuments);
};


function generateGameUI(monuments) {
    const quizScreen = document.getElementById('quiz-screen');
    if (!quizScreen) return;

    let mapView = document.getElementById('map-view');
    if (!mapView) {
        mapView = document.createElement('div');
        mapView.id = 'map-view';
        mapView.classList.add('location-map-view');
        quizScreen.appendChild(mapView); 
    }

    let gameContainer = document.getElementById('game-container');
    if (!gameContainer) {
        gameContainer = document.createElement('div');
        gameContainer.id = 'game-container';
        gameContainer.classList.add('location-game-container'); 
        quizScreen.appendChild(gameContainer);
    }
    
    gameContainer.innerHTML = `
        <h2 id="location-game-title" class="game-title">Де знаходиться пам'ятка?</h2>
        
        <div class="location-name-box">
            <p style="color: white; font-weight: bold; margin-bottom: 10px;">Перетягніть назву на відповідний маркер:</p>
            <div id="location-name-list">
                ${monuments.map(m => `
                    <div class="name-item" 
                         data-id="${m.id}"
                         draggable="true" 
                         ondragstart="drag(event)"
                         ondragend="dragEnd(event)"
                         >
                        ${m.name}
                    </div>
                `).join('')}
            </div>
        </div>

        <div class="game-controls">
            <button id="check-location-btn" disabled>
                Перевірити
            </button>
            <button id="change-location-game-btn" onclick="window.finishLocationGame(true)" class="change-game-btn">
                ⬅️ Змінити гру
            </button>
        </div>
        
        <div id="results-modal-overlay" class="results-modal-overlay" style="display:none;">
            <div id="results-modal-content" class="results-modal-content">
                </div>
        </div>
    `;

    initializeLocationGameMap();
}



function initializeLocationGameMap() {
    
    const initialZoom = 8;
    const centerCoords = [50.32, 28.5]; 
    
    if (locationGameMap) {
        locationGameMap.invalidateSize();
        locationGameMap.setView(centerCoords, initialZoom);
        addZhytomyrBorder(); 
        addLocationMarkers(allZhytomyrMonuments); 
        return; 
    }

    const mapElementId = 'map-view';
    const mapElement = document.getElementById(mapElementId);
    
    if (!mapElement) {
        console.error("Помилка: Не знайдено DOM елемент #map-view.");
        return;
    }

    locationGameMap = window.L.map(mapElementId, {
        center: centerCoords, 
        zoom: initialZoom, 
        minZoom: 7,
        maxZoom: 18,
        attributionControl: false,
        zoomControl: false 
    });

    window.L.tileLayer('https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
        maxZoom: 20,
        subdomains:['mt0','mt1','mt2','mt3']
    }).addTo(locationGameMap);
    
    locationGameMap.addLayer(locationMarkersLayer); 
    locationGameMap.addLayer(userMarkersLayer); 

    addZhytomyrBorder(); 
    addLocationMarkers(allZhytomyrMonuments); 
    
    console.log("Супутникова карта для Location Game ініціалізована.");
}



function addLocationMarkers(monumentsArray) {
    if (!locationGameMap) return;

    locationMarkersLayer.clearLayers(); 
    monumentMarkers = [];
    
    const CssDotIcon = L.divIcon({
        className: 'location-dot-icon', 
        iconSize: [12, 12],
        iconAnchor: [6, 6]
    });

    monumentsArray.forEach(monument => {
        const marker = L.marker([monument.lat, monument.lng], {
            icon: CssDotIcon, 
            title: monument.name,
            monumentId: monument.id, 
            opacity: 1.0, 
            draggable: false, 
            interactive: true 
        });
        
        marker.on('add', function() {
            const markerIcon = marker._icon;
            if (markerIcon) {
             
                markerIcon.addEventListener('dragover', function(e) {
                    e.preventDefault(); 
                    markerIcon.classList.add('marker-drag-over'); 
                });
                
               
                markerIcon.addEventListener('dragleave', function() {
                    markerIcon.classList.remove('marker-drag-over');
                });
                
              
                markerIcon.addEventListener('drop', function(e) {
                    e.preventDefault();
                    markerIcon.classList.remove('marker-drag-over');
                    
                    const droppedId = e.dataTransfer.getData("monument-id");
                    if (!droppedId) return;
                    
                    const targetMarkerId = marker.options.monumentId;
                    
                    handleMarkerSnap(droppedId, targetMarkerId, marker);
                });
            }
        });
        
        monumentMarkers.push(marker);
        locationMarkersLayer.addLayer(marker); 
    });
    
    console.log(`Додано ${monumentMarkers.length} видимих маркерів-крапок.`);
}


function handleMarkerSnap(monumentId, targetMarkerId, targetMarker) {
    
    const monumentData = allZhytomyrMonuments.find(m => m.id === monumentId);
    
   
    let existingSnappedMonumentId = Object.keys(userSnaps).find(
        (key) => userSnaps[key] === targetMarkerId
    );
    
    if (existingSnappedMonumentId) {
        console.warn(`[Snap Blocked] Маркер ID ${targetMarkerId} вже зайнятий.`);
        return; 
    }
    

    userSnaps[monumentId] = targetMarkerId; 
    
   
    L.DomUtil.removeClass(targetMarker._icon, 'location-dot-icon'); 
    L.DomUtil.addClass(targetMarker._icon, 'marker-snap-occupied');
    
   
    targetMarker.bindTooltip(monumentData.name, {
        permanent: true, 
        direction: 'top',
        className: 'location-snap-label-default', 
        offset: [0, -10]
    }).openTooltip();
    
   
    const draggedElement = document.querySelector(`.name-item[data-id="${monumentId}"]`);
    if (draggedElement) {
        draggedElement.classList.remove('dragging'); 
        draggedElement.remove(); 
    }
    
    console.log(`[Snap Register] Назва ${monumentData.name} (ID: ${monumentId}) прикріплена до маркера ID ${targetMarkerId}. Очікує перевірки.`);


    const nameList = document.getElementById('location-name-list');
    const checkButton = document.getElementById('check-location-btn');
    if (nameList && checkButton && nameList.children.length === 0) {
        checkButton.disabled = false;
        checkButton.textContent = "Перевірити результати";
        checkButton.onclick = window.checkGameResults; 
    }
}





window.drag = function(ev) {
    const monumentId = ev.target.getAttribute('data-id');
    
    ev.dataTransfer.setData("monument-id", monumentId);
    ev.dataTransfer.setData("text/plain", monumentId); 
    

    const rect = ev.target.getBoundingClientRect();
    const xOffset = rect.width / 2;
    const yOffset = rect.height / 2;
    ev.dataTransfer.setDragImage(ev.target, xOffset, yOffset);

    ev.target.classList.add('dragging'); 
}


window.dragEnd = function(ev) {
    ev.target.classList.remove('dragging');
}



window.checkGameResults = function() { 
    const snappedCount = Object.keys(userSnaps).length;
    const totalCount = allZhytomyrMonuments.length;
    
    if (snappedCount !== totalCount) {
        console.warn("Не всі назви прикріплені.");
        return;
    }

    let correctCount = 0;
    let resultsForModal = [];


    Object.keys(userSnaps).forEach(monumentId => {
        const targetMarkerId = userSnaps[monumentId];
        const isCorrect = (monumentId === targetMarkerId);
        
        const monumentData = allZhytomyrMonuments.find(m => m.id === monumentId);
        const targetMonumentData = allZhytomyrMonuments.find(m => m.id === targetMarkerId);

        resultsForModal.push({
            name: monumentData.name,
            correctName: targetMonumentData.name,
            isCorrect: isCorrect
        });
        
        if (isCorrect) {
            correctCount++;
        }
        
 
        const targetMarker = monumentMarkers.find(m => m.options.monumentId === targetMarkerId);
        if (targetMarker && targetMarker._icon) {
          
            L.DomUtil.removeClass(targetMarker._icon, 'marker-snap-occupied');
            L.DomUtil.addClass(targetMarker._icon, isCorrect ? 'marker-snap-correct' : 'marker-snap-wrong');
            
           
            targetMarker.bindPopup(`
                <strong>${isCorrect ? 'Правильно!' : 'Неправильно!'}</strong><br>
                Ви прикріпили: ${monumentData.name}<br>
                Це місце: ${targetMonumentData.name}
            `).openPopup();
        }
    });


    let scoreText = `${correctCount} / ${totalCount}`;
    let percentage = Math.round((correctCount / totalCount) * 100);

    const modalContent = document.getElementById('results-modal-content');
    const modalOverlay = document.getElementById('results-modal-overlay');

    if (!modalContent || !modalOverlay) {
        alert(`Гра завершена! Ваш результат: ${scoreText} (${percentage}%)`);
        return;
    }
    

    modalContent.innerHTML = `
        <h3><span style="font-size: 1.5em;">🎉</span> Результати гри <span style="font-size: 1.5em;">🎉</span></h3>
        <p class="score-summary">Ваш результат: ${scoreText} (${percentage}%)</p>
        
        <div class="result-details">
            ${resultsForModal.map(r => `
                <p class="${r.isCorrect ? 'result-correct' : 'result-wrong'}">
                    ${r.isCorrect ? `✅ Правильно: ${r.name}` : `❌ Неправильно. Ви обрали ${r.name}, а це: ${r.correctName}.`}
                </p>
            `).join('')}
        </div>
        
        <div class="modal-actions">
            <button onclick="window.finishLocationGame(false)" class="game-btn game-btn-orange">
                Почати знов
            </button>
            <button onclick="window.finishLocationGame(true)" class="game-btn game-btn-red">
                Змінити гру
            </button>
        </div>
    `;
    
    modalOverlay.style.display = 'flex';
    
    const checkButton = document.getElementById('check-location-btn');
    if (checkButton) {
        checkButton.disabled = true;
        checkButton.textContent = `Результат: ${scoreText}`;
    }
}


window.finishLocationGame = function(goToSelection = false) {
    const modalOverlay = document.getElementById('results-modal-overlay');
    if (modalOverlay) { modalOverlay.style.display = 'none'; }
    
    const gameContainer = document.getElementById('game-container');
    if (gameContainer) { gameContainer.remove(); }
    
    const mapView = document.getElementById('map-view');
    if (mapView) {
        if (locationGameMap) {
            locationGameMap.remove();
            locationGameMap = null;
        }
        mapView.remove();
    }
    
    locationMarkersLayer.clearLayers();
    userMarkersLayer.clearLayers();
    monumentMarkers = [];
    zhytomyrBorderLayer = null;
    userSnaps = {};
    

    if (goToSelection) {
        window.goToTypeSelection();
    } else {
        window.initLocationGame(); 
    }
};


function addZhytomyrBorder() {
    if (!locationGameMap) return;
    
    if (zhytomyrBorderLayer) {
        locationGameMap.removeLayer(zhytomyrBorderLayer);
    }
    

    const geoJsonPath = '/static/map_app/js/ukraine_regions.json/UA_18_Zhytomyrska.geojson';
    
    fetch(geoJsonPath)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Не вдалося завантажити GeoJSON (${response.status}): Перевірте шлях: ${geoJsonPath}`);
            }
            return response.json();
        })
        .then(data => {
            const borderStyle = {
                color: '#FFFFFF', 
                weight: 4,        
                opacity: 1,       
                fillOpacity: 0.0, 
            };

            zhytomyrBorderLayer = L.geoJSON(data, {
                style: borderStyle
            }).addTo(locationGameMap);

            console.log("Кордон Житомирської області успішно додано.");
            
            if (zhytomyrBorderLayer) {
                locationGameMap.fitBounds(zhytomyrBorderLayer.getBounds());
            }

        })
        .catch(error => {
            console.error("Помилка при завантаженні або обробці GeoJSON:", error);
        });
}