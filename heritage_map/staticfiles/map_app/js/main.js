// map_app/static/map_app/js/main.js

let geoJsonLayer; 
// 🟢 ИЗМЕНЕНИЕ 1: ИСПОЛЬЗУЕМ L.markerClusterGroup() для кластеризации
let currentMarkers = L.markerClusterGroup(); 
let resetControlInstance = null;
let selectedLayer = null; 

// 1. СТВОРЕННЯ ВЛАСНОГО КЛАСУ ІКОНКИ (Остается без изменений)
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

// 🟢 КРИТИЧНЕ ВИПРАВЛЕННЯ: Додано параметр maxZoom: 18, який вимагає MarkerCluster
const map = L.map('map', {
    zoomControl: false, 
    maxZoom: 18 // ✅ ВИПРАВЛЕНО: Це усуває помилку "Map has no maxZoom specified"
}).setView(initialCenter, initialZoom); 

currentMarkers.addTo(map);

// --- ДАНІ ДЛЯ ВСІХ ТОЧОК У ЖИТОМИРСЬКІЙ ОБЛАСТІ --- (Остается без изменений)
const monuments = [
    { 
        // 1. ЗАМКОВА ГОРА (існуюча)
        name: "Замкова Гора (Житомир)", 
        lat: 50.264, 
        lng: 28.658, 
        id: "zamkova_gora", 
        imagePath: "/static/map_app/images/zamkova.jpg", 
        imageAlt: "Замкова Гора, Житомир", 
        details: `
            <p><strong>Замкова Гора</strong> — історичний пагорб у центрі Житомира, який вважається місцем заснування міста у IX столітті. Згідно з легендою, назва походить від імені Житомира, дружинника київських князів Аскольда і Діра.</p>
            <p>На цій горі стояв перший дерев'яний замок, що був ключовим оборонним пунктом регіону. Протягом століть він багато разів руйнувався під час набігів та відбудовувався. У XVII столітті замок занепав і більше не відновлювався.</p>
            <p><strong>Сучасний стан:</strong> Сьогодні Замкова Гора є улюбленим місцем для прогулянок та огляду панорами міста. Тут встановлено пам'ятний знак. Це місце має величезне історичне значення як колиска Житомира.</p>
        `
    },
    { 
        // 2. ТРИГІРСЬКИЙ МОНАСТИР (Чуднів)
        name: "Тригірський монастир (Чуднів)", 
        lat: 50.117, 
        lng: 28.188, 
        id: "tryhirsky_monastyr", 
        imagePath: "/static/map_app/images/tryhirsky_monastyr.jpg", 
        imageAlt: "Свято-Преображенський Тригірський чоловічий монастир", 
        details: `
            <p><strong>Свято-Преображенський Тригірський чоловічий монастир</strong> — один із найстаріших монастирів Житомирщини, розташований на високому березі річки Тетерів у селі Тригір'я (неподалік Чуднова). Заснований у XVI столітті. Монастир має багату історію та є важливим духовним центром регіону.</p>
        `
    },
    { 
        // 3. КАМ'ЯНЕ СЕЛО (Олевськ)
        name: "Урочище 'Кам'яне село'", 
        lat: 51.272, 
        lng: 27.876, 
        id: "kamyane_selo", 
        imagePath: "/static/map_app/images/kamyane_selo.jpg", 
        imageAlt: "Кам'яне село, Олевський район", 
        details: `
            <p><strong>Урочище 'Кам'яне село'</strong> — унікальна геологічна пам'ятка природи поблизу села Рудня-Замисловицька. Це скупчення великих валунів доісторичного походження, що нагадують будинки та вулиці. Найвідоміший камінь — 'Божий слід'.</p>
        `
    },
    { 
        // 4. СКЕЛЬСЬКИЙ МАСИВ (Дениші)
        name: "Скельський масив (Дениші)", 
        lat: 50.252, 
        lng: 28.490, 
        id: "skelsky_denyshi", 
        imagePath: "/static/map_app/images/skelsky_denyshi.jpg", 
        imageAlt: "Скелі біля річки Тетерів у Денишах", 
        details: `
            <p><strong>Скельський масив у Денишах</strong> — мальовничі гранітні скелі на березі річки Тетерів, що є популярним місцем для скелелазіння. Висота скель сягає 25 метрів.</p>
        `
    },
    { 
        // 5. ГОРОДНИЦЬКИЙ (Замок/Монастир)
        name: "Городницький (залишки укріплення)", 
        lat: 50.840, 
        lng: 27.352, 
        id: "horodnytskyi", 
        imagePath: "/static/map_app/images/horodnytskyi.jpg", 
        imageAlt: "Городницький. Місце старого замку або монастиря", 
        details: `
            <p><strong>Городницький</strong> — історичне поселення (нині смт) відоме залишками старовинного укріплення або монастиря, яке відігравало оборонну роль на річці Случ. Місцевість багата на історичні перекази.</p>
        `
    },
    // 🛑 МАРКЕРИ СОБОРІВ (Близько в Житомирі)
    { 
        // 6. СВЯТО-ГРИГОРОДСЬКИЙ СОБОР
        name: "Свято-Григородський Собор", 
        lat: 50.254, 
        lng: 28.653, 
        id: "sv_hryhorodskyi_sobor", 
        imagePath: "/static/map_app/images/hryhorodskyi_sobor.jpg", 
        imageAlt: "Свято-Григородський Собор, Житомир", 
        details: `
            <p><strong>Свято-Григородський собор</strong> — важлива культова споруда міста Житомира. Є однією з архітектурних домінант центру міста.</p>
        `
    },
    { 
        // 7. СОБОР РІЗДВА ХРИСТОВОГО 
        name: "Собор Різдва Христового", 
        lat: 50.255, 
        lng: 28.654, 
        id: "rizdva_khrystovoho", 
        imagePath: "/static/map_app/images/rizdva_khrystovoho.jpg", 
        imageAlt: "Собор Різдва Христового, Житомир", 
        details: `
            <p><strong>Собор Різдва Христового</strong> — значний релігійний об'єкт у Житомирі, відомий своєю архітектурою та історією.</p>
        `
    },
    { 
        // 8. СВЯТО-ВАСИЛІВСЬКИЙ СОБОР (Овруч)
        name: "Свято-Василівський Собор (Овруч)", 
        lat: 51.321, 
        lng: 28.790, 
        id: "sv_vasylivskyi_ovruch", 
        imagePath: "/static/map_app/images/ghg.jpg", 
        imageAlt: "Свято-Василівський Собор в Овручі", 
        details: `
            <p><strong>Свято-Василівський Собор в Овручі</strong> — унікальна пам'ятка давньоруської архітектури, збудована ще у XII столітті. Був відновлений архітектором О.В. Щусєвим.</p>
        `
    },
    { 
        // 9. БЕРДИЧІВСЬКИЙ КАРМЕЛІТСЬКИЙ МОНАСТИР (Бердичів)
        name: "Бердичівський Кармелітський монастир", 
        lat: 49.897, 
        lng: 28.572, 
        id: "berdychiv_monastyr", 
        imagePath: "/static/map_app/images/berdychiv_monastyr.jpg", 
        imageAlt: "Бердичівський Кармелітський монастир-фортеця", 
        details: `
            <p><strong>Бердичівський Кармелітський монастир</strong> — потужний оборонний монастир-фортеця XVII століття, одна з найвизначніших історичних пам'яток України.</p>
        `
    },
    { 
        // 10. МАГІСТРАТ (Новоград-Волинський)
        name: "Колишній Магістрат (Новоград-Волинський)", 
        lat: 50.590, 
        lng: 27.618, 
        id: "novohrad_magistrat", 
        imagePath: "/static/map_app/images/novohrad_magistrat.jpg", 
        imageAlt: "Колишній Магістрат у Новограді-Волинському", 
        details: `
            <p><strong>Колишній Магістрат</strong> — історична будівля у Звягелі (Новоград-Волинському), що служила адміністративним центром міста.</p>
        `
    },
    {
        // 11. 🏰 САДИБА ТЕРЕЩЕНКІВ (Дениші, близько до скель)
        name: "Садиба Терещенків (Дениші)",
        lat: 50.250, 
        lng: 28.485,
        id: "tereshchenko_denyshi",
        imagePath: "/static/map_app/images/tereshchenko_denyshi.jpg",
        imageAlt: "Руїни палацу Терещенків",
        details: `
            <p><strong>Палац Терещенків</strong> — залишки розкішного маєтку, збудованого відомою родиною цукрозаводчиків та меценатів Терещенків. Знаходиться у мальовничому місці біля річки Тетерів.</p>
        `
    },
    {
        // 12. 🌲 ПРИРОДНИЙ ЗАПОВІДНИК (Полісся)
        name: "Поліський природний заповідник",
        lat: 51.520, 
        lng: 28.000,
        id: "polissia_zapovidnyk",
        imagePath: "/static/map_app/images/polissia_zapovidnyk.jpg",
        imageAlt: "Поліський природний заповідник", 
        details: `
            <p><strong>Поліський природний заповідник</strong> — велика природоохоронна зона на півночі області, що охоплює унікальні ландшафти Полісся: болота, ліси та річки.</p>
        `
    },
];
const detailsPanel = document.getElementById('details-panel');


