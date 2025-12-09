// map_app/static/map_app/js/map_init.js

// ----------------------------------------------------
// 🟢 ГЛОБАЛЬНІ ЗМІННІ (Доступні у game_logic.js)
// ----------------------------------------------------
let geoJsonLayer; 
let currentMarkers = L.markerClusterGroup(); 
let resetControlInstance = null;
let selectedLayer = null; 
let mapStateBeforeMarkerZoom = null; 
const detailsPanel = document.getElementById('details-panel');
const map = L.map('map', {
    zoomControl: false, 
    maxZoom: 18 
});
window.allRegionNames = []; // Змінна для зберігання назв областей

// ----------------------------------------------------
// 🟢 КОНСТАНТИ ТА ІНІЦІАЛІЗАЦІЯ КАРТИ
// ----------------------------------------------------
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

map.setView(initialCenter, initialZoom); 

// 🟢 Створення спеціальних панелей для Z-Index
map.createPane('tiles-pane').style.zIndex = 200; 
map.createPane('geojson-pane').style.zIndex = 600; 
map.createPane('marker-pane').style.zIndex = 700; 

// 🟢 ДОДАВАННЯ СУПУТНИКОВОГО ШАРУ
const googleHybridLayer = L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}={z}', {
    maxZoom: 20,
    attribution: 'Map data ©2024 Google',
    pane: 'tiles-pane' 
}).addTo(map);

currentMarkers = L.markerClusterGroup({ 
    pane: 'marker-pane' 
});
currentMarkers.addTo(map);

