let locationGameMap = null;

window.destroyLocationGame = function () {
  try {

    if (locationGameMap) {
      locationGameMap.off();
      locationGameMap.remove();  
      locationGameMap = null;
    }


    const mapView = document.getElementById("map-view");
    if (mapView) mapView.remove();

    const gameContainer = document.getElementById("game-container");
    if (gameContainer) gameContainer.remove();
  } catch (e) {
    console.warn("destroyLocationGame error:", e);
  }
};

let regionBorderLayer = null;

let locationMarkersLayer = L.markerClusterGroup({
  spiderfyOnMaxZoom: false,
  showCoverageOnHover: false,
  zoomToBoundsOnClick: true
});

let monumentMarkers = [];
let userMarkersLayer = L.layerGroup();
let userSnaps = {};

let allRegionMonuments = [];

window.initLocationGame = async function () {
  const regionKey = window.selectedRegion?.internalName || "zhytomyr";

  await loadLocationGameData(regionKey);

  if (!allRegionMonuments.length || !window.L) {
    console.error("Критична помилка: Немає даних або Leaflet.");
    window.goToTypeSelection();
    return;
  }

  const regionSelection = document.getElementById("region-selection-view");
  if (regionSelection) regionSelection.style.display = "none";

  const typeSelection = document.getElementById("type-selection-view");
  if (typeSelection) typeSelection.style.display = "none";

  const quizScreen = document.getElementById("quiz-screen");
  if (quizScreen) quizScreen.style.display = "flex";

  userSnaps = {};

  generateGameUI(allRegionMonuments);
};

function generateGameUI(monuments) {
  const quizScreen = document.getElementById("quiz-screen");
  if (!quizScreen) return;

  let mapView = document.getElementById("map-view");
  if (!mapView) {
    mapView = document.createElement("div");
    mapView.id = "map-view";
    mapView.classList.add("location-map-view");
    quizScreen.appendChild(mapView);
  }

  let gameContainer = document.getElementById("game-container");
  if (!gameContainer) {
    gameContainer = document.createElement("div");
    gameContainer.id = "game-container";
    gameContainer.classList.add("location-game-container");
    quizScreen.appendChild(gameContainer);
  }

  gameContainer.innerHTML = `
  
        <h2 id="location-game-title" class="game-title">Де знаходиться пам'ятка?</h2>

        <div class="location-name-box">
            <p style="color: white; font-weight: bold; margin-bottom: 10px;">Перетягніть назву на відповідний маркер:</p>
            <div id="location-name-list">
                ${monuments
                  .map(
                    (m) => `
                    <div class="name-item"
                         data-id="${String(m.id)}"
                         draggable="true"
                         ondragstart="drag(event)"
                         ondragend="dragEnd(event)">
                        ${m.name}
                    </div>
                `
                  )
                  .join("")}
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
            <div id="results-modal-content" class="results-modal-content"></div>
        </div>
    `;
if ('ontouchstart' in window) {

  window._selectedLocationItem = null;

  const nameList = document.getElementById('location-name-list');

  if (nameList) {
    nameList.addEventListener('click', (e) => {
      const item = e.target.closest('.name-item');
      if (!item) return;

      if (window._selectedLocationItem) {
        window._selectedLocationItem.style.outline = 'none';
      }

      window._selectedLocationItem = item;
      item.style.outline = '2px solid orange';
    });
  }

}
  initializeLocationGameMap();
}

function initializeLocationGameMap() {
  const initialZoom = 8;
  const centerCoords = [50.32, 28.5];

  if (locationGameMap) {
    locationGameMap.invalidateSize();
    locationGameMap.setView(centerCoords, initialZoom);
      const regionKey = window.selectedRegion?.internalName || "zhytomyr";
  loadRegionBorder(regionKey);
    addLocationMarkers(allRegionMonuments);
const layers = locationMarkersLayer.getLayers();

if (layers.length === 1) {
  locationGameMap.setView(layers[0].getLatLng(), 10); // нормальний зум
} else if (layers.length > 1) {
  locationGameMap.fitBounds(locationMarkersLayer.getBounds());
}
    return;
  }


if (locationGameMap) {
  locationGameMap.off();
  locationGameMap.remove();
  locationGameMap = null;
}

  const mapElementId = "map-view";
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

  const regionKey = window.selectedRegion?.internalName || "zhytomyr";
loadRegionBorder(regionKey);

  window.L.tileLayer("https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}", {
    maxZoom: 20,
    subdomains: ["mt0", "mt1", "mt2", "mt3"]
  }).addTo(locationGameMap);

  locationGameMap.addLayer(locationMarkersLayer);
  locationGameMap.addLayer(userMarkersLayer);


  addLocationMarkers(allRegionMonuments);
const layers = locationMarkersLayer.getLayers();

if (layers.length === 1) {
  locationGameMap.setView(layers[0].getLatLng(), 10); // нормальний зум
} else if (layers.length > 1) {
  locationGameMap.fitBounds(locationMarkersLayer.getBounds());
}
}

