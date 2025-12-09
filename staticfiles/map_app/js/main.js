// map_app/static/map_app/js/main.js

let geoJsonLayer; 
let currentMarkers = L.markerClusterGroup(); 
let resetControlInstance = null;
let selectedLayer = null; 
let mapStateBeforeMarkerZoom = null; 
const detailsPanel = document.getElementById('details-panel');

// ----------------------------------------------------
// 🟢 КРОК 1: КОНСТАНТИ ТА ІНІЦІАЛІЗАЦІЯ КАРТИ
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

// 🛑 КРИТИЧНЕ ВИПРАВЛЕННЯ: Використовуємо window.map для глобальної доступності
window.map = L.map('map', {
    zoomControl: false, 
    maxZoom: 18 
}).setView(initialCenter, initialZoom); 

// 🟢 Створення спеціальних панелей для Z-Index
window.map.createPane('tiles-pane').style.zIndex = 200; 
window.map.createPane('geojson-pane').style.zIndex = 600; 
window.map.createPane('marker-pane').style.zIndex = 700; 

// 🟢 ДОДАВАННЯ СУПУТНИКОВОГО ШАРУ GOOGLE HYBRID
const googleHybridLayer = L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
    maxZoom: 20,
    attribution: 'Map data ©2024 Google',
    pane: 'tiles-pane' 
}).addTo(window.map);

currentMarkers = L.markerClusterGroup({ 
    pane: 'marker-pane' 
});
currentMarkers.addTo(window.map);

// --- ДАНІ З ПОВНИМИ ОПИСАМИ (без змін) --- 
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


// ----------------------------------------------------
// 🟢 КРОК 2: ФУНКЦІЇ СТИЛЮ ТА ВЗАЄМОДІЇ
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
function zoomToFeature(e) {
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
        fillOpacity: 0.0
    });
    
    // ЗБЕРЕЖЕННЯ МЕЖ ОБЛАСТІ ДЛЯ КНОПКИ "НАЗАД З МАРКЕРА"
    mapStateBeforeMarkerZoom = layer.getBounds().pad(0.05);
    
    // ВИДАЛЕННЯ РАМКИ ТА ВИМКНЕННЯ КЛІКІВ
    const layerElement = layer.getElement();
    if (layerElement) {
        L.DomUtil.addClass(layerElement, 'no-pointer'); 
        layerElement.style.outline = 'none'; 
    }
    
    layer._path.style.pointerEvents = 'none';
    
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
    window.map.flyToBounds(layer.getBounds().pad(0.05), { // 🛑 ВИПРАВЛЕНО
        duration: 0.5, 
        padding: L.point(10, 10) 
    }); 
    
    // 5. Додавання кнопки "Назад"
    if (!resetControlInstance) {
        resetControlInstance = new ResetControl({ position: 'topleft' }); 
        resetControlInstance.addTo(window.map); // 🛑 ВИПРАВЛЕНО
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
            // ДОДАЄМО ТІЛЬКИ ПІДКАЗКУ (Tooltip) ДЛЯ МАРКЕРА
            .bindTooltip(monument.name, {
                permanent: false, 
                direction: 'top',
                offset: [0, -40], 
                className: 'marker-tooltip'
            }); 
        
        marker.isZoomed = false; 

        // ЛОГІКА КЛІКІВ (ОДИН КЛІК АБО ДВА КЛІКИ)
        marker.on('click', function(e) { 
            const clickedMarker = e.target;
            
            if (!clickedMarker.isZoomed) {
                // ПЕРШИЙ КЛІК: ЗУМ до маркера
                const desiredZoomLevel = 15;
                window.map.flyTo(clickedMarker.getLatLng(), desiredZoomLevel, { // 🛑 ВИПРАВЛЕНО
                    duration: 0.5 
                });
                clickedMarker.isZoomed = true;
                
            } else {
                // ДРУГИЙ КЛІК: ВІДКРИТТЯ ДЕТАЛЕЙ У ЦЕНТРАЛЬНІЙ ПАНЕЛІ
                displayDetails(monument); 
                clickedMarker.isZoomed = false;
            }
        });

        // Скидання прапорця isZoomed при зміні масштабу карти 
        window.map.on('zoomend', function() { // 🛑 ВИПРАВЛЕНО
            if (window.map.getZoom() < 14) { 
                marker.isZoomed = false;
            }
        });
        
        markers.push(marker);
    });
    currentMarkers.addLayers(markers);
}