// ----------------------------------------------------
// 🟢 ДАНІ ПАМ'ЯТОК (Глобально, доступні для ігор)
// ----------------------------------------------------
window.monuments = [
    { 
        name: "Пам'ятний знак на честь заснування Житомира", lat: 50.25343756567173, lng: 28.654433190482916, id: "zamkova_gora", year: 884, 
        imagePath: "/static/map_app/images/zamkova.jpg", imageAlt: "Замкова Гора, Житомир", 
        details: `<p><strong>Замкова Гора</strong> — історичний пагорб, який є колискою та серцем Житомира. Вважається, що саме тут у IX столітті засновник міста Житомир збудував перше укріплення. З пагорба відкривається захоплюючий панорамний вид на річки Тетерів та Кам'янка. Сьогодні це улюблене місце відпочинку містян, прикрашене пам'ятним знаком і розташоване поряд із Кафедральним собором.</p>`,
        clue: "Історичний пагорб, де, за легендою, Житомир був заснований у IX столітті."
    },
    { 
        name: "Тригірський монастир", lat: 50.19851548576178, lng: 28.372788481551822, id: "tryhirsky_monastyr", year: 1583, 
        imagePath: "/static/map_app/images/tryhirsky_monastyr.jpg", imageAlt: "Свято-Преображенський Тригірський чоловічий монастир", 
        details: `<p><strong>Свято-Преображенський Тригірський чоловічий монастир</strong> — одна з найстаріших релігійних споруд Житомирщини, заснована ще в XVI столітті. Розташований на кручі над річкою Тетерів, він вражає своєю архітектурою та величним розташуванням. Монастир пережив часи польського панування, козацьких воєн та радянських гонінь, зберігаючи свою духовну спадщину.</p>`,
        clue: "Одна з найстаріших релігійних споруд XVI століття, розташована на кручі над річкою Тетерів."
    },
    { 
        name: "Свято-Василівський Собор", lat: 51.32173265861692, lng: 28.797728260293624, id: "sv_vasylivskyi_ovruch", year: 1190, 
        imagePath: "/static/map_app/images/ghg.jpg", imageAlt: "Свято-Василівський Собор в Овручі", 
        details: `<p><strong>Свято-Василівський Собор в Овручі</strong> — унікальна пам'ятка давньоруської архітектури, зведена ще наприкінці XII століття за часів князя Рюрика Ростиславича. Собор є однією з небагатьох збережених домонгольських кам'яних церков. Він був відновлений відомим архітектором Олексієм Щусєвим на початку XX століття, і є символом духовної стійкості та історичної спадщини Овруча.</p>`,
        clue: "Унікальна домонгольська пам'ятка XII століття, відновлена архітектором Щусєвим."
    },
    { 
        name: "Бердичівський Кармелітський монастир", lat: 49.89782631539752, lng: 28.574566488926934, id: "berdychiv_monastyr", year: 1627, 
        imagePath: "/static/map_app/images/berdychiv_monastyr.jpg", imageAlt: "Бердичівський Кармелітський монастир-фортеця", 
        details: `<p><strong>Бердичівський Кармелітський монастир-фортеця</strong> — це потужний оборонний комплекс XVII-XVIII століть, що поєднує функції монастиря і фортеці. Вважається одним із найкраще збережених зразків барокової фортифікаційної архітектури в Україні. Його величні стіни та башти є свідками численних історичних подій. На території знаходиться католицький Санктуарій Матері Божої Бердичівської — важливий центр паломництва.</p>`,
        clue: "Потужний оборонний комплекс XVII-XVIII століть, що поєднує функції фортеці і Санктуарію Матері Божої."
    },
    { 
        name: "Руїни палацу Терещенків", lat: 50.205551741762655, lng: 28.412307537375778, id: "tereshchenko_denyshi", year: 1910, 
        imagePath: "/static/map_app/images/tereshchenko_denyshi.jpg", imageAlt: "Руїни палацу Терещенків", 
        details: `<p><strong>Палац Терещенків</strong> — руїни розкішного маєтку, який належав відомій родині українських меценатів та цукрозаводчиків Терещенків. Побудований у стилі модерн, палац був оточений прекрасним парком. Хоча він значною мірою зруйнований, його залишки, розташовані на високому березі річки Тетерів, створюють атмосферу таємничості та романтики, приваблюючи фотографів та істориків.</p>`,
        clue: "Руїни маєтку родини цукрозаводчиків Терещенків на високому березі річки Тетерів."
    },
    { 
        name: "Палац Бержинських-Терещенків", lat: 50.01647450985383, lng: 29.023309381540617, id: "berzhynski_palace", year: 1840, 
        imagePath: "/static/map_app/images/palace_berzhynski.jpg", imageAlt: "Палац Бержинських-Терещенків у с. Червоне", 
        details: `<p><strong>Палац Бержинських-Терещенків</strong> — це видатний зразок неоготичної архітектури, розташований у селі Червоне. Спочатку належав шляхетній родині Бержинських, пізніше був придбаний і відновлений меценатами Терещенками. Палац відомий своєю розкішною архітектурою та мальовничим парком. Незважаючи на руйнування, він залишається важливою історичною пам'яткою Житомирщини.</p>`,
        clue: "Видатний зразок неоготичної архітектури у с. Червоне, пов'язаний з родинами Бержинських і Терещенків."
    },
    { 
        name: "Курган-могила учасників Коліївщини 1768 р.", lat: 50.08349247490191, lng: 28.725181795038896, id: "koliivshchyna_kurhan", year: 1768, 
        imagePath: "/static/map_app/images/koliivshchyna_kurhan.jpg", imageAlt: "Курган-могила учасників Коліївщини", 
        details: `<p><strong>Курган-могила</strong> — це пам'ятка на честь героїв селянсько-козацького повстання Коліївщини 1768 року, спрямованого проти польської шляхти. Кургани, як правило, відзначають місця поховань або битв. Цей об'єкт є важливим символом боротьби українського народу за свою незалежність та соціальну справедлицю у XVIII столітті.</p>`,
        clue: "Пам'ятка на честь героїв селянсько-козацького повстання, яке відбулося у 1768 році."
    },
    { 
        name: "Костел Різдва Пресвятої Діви Марії", lat: 50.31849528081428, lng: 29.06615262388855, id: "kostel_rudnya", year: 1772, 
        imagePath: "/static/map_app/images/kostel_rudnya.jpg", imageAlt: "Костел Різдва Пресвятої Діви Марії у с. Рудня", 
        details: `<p><strong>Костел Різдва Пресвятої Діви Марії</strong> — католицький храм, який є пам'яткою архітектури. Часто такі споруди мають унікальні елементи стилю, що поєднують бароко та класицизм, і слугували не лише місцем богослужіння, але й культурними та освітніми центрами. Ці костели є важливим елементом поліської архітектурної спадщини.</p>`,
        clue: "Католицький храм, пам'ятка архітектури, що є важливим елементом поліської спадщини."
    },
    { 
        name: "Поліський природний заповідник", lat: 51.54568598175297, lng: 28.100461600750393, id: "polissia_zapovidnyk", year: 1968, 
        imagePath: "/static/map_app/images/polissia_zapovidnyk.jpg", imageAlt: "Поліський природний заповідник", 
        details: `<p><strong>Поліський природний заповідник</strong> — одна з найбільших природоохоронних зон на Поліссі, створена для збереження унікальних лісових, болотних та озерних екосистем. Тут мешкають рідкісні види тварин і рослин. Заповідник є важливим науковим центром і пропонує екологічні маршрути для туристів, які прагнуть дослідити незайману природу українського Полісся.</p>`,
        clue: "Велика природоохоронна зона на Поліссі, створена для збереження унікальних лісових та болотних екосистем."
    },
];