function addLocationMarkers(monumentsArray) {
  if (!locationGameMap) return;

  locationMarkersLayer.clearLayers();
  monumentMarkers = [];

  const CssDotIcon = L.divIcon({
    className: "location-dot-icon",
    iconSize: [12, 12],
    iconAnchor: [6, 6]
  });

  monumentsArray.forEach((monument) => {
    const marker = L.marker([monument.lat, monument.lng], {
      icon: CssDotIcon,
title: "",
      monumentId: String(monument.id),
      opacity: 1.0,
      draggable: false,
      interactive: true
    });

    marker.on("add", function () {
      const markerIcon = marker._icon;
      if (!markerIcon) return;

      markerIcon.addEventListener("dragover", function (e) {
        e.preventDefault();
        markerIcon.classList.add("marker-drag-over");
      });

      markerIcon.addEventListener("dragleave", function () {
        markerIcon.classList.remove("marker-drag-over");
      });

      markerIcon.addEventListener("drop", function (e) {
        e.preventDefault();
        markerIcon.classList.remove("marker-drag-over");

        const droppedId = e.dataTransfer.getData("monument-id");
        if (!droppedId) return;

        const targetMarkerId = String(marker.options.monumentId);

        handleMarkerSnap(String(droppedId), targetMarkerId, marker);
      });
    });

    monumentMarkers.push(marker);
    locationMarkersLayer.addLayer(marker);

  });

      if ('ontouchstart' in window) {

  monumentMarkers.forEach(marker => {
    
    marker.off('click');

    marker.on('click', () => {

      if (!window._selectedLocationItem) return;

      const monumentId = window._selectedLocationItem.dataset.id;

      handleMarkerSnap(
        monumentId,
        marker.options.monumentId,
        marker
      );

      window._selectedLocationItem.style.outline = 'none';
      window._selectedLocationItem = null;

    });
  });

}
}

function handleMarkerSnap(monumentId, targetMarkerId, targetMarker) {
  const mId = String(monumentId);
  const tId = String(targetMarkerId);

  const monumentData = allRegionMonuments.find((m) => String(m.id) === mId);
  if (!monumentData) return;

  const existingSnappedMonumentId = Object.keys(userSnaps).find(
    (key) => String(userSnaps[key]) === tId
  );

  if (existingSnappedMonumentId) return;

  userSnaps[mId] = tId;

  if (targetMarker && targetMarker._icon) {
    L.DomUtil.removeClass(targetMarker._icon, "location-dot-icon");
    L.DomUtil.addClass(targetMarker._icon, "marker-snap-occupied");
  }

  targetMarker
    .bindTooltip(monumentData.name, {
      permanent: true,
      direction: "top",
      className: "location-snap-label-default",
      offset: [0, -10]
    })
    .openTooltip();

  const draggedElement = document.querySelector(`.name-item[data-id="${mId}"]`);
  if (draggedElement) {
    draggedElement.classList.remove("dragging");
    draggedElement.remove();
  }

  const nameList = document.getElementById("location-name-list");
  const checkButton = document.getElementById("check-location-btn");

  if (nameList && checkButton && nameList.children.length === 0) {
    checkButton.disabled = false;
    checkButton.textContent = "Перевірити результати";
    checkButton.onclick = window.checkGameResults;
  }
}

window.drag = function (ev) {
  const monumentId = String(ev.target.getAttribute("data-id") || "");
  if (!monumentId) return;

  ev.dataTransfer.setData("monument-id", monumentId);
  ev.dataTransfer.setData("text/plain", monumentId);

  const rect = ev.target.getBoundingClientRect();
  ev.dataTransfer.setDragImage(ev.target, rect.width / 2, rect.height / 2);

  ev.target.classList.add("dragging");
};

window.dragEnd = function (ev) {
  ev.target.classList.remove("dragging");
};