/**
 * Відображає детальну інформацію в центральній панелі.
 */
function displayDetails(monument) {
    if (detailsPanel) {
        
        // 1. Позиціонування панелі по центру карти (стилі в style.css)
        
        // 2. Відображення деталей
        let imageHtml = monument.imagePath ? `<img src="${monument.imagePath}" alt="${monument.imageAlt}">` : '';
        detailsPanel.innerHTML = `
            <h2>${monument.name}</h2>
            ${imageHtml} 
            ${monument.details}
            <button onclick="window.zoomBackToRegion()">Назад на область</button>         `;
        // Робимо панель видимою
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
        window.map.flyToBounds(mapStateBeforeMarkerZoom, { // 🛑 ВИПРАВЛЕНО
            duration: 0.5
        });
        
        // Скидаємо прапорець isZoomed для всіх маркерів
        currentMarkers.eachLayer(function(marker) {
            marker.isZoomed = false;
        });
        
    } else if (selectedLayer) {
        // Запасний варіант: зум на поточний вибраний шар
        window.map.flyToBounds(selectedLayer.getBounds().pad(0.05), { // 🛑 ВИПРАВЛЕНО
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
            window.map.flyToBounds(L.latLngBounds(initialCenter, initialCenter).pad(2), { // 🛑 ВИПРАВЛЕНО
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
                    
                    // Знімаємо фокус з елемента!
                    if (layerElement.blur) {
                        layerElement.blur(); 
                    } else if (layerElement.parentNode && layerElement.parentNode.blur) {
                        layerElement.parentNode.blur();
                    }
                    
                    layerElement.style.outline = '';

                }
                selectedLayer._path.style.pointerEvents = 'auto'; 
                
                
                // Повертаємо обробник кліків для шару
                selectedLayer.on('click', zoomToFeature);

                selectedLayer = null; 
            }
            
            // Видаляємо кнопку "Назад"
            if (resetControlInstance) {
                window.map.removeControl(resetControlInstance); // 🛑 ВИПРАВЛЕНО
                resetControlInstance = null;
            }
            mapStateBeforeMarkerZoom = null; 
            
            // Скидаємо прапорець isZoomed для всіх маркерів
            currentMarkers.eachLayer(function(marker) {
                marker.isZoomed = false;
            });
        }
        return container;
    }
});

// ====================================================
// 🚀 НОВІ ГЛОБАЛЬНІ ФУНКЦІЇ ДЛЯ ІГР (QUIZ)
// ====================================================

/**
 * 🟢 [НОВА ФУНКЦІЯ 1] Надає доступ до даних пам'яток Житомирської області.
 */
window.getZhytomyrData = function() {
    return monuments;
};

/**
 * 🟢 [НОВА ФУНКЦІЯ 2] Перемикає карту між режимами "Основний" та "Вікторина".
 * @param {string} mode - 'quiz' або 'main'.
 */