// ----------------------------------------------------
// 🟢 ФУНКЦІЇ СТИЛЮ ТА ВЗАЄМОДІЇ
// ----------------------------------------------------
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
    // Встановлення стилю при наведенні
    if (layer !== selectedLayer) {
        layer.setStyle({ 
            weight: 5, 
            color: 'white', 
            dashArray: '', 
            fillOpacity: layer.options.fillOpacity 
        });
        if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) { layer.bringToFront(); }
    }
    
    // Додавання підказки (Tooltip)
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
    // Видалення підказки при відведенні миші
    e.target.closeTooltip();
    e.target.unbindTooltip(); 
}

/**
 * Функція для зумування на область та активації маркерів.
 */
window.zoomToFeature = function(e) {
    const layer = e.target;
    
    // Скидаємо стиль з попередньо вибраної області
    if (selectedLayer && selectedLayer !== layer) {
        geoJsonLayer.resetStyle(selectedLayer);
        
        // Повернення інтерактивності для попереднього шару
        const prevLayerElement = selectedLayer.getElement();
        if (prevLayerElement) {
             L.DomUtil.removeClass(prevLayerElement, 'no-pointer');
             prevLayerElement.style.outline = '';
        }
        selectedLayer._path.style.pointerEvents = 'auto'; 
        
        selectedLayer.on('click', zoomToFeature);
        currentMarkers.clearLayers(); 
    }
    
    // 1. Встановлюємо НОВУ область як вибрану
    layer.setStyle({ 
        weight: 6, 
        color: 'white', 
        dashArray: '', 
        fillOpacity: 0.0 // Робимо область прозорою
    });
    
    // ЗБЕРЕЖЕННЯ МЕЖ ОБЛАСТІ ДЛЯ КНОПКИ "НАЗАД З МАРКЕРА"
    mapStateBeforeMarkerZoom = layer.getBounds().pad(0.05);
    
    // ВИДАЛЕННЯ РАМКИ ТА ВИМКНЕННЯ КЛІКІВ
    const layerElement = layer.getElement();
    if (layerElement) {
        L.DomUtil.addClass(layerElement, 'no-pointer'); 
        layerElement.style.outline = 'none'; // ВИДАЛЯЄМО РАМКУ
    }
    
    layer._path.style.pointerEvents = 'none'; // Агресивний фікс SVG
    
    layer.bringToFront(); 
    selectedLayer = layer; 
    
    // Вимикаємо обробник кліків на полігоні
    layer.off('click', zoomToFeature); 
    
    // 2. Визначення імені області для логіки маркерів
    let regionName = 
        layer.feature.properties['name:uk'] || 
        layer.feature.properties.uk || 
        layer.feature.properties.NAME_UKR ||
        layer.feature.properties.name; 
    
    const regionNameLower = regionName ? regionName.toLowerCase() : '';

    // 3. Логіка відображення маркерів ТІЛЬКИ для Житомирської області
    const isZhytomyr = regionName && (regionNameLower.includes('житомирська'));
    
    if (isZhytomyr) {
        addMarkers(monuments); 
    } else {
        currentMarkers.clearLayers(); 
    } 

    // 4. Зум на обрану область
    map.flyToBounds(layer.getBounds().pad(0.05), {
        duration: 0.5, 
        padding: L.point(10, 10) 
    }); 
    
    // 5. Додавання кнопки "Назад"
    if (!resetControlInstance) {
        resetControlInstance = new ResetControl({ position: 'topleft' }); 
        resetControlInstance.addTo(map);
    }

    if (detailsPanel) detailsPanel.style.display = 'none';
}