// Функції стилю та виділення (без змін)
function style(feature) {
    return { 
        fillColor: '#1a1a1a', 
        weight: 1.5, 
        opacity: 1, 
        color: 'white', 
        fillOpacity: 0.0 
    };
}

function highlightFeature(e) {
    const layer = e.target;
    if (layer !== selectedLayer) {
        layer.setStyle({ 
            weight: 5, 
            color: 'white', 
            dashArray: '', 
            fillOpacity: 0.0 
        });
        if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) { layer.bringToFront(); }
    }
}

function resetHighlight(e) {
    if (geoJsonLayer && e.target !== selectedLayer) { 
        geoJsonLayer.resetStyle(e.target); 
    }
}


function zoomToFeature(e) {
    const layer = e.target;
    
    if (selectedLayer && selectedLayer !== layer) {
        geoJsonLayer.resetStyle(selectedLayer);
    }
    
    layer.setStyle({ 
        weight: 6, 
        color: 'white', 
        dashArray: '', 
        fillOpacity: 0.0 
    });
    layer.bringToFront();
    selectedLayer = layer; 
    
    let regionName = 
        layer.feature.properties['name:uk'] || 
        layer.feature.properties.uk || 
        layer.feature.properties.NAME_UKR ||
        layer.feature.properties['name:ru'] || 
        layer.feature.properties.name || 
        layer.feature.properties.ISO3166_2; 
    
    let flyOptions = {
        duration: 0.3, 
        padding: L.point(0, 0) 
    };
    
    const regionNameLower = regionName ? regionName.toLowerCase() : '';

    // 🛑 ЛОГІКА СПЕЦІАЛЬНОГО ЗУМУ
    if (regionNameLower.includes('тернопільська') || regionNameLower.includes('івано-франківська') || regionNameLower.includes('ternopil') || regionNameLower.includes('ivano-frankivsk')) {
        flyOptions.padding = L.point(-50, -50); 
    } else {
        flyOptions.padding = L.point(0, 0); 
    }
    
    map.flyToBounds(layer.getBounds(), flyOptions); 
    
    if (!resetControlInstance) {
        resetControlInstance = new ResetControl({ position: 'topleft' });
        resetControlInstance.addTo(map);
    }

    currentMarkers.clearLayers();
    if (detailsPanel) detailsPanel.style.display = 'none';

    // 🛑 УМОВА ВІДОБРАЖЕННЯ МАРКЕРІВ (Житомирська та її ідентифікатори)
    const isZhytomyr = regionName && (regionNameLower.includes('житомирська') || regionName.includes('ua-18'));
    
    if (isZhytomyr) {
        addMarkers(monuments); 
    } 
}