window.toggleMapMode = function(mode) {
    if (mode === 'quiz') {
        // --- 1. ПЕРЕХІД У РЕЖИМ ВІКТОРИНИ ---
        
        // Вимикаємо ВСЮ інтерактивність карти (крім перетягування Drag & Drop)
        window.map.dragging.disable(); // 🛑 ВИПРАВЛЕНО
        window.map.touchZoom.disable(); // 🛑 ВИПРАВЛЕНО
        window.map.doubleClickZoom.disable(); // 🛑 ВИПРАВЛЕНО
        window.map.scrollWheelZoom.disable(); // 🛑 ВИПРАВЛЕНО
        window.map.boxZoom.disable(); // 🛑 ВИПРАВЛЕНО
        window.map.keyboard.disable(); // 🛑 ВИПРАВЛЕНО
        if (window.map.tap) window.map.tap.disable(); // 🛑 ВИПРАВЛЕНО

        // 2. Встановлюємо супутниковий шар (він вже доданий)
        // Ми не робимо тут ніяких дій, оскільки Google Hybrid вже доданий.
        
        // 3. Зум на Житомирську область. 
        if (mapStateBeforeMarkerZoom) {
             window.map.flyToBounds(mapStateBeforeMarkerZoom, { // 🛑 ВИПРАВЛЕНО
                 duration: 0.5,
                 padding: L.point(10, 10)
             });
        }
        
        // 4. Зміна стилю Житомирської області: жирний, білий, без заливки
        if (selectedLayer) {
            selectedLayer.setStyle({ 
                weight: 6,       // Жирний
                color: 'white',  // Білий
                fillOpacity: 0.0 // Без заливки
            });
            selectedLayer.bringToFront();
            
            // Забезпечуємо можливість взаємодії з шаром під грою, якщо потрібно
            const layerElement = selectedLayer.getElement();
            if (layerElement) {
                 L.DomUtil.removeClass(layerElement, 'no-pointer'); 
                 layerElement.style.outline = '';
            }
        }
        
        // 5. Видаляємо кнопку "Назад" (вона не потрібна у вікторині)
        if (resetControlInstance) {
             window.map.removeControl(resetControlInstance); // 🛑 ВИПРАВЛЕНО
             resetControlInstance = null;
        }


    } else if (mode === 'main') {
        // --- ПОВЕРНЕННЯ У ЗВИЧАЙНИЙ РЕЖИМ ---
        
        // Вмикаємо інтерактивність 
        window.map.dragging.enable(); // 🛑 ВИПРАВЛЕНО
        window.map.touchZoom.enable(); // 🛑 ВИПРАВЛЕНО
        window.map.doubleClickZoom.enable(); // 🛑 ВИПРАВЛЕНО
        window.map.scrollWheelZoom.enable(); // 🛑 ВИПРАВЛЕНО
        window.map.boxZoom.enable(); // 🛑 ВИПРАВЛЕНО
        window.map.keyboard.enable(); // 🛑 ВИПРАВЛЕНО
        if (window.map.tap) window.map.tap.enable(); // 🛑 ВИПРАВЛЕНО
        
        // Повертаємо зум до регіону (або до початкового стану, якщо regionName = null)
        window.zoomBackToRegion();
        
        // Відновлюємо маркер-кластер для кліків
        if (selectedLayer && mapStateBeforeMarkerZoom) {
             // Повертаємо маркер-кластер, як було в main.js (з кліками та підказками)
             addMarkers(monuments); 
             // Повертаємо кнопку "Назад"
             if (!resetControlInstance) {
                 resetControlInstance = new ResetControl({ position: 'topleft' }); 
                 resetControlInstance.addTo(window.map); // 🛑 ВИПРАВЛЕНО
             }
        } else {
             // Якщо selectedLayer не вибраний (наприклад, гра почалася з повноекранної карти), 
             // просто очищаємо маркери та повертаємо на всю Україну (викликано в zoomBackToRegion)
             currentMarkers.clearLayers();
        }
        
        // Якщо selectedLayer існує, повертаємо йому стиль (прозорий з білим контуром)
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

// ----------------------------------------------------
// 🟢 КРОК 3: ЗАВАНТАЖЕННЯ GEOJSON
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
        }).addTo(window.map); // 🛑 ВИПРАВЛЕНО
        
        console.log('Карта регіонів успішно завантажена та відображена.');
    })
    .catch(error => {
        console.error('Критична помибка завантаження GeoJSON або ініціалізації карти:', error);
    });


// 🟢 Додавання стандартного контролу зуму
L.control.zoom({
    position:'topleft' 
}).addTo(window.map); // 🛑 ВИПРАВЛЕНО