window.checkGameResults = function () {
  const snappedCount = Object.keys(userSnaps).length;
  const totalCount = allRegionMonuments.length;

  if (snappedCount !== totalCount) return;

  let correctCount = 0;
  let resultsForModal = [];

  Object.keys(userSnaps).forEach((monumentId) => {
    const targetMarkerId = String(userSnaps[monumentId]);
    const isCorrect = String(monumentId) === String(targetMarkerId);

    const monumentData = allRegionMonuments.find(
      (m) => String(m.id) === String(monumentId)
    );
    const targetMonumentData = allRegionMonuments.find(
      (m) => String(m.id) === String(targetMarkerId)
    );

    if (!monumentData || !targetMonumentData) return;

    resultsForModal.push({
      name: monumentData.name,
      correctName: targetMonumentData.name,
      isCorrect: isCorrect
    });

    if (isCorrect) correctCount++;

    const targetMarker = monumentMarkers.find(
      (m) => String(m.options.monumentId) === String(targetMarkerId)
    );

    if (targetMarker && targetMarker._icon) {
      L.DomUtil.removeClass(targetMarker._icon, "marker-snap-occupied");
      L.DomUtil.addClass(
        targetMarker._icon,
        isCorrect ? "marker-snap-correct" : "marker-snap-wrong"
      );

      targetMarker
        .bindPopup(`
            <strong>${isCorrect ? "Правильно!" : "Неправильно!"}</strong><br>
            Ви прикріпили: ${monumentData.name}<br>
            Це місце: ${targetMonumentData.name}
        `)
        .openPopup();
    }
  });

  const regionKey =
    window.selectedRegion && window.selectedRegion.internalName
      ? window.selectedRegion.internalName
      : "zhytomyr";

  if (window.submitGameResult) {
    window.submitGameResult({
      region: regionKey,
      game_key: "location",
      score: correctCount
    }).then((r) => {
      if (!r.ok) console.log("submit failed", r.status, r.data);
    });
  }

  let scoreText = `${correctCount} / ${totalCount}`;
  let percentage = Math.round((correctCount / totalCount) * 100);

  const modalContent = document.getElementById("results-modal-content");
  const modalOverlay = document.getElementById("results-modal-overlay");

  if (!modalContent || !modalOverlay) {
    alert(`Гра завершена! Ваш результат: ${scoreText} (${percentage}%)`);
    return;
  }

  modalContent.innerHTML = `
        <h3><span style="font-size: 1.5em;">🎉</span> Результати гри <span style="font-size: 1.5em;">🎉</span></h3>
        <p class="score-summary">Ваш результат: ${scoreText} (${percentage}%)</p>

        <div class="result-details">
            ${resultsForModal
              .map(
                (r) => `
                <p class="${r.isCorrect ? "result-correct" : "result-wrong"}">
                    ${
                      r.isCorrect
                        ? `✅ Правильно: ${r.name}`
                        : `❌ Неправильно. Ви обрали ${r.name}, а це: ${r.correctName}.`
                    }
                </p>
            `
              )
              .join("")}
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

  modalOverlay.style.display = "flex";

  const checkButton = document.getElementById("check-location-btn");
  if (checkButton) {
    checkButton.disabled = true;
    checkButton.textContent = `Результат: ${scoreText}`;
  }
};

window.finishLocationGame = function (goToSelection = false) {
  const modalOverlay = document.getElementById("results-modal-overlay");
  if (modalOverlay) modalOverlay.style.display = "none";

  const gameContainer = document.getElementById("game-container");
  if (gameContainer) gameContainer.remove();

  const mapView = document.getElementById("map-view");
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
  regionBorderLayer = null;
  userSnaps = {};

  if (goToSelection) window.goToTypeSelection();
  else window.initLocationGame();
};


async function loadLocationGameData(regionKey) {
  try {
    const r = await fetch(`/api/monuments/?region=${regionKey}`);
    const data = await r.json();

    if (data.ok) {
      allRegionMonuments = data.monuments.map(m => ({
        id: m.id,
        name: m.name,
        lat: m.lat,
        lng: m.lng
      }));
    }
  } catch (e) {
    console.error("Помилка завантаження location гри", e);
  }
}

async function loadRegionBorder(regionKey) {
  try {

    const regionFileMap = {
      zhytomyr: "UA_18_Zhytomyrska.geojson",
      kyiv: "UA_32_Kyivska.geojson"
    };

    const fileName = regionFileMap[regionKey];
    if (!fileName) return;

    const res = await fetch(`/static/map_app/js/ukraine_regions.json/${fileName}`);
    const data = await res.json();

    if (regionBorderLayer) {
      locationGameMap.removeLayer(regionBorderLayer);
    }

    regionBorderLayer = L.geoJSON(data, {
      style: {
        color: '#ffffff',
        weight: 3,
        fillOpacity: 0
      }
    }).addTo(locationGameMap);

    locationGameMap.fitBounds(regionBorderLayer.getBounds());

  } catch (e) {
    console.error('GeoJSON error:', e);
  }
}