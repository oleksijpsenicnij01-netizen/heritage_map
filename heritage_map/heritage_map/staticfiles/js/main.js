// map_app/static/js/main.js

// 1. ІНІЦІАЛІЗАЦІЯ КАРТИ
const map = L.map('map', {
    zoomControl: false 
}).setView([48.3794, 31.1656], 6); 

// 2. ДОДАВАННЯ БАЗОВОГО ШАРУ (ТАЙЛІВ)
// Це додасть стандартний фон карти, щоб ви бачили щось, крім чорних контурів
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

// 3. ФУНКЦІЇ ДЛЯ СТИЛЮ
function style(feature) {
    return {
        fillColor: '#1a1a1a', 
        weight: 1.5,
        opacity: 1,
        color: 'white', 
        fillOpacity: 0.9 
    };
}

function highlightFeature(e) {
    const layer = e.target;

    layer.setStyle({
        weight: 3,
        color: '#ffcc00', 
        dashArray: '',
        fillOpacity: 0.95
    });

    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
        layer.bringToFront();
    }
}

function resetHighlight(e) {
    L.geoJson(e.target.feature, { style: style }).setStyle(style(e.target.feature));
}

function onEachFeature(feature, layer) {
    layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight,
        click: function(e) {
            // ...
        }
    });

    if (feature.properties && feature.properties.NAME_UKR) {
        layer.bindPopup(feature.properties.NAME_UKR);
    }
}

// 4. АСИНХРОННЕ ЗАВАНТАЖЕННЯ GEOJSON
const geoJsonPath = '/static/js/ukraine_regions.json'; // 🛑 ВИКОРИСТОВУЄМО АБСОЛЮТНИЙ ШЛЯХ

fetch(geoJsonPath)
    .then(response => {
        if (!response.ok) {
            // Критична помилка, якщо файл не знайдено (Статус 404)
            throw new Error(`Помилка завантаження GeoJSON: Статус ${response.status} (файл: ${geoJsonPath})`);
        }
        return response.json();
    })
    .then(data => {
        // Додаємо GeoJSON дані на карту
        L.geoJson(data, {
            style: style,
            onEachFeature: onEachFeature
        }).addTo(map);

        console.log('Карта успішно завантажена і відображена.');

    })
    .catch(error => {
        console.error('Критична помилка завантаження GeoJSON або ініціалізації карти:', error);
    });

// 5. ДОДАТКОВО: Додаємо контрол масштабу
L.control.zoom({
     position:'topleft' 
}).addTo(map);