/**
 * Встановлює обробники подій для кожного регіону GeoJSON.
 */
function onEachFeature(feature, layer) {
    layer.on({
        mouseover: highlightFeature, 
        mouseout: resetHighlight, 
        click: zoomToFeature 
    });
}

/**
 * Додає маркери до кластера.
 */
function addMarkers(monumentsArray) {
    currentMarkers.clearLayers(); 
    const markers = []; 
    monumentsArray.forEach(monument => {
        const marker = L.marker([monument.lat, monument.lng], {icon: defaultMarkerIcon})
            // ДОДАЄМО ПІДКАЗКУ ДЛЯ МАРКЕРА
            .bindTooltip(monument.name, {
                permanent: false, 
                direction: 'top',
                offset: [0, -40], // Зміщення над маркером
                className: 'marker-tooltip'
            }); 
        
        marker.isZoomed = false; 

        // ЛОГІКА ДВОКЛІКОВОЇ АКТИВАЦІЇ
        marker.on('click', function(e) { 
            const clickedMarker = e.target;
            
            if (!clickedMarker.isZoomed) {
                // ПЕРШИЙ КЛІК: ЗУМ до маркера
                const desiredZoomLevel = 15;
                map.flyTo(clickedMarker.getLatLng(), desiredZoomLevel, {
                    duration: 0.5 
                });
                clickedMarker.isZoomed = true;
                
            } else {
                // ДРУГИЙ КЛІК: ВІДКРИТТЯ ДЕТАЛЕЙ
                displayDetails(monument); 
                clickedMarker.isZoomed = false;
            }
        });

        // ВИПРАВЛЕННЯ: Скидання прапорця isZoomed при зміні масштабу карти 
        map.on('zoomend', function() {
            if (map.getZoom() < 14) { 
                marker.isZoomed = false;
            }
        });
        
        markers.push(marker);
    });
    currentMarkers.addLayers(markers);
}

/**
 * Відображає детальну інформацію в бічній панелі.
 */
function displayDetails(monument) {
    if (detailsPanel) {
        
        // Відображення деталей
        let imageHtml = monument.imagePath ? `<img src="${monument.imagePath}" alt="${monument.imageAlt}">` : '';
        detailsPanel.innerHTML = `
            <h2>${monument.name}</h2>
            ${imageHtml} 
            ${monument.details}
            <button onclick="zoomBackToRegion()">Назад на область</button> 
        `;
        detailsPanel.style.display = 'flex'; 
    }
}

/**
 * ФУНКЦІЯ: Зум назад на межі обраної області
 */