function onEachFeature(feature, layer) {
    const displayName = 
        feature.properties['name:uk'] || 
        feature.properties.uk || 
        feature.properties.NAME_UKR ||
        feature.properties['name:ru'] || 
        feature.properties.name;
    
    layer.on({
        mouseover: highlightFeature, 
        mouseout: resetHighlight, 
        click: zoomToFeature 
    });
    if (displayName) {
        layer.bindPopup(displayName);
    }
}

// 🟢 ИЗМЕНЕНИЕ 2 И 3: ОБНОВЛЕННАЯ ФУНКЦИЯ ДЛЯ ДОБАВЛЕНИЯ КЛАСТЕРОВ
function addMarkers(monumentsArray) {
    // 🟢 Сначала очищаем, так как currentMarkers теперь кластер
    currentMarkers.clearLayers(); 
    
    const markers = []; // Создаем массив для сбора маркеров
    
    monumentsArray.forEach(monument => {
        // Додаємо до спливаючого вікна підказку про деталі
        const popupContent = `
            <strong>${monument.name}</strong>
            <br>Натисніть на маркер, щоб побачити деталі!
        `;
        
        const marker = L.marker([monument.lat, monument.lng], {icon: defaultMarkerIcon}).bindPopup(popupContent); 
        
        marker.on('click', function() {
            displayDetails(monument);
        });
        
        markers.push(marker); // Добавляем маркер в массив
    });

    // Добавляем все маркеры в кластерную группу за один раз
    currentMarkers.addLayers(markers);
}