window.zoomBackToRegion = function() {
    if (detailsPanel) detailsPanel.style.display = 'none';

    if (mapStateBeforeMarkerZoom) {
        // Використовуємо збережені межі області
        map.flyToBounds(mapStateBeforeMarkerZoom, {
            duration: 0.5
        });
        
        // Скидаємо прапорець isZoomed для всіх маркерів
        currentMarkers.eachLayer(function(marker) {
            marker.isZoomed = false;
        });
        
    } else if (selectedLayer) {
        // Запасний варіант: зум на поточний вибраний шар
        map.flyToBounds(selectedLayer.getBounds().pad(0.05), {
            duration: 0.5
        });
    }
}

/**
 * Кастомний елемент управління "Назад" (на всю Україну).
 */
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
        
        // Позиціювання кнопки "Назад" поруч із зумом
        container.style.marginLeft = '50px'; 
        container.style.marginTop = '18px'; 

        container.innerHTML = 'Назад'; 

        container.onclick = function(){
            // Зум до початкового стану (вся Україна)
            map.flyToBounds(L.latLngBounds(initialCenter, initialCenter).pad(2), {
                maxZoom: initialZoom,
                duration: 0.5 
            });
            currentMarkers.clearLayers();
            if (detailsPanel) detailsPanel.style.display = 'none';

            if (selectedLayer) {
                // Повертаємо стиль до початкового (чорний)
                geoJsonLayer.resetStyle(selectedLayer);
                
                // Повернення інтерактивності GeoJSON
                const layerElement = selectedLayer.getElement();
                if (layerElement) {
                    // ВИДАЛЯЄМО КЛАС 'no-pointer' ТА ПОВЕРТАЄМО СТИЛІ
                    L.DomUtil.removeClass(layerElement, 'no-pointer');
                    
                    // ВИПРАВЛЕННЯ РАМКИ: Знімаємо фокус з елемента!
                    if (layerElement.blur) {
                        layerElement.blur(); 
                    } else if (layerElement.parentNode && layerElement.parentNode.blur) {
                        // Запасний варіант для SVG
                        layerElement.parentNode.blur();
                    }
                    
                    layerElement.style.outline = ''; // Гарантуємо, що outline пустий

                }
                selectedLayer._path.style.pointerEvents = 'auto'; 
                
                
                // Повертаємо обробник кліків для шару
                selectedLayer.on('click', zoomToFeature);

                selectedLayer = null; 
            }
            
            // Видаляємо кнопку "Назад"
            if (resetControlInstance) {
                map.removeControl(resetControlInstance);
                resetControlInstance = null;
            }
            mapStateBeforeMarkerZoom = null; // Скидаємо межі області
            
            // Скидаємо прапорець isZoomed для всіх маркерів
            currentMarkers.eachLayer(function(marker) {
                marker.isZoomed = false;
            });
            
            // ❗ ФІКС: Якщо гра GeoMatching раніше видалила шари, ми їх повертаємо
            if (geoJsonLayer) {
                geoJsonLayer.eachLayer(layer => {
                    if (!map.hasLayer(layer)) {
                        map.addLayer(layer);
                    }
                });
            }
        }
        return container;
    }
});

// ----------------------------------------------------
// 🟢 ЗАВАНТАЖЕННЯ GEOJSON
// ----------------------------------------------------
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
        }).addTo(map);
        
        console.log('Карта регіонів успішно завантажена та відображена.');
        
        // ЗБЕРІГАЄМО НАЗВИ ОБЛАСТЕЙ ДЛЯ ІГРОВОГО ЦЕНТРУ
        window.allRegionNames = data.features.map(feature => {
            return feature.properties['name:uk'] || feature.properties.uk || feature.properties.NAME_UKR || feature.properties.name;
        }).filter(name => name);
    })
    .catch(error => {
        console.error('Критична помибка завантаження GeoJSON або ініціалізації карти:', error);
    });

// 🟢 Додавання стандартного контролу зуму
L.control.zoom({
    position:'topleft' 
}).addTo(map);