// 🛑 ФУНКЦІЯ: ВІДОБРАЖЕННЯ ДЕТАЛЕЙ З ФОТО (Остается без изменений)
function displayDetails(monument) {
    if (detailsPanel) {
        let imageHtml = '';
        if (monument.imagePath) {
            imageHtml = `
                <img src="${monument.imagePath}" alt="${monument.imageAlt}">
            `;
        }
        
        detailsPanel.innerHTML = `
            <h2>${monument.name}</h2>
            ${imageHtml} 
            ${monument.details}
            <button onclick="document.getElementById('details-panel').style.display='none'">Назад на карту</button>
        `;
        detailsPanel.style.display = 'flex'; 
    }
}


// КОНТРОЛ: Кнопка "Назад" (Остается без изменений)
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
        container.innerHTML = 'Назад'; 

        container.onclick = function(){
            map.flyToBounds(L.latLngBounds(initialCenter, initialCenter).pad(2), {
                maxZoom: initialZoom,
                duration: 0.3 
            });
            currentMarkers.clearLayers();
            if (detailsPanel) detailsPanel.style.display = 'none';

            if (selectedLayer) {
                geoJsonLayer.resetStyle(selectedLayer);
                selectedLayer = null; 
            }
            
            if (resetControlInstance) {
                map.removeControl(resetControlInstance);
                resetControlInstance = null;
            }
        }
        return container;
    }
});


// Завантаження GeoJSON (Остается без изменений)
const geoJsonPath = '/static/map_app/js/ukraine_regions.json/UA_FULL_Ukraine.geojson'; 

fetch(geoJsonPath)
    .then(response => {
        if (!response.ok) {
            throw new Error(`Помилка завантаження GeoJSON: Статус ${response.status} (файл: ${geoJsonPath})`);
        }
        return response.json();
    })
    .then(data => {
        geoJsonLayer = L.geoJson(data, {
            style: style,
            onEachFeature: onEachFeature
        }).addTo(map);
    })
    .catch(error => {
        console.error('Критична помилка завантаження GeoJSON або ініціалізації карти:', error);
    });


L.control.zoom({
    position:'topleft' 
}).addTo(map);