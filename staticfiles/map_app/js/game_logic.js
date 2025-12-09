// map_app/static/map_app/js/game_logic.js

// ----------------------------------------------------
// 🟢 ЛОКАЛЬНІ ЗМІННІ ДЛЯ ІГОР
// ----------------------------------------------------
const gameCenterPanel = document.getElementById('game-center-panel');
const openGamesBtn = document.getElementById('open-games-btn');
let selectedRegionForGame = 'Житомирська область'; // Область за замовчуванням
let gameData = []; // Для Matching
let selectedCard = null; // Для Matching
let flashcardsData = []; // Для Flashcards
let currentCardIndex = 0; // Для Flashcards
let timelineData = []; // Для Timeline
let originalOrder = []; // Для Timeline
let draggedElement = null; // Для Timeline Drag & Drop
let geoMatchingData = []; // Для GeoMatching
let draggableMarker = null; // Для GeoMatching
const MAX_DISTANCE_KM = 50; // Для GeoMatching

// ----------------------------------------------------
// 🟢 ФУНКЦІЇ-ХЕЛПЕРИ
// ----------------------------------------------------
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// ----------------------------------------------------
// 🟢 ІГРОВИЙ ЦЕНТР (ОСНОВНІ ФУНКЦІЇ)
// ----------------------------------------------------
/**
 * 🔑 Відображає список доступних областей для гри.
 */
window.openGameCenter = function() {
    gameCenterPanel.style.display = 'block';
    // detailsPanel - змінна з map_init.js
    if (window.detailsPanel) window.detailsPanel.style.display = 'none'; 
    map.dragging.disable(); 
    
    // allRegionNames - змінна з map_init.js
    const regions = window.allRegionNames || [];
    
    // Створення списку областей
    let regionsHtml = regions.map(region => {
        const isSelected = region === selectedRegionForGame;
        const borderStyle = isSelected ? 'border: 2px solid #FFEB3B;' : 'border: 2px solid #555;';
        const checkMark = isSelected ? '✅' : '';

        // NOTE: Логіка доступності все ще базується на "Житомирська"
        const isEnabled = region.toLowerCase().includes('житомирська');
        const disabledClass = isEnabled ? '' : 'disabled';
        const pointerEvent = isEnabled ? `onclick="selectRegionForGame('${region}')"` : '';
        const hoverStyles = isEnabled ? `onmouseover="this.style.borderColor='white'" onmouseout="this.style.borderColor='${isSelected ? '#FFEB3B' : '#555'}'"` : '';
        
        return `
            <div class="region-select-card ${disabledClass}" 
                 data-region="${region}" 
                 ${pointerEvent}
                 ${hoverStyles}
                 style="${borderStyle} padding: 15px; margin: 10px; cursor: ${isEnabled ? 'pointer' : 'default'}; background: #333; border-radius: 8px; text-align: left; display: inline-block; width: 250px; transition: border-color 0.2s; opacity: ${isEnabled ? 1 : 0.6};">
                <h3 style="margin: 0; color: white; display: flex; justify-content: space-between; align-items: center;">
                    ${region} ${checkMark}
                </h3>
                <p style="margin: 5px 0 0; font-size: 0.9em; color: #ccc;">${isEnabled ? 'Доступно для гри' : 'Тимчасово недоступно'}</p>
            </div>
        `;
    }).join('');
    
    gameCenterPanel.innerHTML = `
        <button id="close-games-btn" onclick="closeGameCenter()">Закрити [X]</button>
        <div id="game-center-content">
            <h2>Оберіть область для гри</h2>
            <p>Виберіть регіон, щоб побачити доступні для нього ігри та тести.</p>
            <div id="region-selection-grid" style="text-align: center;">
                ${regionsHtml}
            </div>
        </div>
        <div id="game-container"></div>
    `;
    
    // Оновлюємо стилі, щоб відобразити вибраний регіон
    document.querySelectorAll('.region-select-card').forEach(card => {
        if (card.getAttribute('data-region') === selectedRegionForGame) {
            card.style.borderColor = '#FFEB3B';
        }
    });
}

/**
 * 🔑 Вибирає область і показує список ігор.
 */
window.selectRegionForGame = function(regionName) {
    selectedRegionForGame = regionName;
    
    // Логіка: поки доступна лише Житомирська
    const isZhytomyr = regionName.toLowerCase().includes('житомирська');
    
    const gamesContent = isZhytomyr ? `
        <div class="game-card" onclick="startGeoMatchingGame()">
            <h3>Розмісти пам'ятку на карті 🗺️</h3>
            <p>Перетягніть об'єкт на його справжнє місце на карті області.</p>
        </div>
        <div class="game-card" onclick="startFlashcardsGame()">
            <h3>Картки Пам'яті 🧠</h3>
            <p>Перевірте, чи пам'ятаєте ви назву за коротким описом.</p>
        </div>
        <div class="game-card" onclick="startMatchingGame('name_photo')">
            <h3>Співставлення: Назва ↔️ Фото</h3>
            <p>Поєднайте назву пам'ятки з її зображенням.</p>
        </div>
        <div class="game-card" onclick="startMatchingGame('name_clue')">
            <h3>Співставлення: Назва ↔️ Опис-Підказка</h3>
            <p>Знайдіть правильний **короткий опис** для кожної пам'ятки.</p>
        </div>
        <div class="game-card" onclick="startTimelineGame()">
            <h3>Хронологія ⏳</h3>
            <p>Розташуйте пам'ятки в історичному порядку (від найстарішої до новітньої).</p>
        </div>
    ` : `
        <h3 style="color: #f44336; margin-top: 50px;">Ігри для ${regionName} тимчасово недоступні.</h3>
        <p>Наразі доступні лише пам'ятки Житомирської області.</p>
    `;

    gameCenterPanel.innerHTML = `
        <button id="close-games-btn" onclick="closeGameCenter()">Закрити [X]</button>
        <button onclick="openGameCenter()" style="position: absolute; top: 20px; left: 20px; background: #555; border: none; color: white; padding: 10px; border-radius: 4px; cursor: pointer;">← До вибору областей</button>
        
        <div id="game-center-content">
            <h2>Ігри та Тести для ${regionName}</h2>
            <div id="game-selection-grid" style="text-align: center;">${gamesContent}</div>
        </div>
        <div id="game-container"></div>
    `;
}

/**
 * 🔑 Закриває Ігровий Центр.
 */
window.closeGameCenter = function() {
    gameCenterPanel.style.display = 'none';
    map.dragging.enable(); 
    
    // Повертаємо обробник кліків на GeoJSON шарі після гри
    if (window.geoJsonLayer) window.geoJsonLayer.eachLayer(layer => layer.on('click', window.zoomToFeature));
    
    // ФІКС: Видаляємо всі тимчасові GeoMatching шари з карти
    map.eachLayer(function(layer) {
        if (layer.options.isGameLayer) {
            map.removeLayer(layer);
        }
    });
    
    // Також, переконаємося, що всі GeoJSON шари повернені на карту, якщо вони були видалені грою GeoMatching
    if (window.geoJsonLayer) {
        window.geoJsonLayer.eachLayer(layer => {
            if (!map.hasLayer(layer)) {
                map.addLayer(layer);
                
                // Якщо був selectedLayer (він зберігається у map_init.js), повертаємо його стиль
                if (window.selectedLayer && layer === window.selectedLayer) {
                     window.geoJsonLayer.resetStyle(layer);
                     
                     // Повертаємо інтерактивність
                     const layerElement = layer.getElement();
                     if (layerElement) L.DomUtil.removeClass(layerElement, 'no-pointer');
                     layer._path.style.pointerEvents = 'auto'; 
                }
            }
        });
    }
}

// ----------------------------------------------------
// 🟢 РЕАЛІЗАЦІЯ ГРИ "СПІВСТАВЛЕННЯ"
// ----------------------------------------------------
/**
 * Ініціює гру "Співставлення".
 * @param {string} type - 'name_photo' або 'name_clue'
 */
window.startMatchingGame = function(type) {
    const gameContainer = document.getElementById('game-center-content');
    gameContainer.innerHTML = '<h3>Співставлення...</h3>';
    
    // monuments - змінна з map_init.js
    const filteredMonuments = window.monuments.filter(m => m.lat && m.lng && m.clue);
    
    gameData = [];
    filteredMonuments.forEach(monument => {
        // Елемент A: Назва (Завжди)
        gameData.push({
            id: monument.id, type: 'name', content: monument.name, matchId: monument.id, isMatched: false
        });

        // Елемент B: Фото або Опис (CLUE)
        let contentB;
        let typeB;

        if (type === 'name_photo') {
            typeB = 'photo';
            contentB = `<img src="${monument.imagePath}" alt="${monument.imageAlt}" style="width: 100%; height: 150px; object-fit: cover; border-radius: 4px;">`;
        } else if (type === 'name_clue') {
            typeB = 'clue';
            contentB = `<p style="font-size: 0.9em; padding: 5px; text-align: center;">${monument.clue}</p>`;
        }

        gameData.push({
            id: monument.id, type: typeB, content: contentB, matchId: monument.id, isMatched: false
        });
    });

    shuffleArray(gameData);
    renderMatchingGame(type);
}

/**
 * Відображає інтерфейс гри.
 */
function renderMatchingGame(type) {
    const gameContainer = document.getElementById('game-center-content');
    const gameTypeTitle = type === 'name_photo' ? 'Назва ↔️ Фото' : 'Назва ↔️ Опис-Підказка';
    
    let html = `
        <div id="matching-game">
            <button onclick="selectRegionForGame(selectedRegionForGame)" style="position: absolute; top: 20px; left: 20px; background: #555; border: none; color: white; padding: 10px; border-radius: 4px; cursor: pointer;">← До вибору ігор</button>
            <button id="close-games-btn" onclick="closeGameCenter()">Закрити [X]</button>
            
            <h2 style="margin-top: 50px;">Гра: ${gameTypeTitle}</h2>
            <div id="matching-grid" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-top: 30px; text-align: center;">
    `;

    gameData.forEach((card, index) => {
        const isMatchedClass = card.isMatched ? 'matched' : '';
        
        html += `
            <div class="match-card ${card.type} ${isMatchedClass}" 
                 data-index="${index}" 
                 data-match-id="${card.matchId}" 
                 onclick="handleCardClick(this, ${index})"
                 style="background-color: #444; border: 2px solid ${card.isMatched ? '#4CAF50' : '#888'}; height: 200px; padding: 10px; border-radius: 6px; cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: center; overflow: hidden; position: relative;">
                ${card.content}
                ${card.isMatched ? '<span style="position: absolute; font-size: 30px; color: #4CAF50;">✅</span>' : ''}
            </div>
        `;
    });

    html += `
            </div>
            <p id="game-message" style="margin-top: 20px; font-size: 1.2em;"></p>
        </div>
    `;
    
    gameContainer.innerHTML = html;
}

/**
 * Обробляє клік по картці.
 */
window.handleCardClick = function(element, index) {
    const card = gameData[index];
    const messageElement = document.getElementById('game-message');

    if (card.isMatched) {
        messageElement.textContent = "Ця пара вже знайдена!";
        return;
    }

    if (selectedCard === null) {
        selectedCard = { element, index, matchId: card.matchId };
        element.style.border = '2px solid #FFEB3B'; 
        messageElement.textContent = "Вибрано першу картку. Оберіть пару.";
    } else if (selectedCard.index === index) {
        selectedCard.element.style.border = '2px solid #888';
        selectedCard = null;
        messageElement.textContent = "Вибір скасовано.";
    } else {
        const secondCard = card;
        
        if (selectedCard.matchId === secondCard.matchId) {
            gameData[selectedCard.index].isMatched = true;
            gameData[index].isMatched = true;

            selectedCard.element.style.border = '2px solid #4CAF50';
            element.style.border = '2px solid #4CAF50';

            // Оновлюємо вміст, щоб додати ✅ 
            selectedCard.element.innerHTML += '<span style="position: absolute; font-size: 30px; color: #4CAF50;">✅</span>';
            element.innerHTML += '<span style="position: absolute; font-size: 30px; color: #4CAF50;">✅</span>';

            messageElement.textContent = "Збіг знайдено! ✅";
            
            selectedCard = null;
            
            if (gameData.every(c => c.isMatched)) {
                messageElement.textContent = "Вітаємо! Ви знайшли всі пари! 🎉";
            }
            
        } else {
            selectedCard.element.style.border = '2px solid #F44336';
            element.style.border = '2px solid #F44336';
            messageElement.textContent = "Спробуйте ще раз! ❌";
            
            setTimeout(() => {
                selectedCard.element.style.border = '2px solid #888';
                element.style.border = '2px solid #888';
                selectedCard = null;
            }, 800);
        }
    }
}

// ----------------------------------------------------
// 🟢 РЕАЛІЗАЦІЯ ГРИ "КАРТКИ ПАМ'ЯТІ"
// ----------------------------------------------------
/**
 * Ініціює гру "Картки Пам'яті".
 */
window.startFlashcardsGame = function() {
    // monuments - змінна з map_init.js
    flashcardsData = window.monuments.filter(m => m.clue).map(m => ({
        question: m.clue,
        answer: m.name,
        learned: false
    }));
    
    shuffleArray(flashcardsData);
    currentCardIndex = 0;
    
    renderFlashcardGame();
}

/**
 * Відображає інтерфейс гри "Картки Пам'яті".
 */
function renderFlashcardGame(showAnswer = false) {
    const card = flashcardsData[currentCardIndex];
    const gameContainer = document.getElementById('game-center-content');

    if (!card) {
        // Завершення гри
        gameContainer.innerHTML = `
            <button id="close-games-btn" onclick="closeGameCenter()">Закрити [X]</button>
            <button onclick="selectRegionForGame(selectedRegionForGame)" style="position: absolute; top: 20px; left: 20px; background: #555; border: none; color: white; padding: 10px; border-radius: 4px; cursor: pointer;">← До вибору ігор</button>
            <h2 style="margin-top: 150px;">Вітаємо! Ви вивчили всі картки! 🎉</h2>
            <p>Ваш словниковий запас пам'яток Житомирщини оновлено.</p>
            <button onclick="startFlashcardsGame()" style="background-color: #FFEB3B; color: #1a1a1a; border: none; padding: 10px 25px; cursor: pointer; border-radius: 4px; margin-top: 15px;">Грати ще раз</button>
        `;
        return;
    }

    const cardContent = showAnswer ? 
        `<h3 style="color: #4CAF50;">${card.answer}</h3>` : 
        `<p style="font-size: 1.2em;">${card.question}</p>`;
        
    const controls = showAnswer ? 
        `
        <div style="margin-top: 20px;">
            <button onclick="handleFlashcardResult(true)" style="background-color: #4CAF50; margin-right: 15px; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer;">Знав ✅</button>
            <button onclick="handleFlashcardResult(false)" style="background-color: #F44336; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer;">Не знав ❌</button>
        </div>
        ` : 
        `<button onclick="renderFlashcardGame(true)" style="background-color: #2196F3; margin-top: 20px; color: white; border: none; padding: 10px 25px; cursor: pointer; border-radius: 4px;">Показати відповідь</button>`;

    gameContainer.innerHTML = `
        <button id="close-games-btn" onclick="closeGameCenter()">Закрити [X]</button>
        <button onclick="selectRegionForGame(selectedRegionForGame)" style="position: absolute; top: 20px; left: 20px; background: #555; border: none; color: white; padding: 10px; border-radius: 4px; cursor: pointer;">← До вибору ігор</button>
        
        <h2 style="margin-top: 50px;">Картки Пам'яті (${currentCardIndex + 1} / ${flashcardsData.length})</h2>
        <div id="flashcard" style="width: 400px; height: 250px; background-color: #444; margin: 30px auto; border-radius: 8px; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px; text-align: center; border: 2px solid #FFEB3B;">
            ${cardContent}
        </div>
        ${controls}
    `;
}

/**
 * Обробляє результат вивчення картки.
 */
window.handleFlashcardResult = function(known) {
    const currentCard = flashcardsData[currentCardIndex];
    
    if (known) {
        flashcardsData.splice(currentCardIndex, 1);
    } else {
        // Якщо не знав, переміщуємо картку в кінець
        flashcardsData.push(currentCard);
        flashcardsData.splice(currentCardIndex, 1);
    }
    
    currentCardIndex = 0; // Завжди починаємо з першої картки в новому масиві
    
    renderFlashcardGame();
}

// ----------------------------------------------------
// 🟢 РЕАЛІЗАЦІЯ ГРИ "ХРОНОЛОГІЯ" (TIMELINE)
// ----------------------------------------------------
/**
 * Ініціює гру "Хронологія".
 */
window.startTimelineGame = function() {
    // monuments - змінна з map_init.js
    timelineData = window.monuments.filter(m => m.year).map(m => ({
        id: m.id,
        name: m.name,
        year: m.year,
        isCorrect: false
    }));
    
    // Створюємо масив правильного порядку для перевірки
    originalOrder = [...timelineData].sort((a, b) => a.year - b.year);
    
    shuffleArray(timelineData);
    renderTimelineGame();
}

/**
 * Відображає інтерфейс гри "Хронологія".
 */
function renderTimelineGame() {
    const gameContainer = document.getElementById('game-center-content');
    
    let html = `
        <div id="timeline-game">
            <button onclick="selectRegionForGame(selectedRegionForGame)" style="position: absolute; top: 20px; left: 20px; background: #555; border: none; color: white; padding: 10px; border-radius: 4px; cursor: pointer;">← До вибору ігор</button>
            <button id="close-games-btn" onclick="closeGameCenter()">Закрити [X]</button>
            
            <h2 style="margin-top: 50px;">Гра: Хронологія (від найстарішої до новітньої)</h2>
            <div id="timeline-drag-zone" style="max-width: 450px; margin: 30px auto; background: #444; padding: 15px; border-radius: 8px;">
                ${timelineData.map(item => `
                    <div class="timeline-card" 
                         draggable="true" 
                         data-id="${item.id}"
                         id="item-${item.id}"
                         ondragstart="handleDragStart(event)"
                         ondragover="handleDragOver(event)"
                         ondrop="handleDrop(event)"
                         ondragend="handleDragEnd(event)"
                         style="background-color: #555; border: 2px solid ${item.isCorrect ? '#4CAF50' : '#888'}; margin-bottom: 10px; padding: 15px; border-radius: 4px; cursor: grab; display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-weight: bold;">${item.year}</span>
                        <span>${item.name}</span>
                    </div>
                `).join('')}
            </div>
            <button onclick="checkTimelineOrder()" style="background-color: #2196F3; color: white; border: none; padding: 10px 25px; cursor: pointer; border-radius: 4px; margin-top: 10px;">Перевірити порядок</button>
            <p id="timeline-message" style="margin-top: 20px; font-size: 1.2em;"></p>
        </div>
    `;
    
    gameContainer.innerHTML = html;
}

// 🟢 Функції для Drag and Drop
window.handleDragStart = function(e) {
    draggedElement = e.target;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target.outerHTML);
    e.target.style.opacity = '0.4';
}

window.handleDragOver = function(e) {
    e.preventDefault(); 
    e.dataTransfer.dropEffect = 'move';
    
    const targetElement = e.target.closest('.timeline-card');
    if (targetElement && targetElement !== draggedElement) {
        if (!targetElement.classList.contains('drag-over')) {
            document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
            targetElement.classList.add('drag-over');
        }
    }
}

window.handleDrop = function(e) {
    e.preventDefault();
    document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
    
    const dropTarget = e.target.closest('.timeline-card');
    
    if (dropTarget && draggedElement !== dropTarget) {
        const dropZone = document.getElementById('timeline-drag-zone');
        
        const rect = dropTarget.getBoundingClientRect();
        const next = (e.clientY > rect.top + rect.height / 2);
        
        if (next) {
            dropZone.insertBefore(draggedElement, dropTarget.nextSibling);
        } else {
            dropZone.insertBefore(draggedElement, dropTarget);
        }
        
        updateTimelineDataOrder();
    }
}

window.handleDragEnd = function(e) {
    e.target.style.opacity = '1';
    draggedElement = null;
    document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
}

// 🟢 Оновлення масиву відповідно до порядку на екрані
function updateTimelineDataOrder() {
    const idsInOrder = Array.from(document.getElementById('timeline-drag-zone').children).map(el => el.getAttribute('data-id'));
    
    let newOrder = [];
    idsInOrder.forEach(id => {
        const item = timelineData.find(d => d.id === id);
        if (item) newOrder.push(item);
    });
    
    timelineData = newOrder;
}

// 🟢 Перевірка порядку
window.checkTimelineOrder = function() {
    updateTimelineDataOrder();
    const messageElement = document.getElementById('timeline-message');
    
    let correctCount = 0;
    
    for (let i = 0; i < timelineData.length; i++) {
        const isCorrect = timelineData[i].id === originalOrder[i].id;
        timelineData[i].isCorrect = isCorrect;
        
        const cardElement = document.getElementById(`item-${timelineData[i].id}`);
        cardElement.style.border = `2px solid ${isCorrect ? '#4CAF50' : '#F44336'}`;
        
        if (isCorrect) correctCount++;
    }
    
    if (correctCount === timelineData.length) {
        messageElement.textContent = "Вітаємо! Вся хронологія правильна! 🎉";
        messageElement.style.color = '#4CAF50';
    } else {
        messageElement.textContent = `Ви правильно розмістили ${correctCount} з ${timelineData.length} пам'яток. Спробуйте ще раз!`;
        messageElement.style.color = '#FFEB3B';
    }
}

// ----------------------------------------------------
// 🟢 РЕАЛІЗАЦІЯ ГРИ "РОЗМІСТИ ПАМ'ЯТКУ" (GEO-MATCHING)
// ----------------------------------------------------
/**
 * Ініціює гру "Розмісти пам'ятку".
 */
window.startGeoMatchingGame = function() {
    const gameContainer = document.getElementById('game-center-content');
    
    // 1. Готуємо дані для гри
    geoMatchingData = window.monuments.map(m => ({
        ...m,
        isPlaced: false,
        isCorrectlyPlaced: false
    }));
    shuffleArray(geoMatchingData);
    
    renderGeoMatchingGame();
    
    // 2. Зум на область Житомирщини 
    if (window.geoJsonLayer) {
        window.geoJsonLayer.eachLayer(layer => {
            const regionName = layer.feature.properties['name:uk'] || layer.feature.properties.name;
            if (regionName && regionName.toLowerCase().includes('житомирська')) {
                map.flyToBounds(layer.getBounds().pad(0.05));
                
                // Вимикаємо кліки на регіонах під час гри
                layer.off('click', window.zoomToFeature);
                
                // ВИПРАВЛЕННЯ: Робимо область прозорою
                layer.setStyle({ 
                    weight: 6, 
                    color: 'white', 
                    dashArray: '', 
                    fillOpacity: 0.0
                });
            } else {
                // Тимчасово приховуємо інші області
                map.removeLayer(layer);
            }
        });
    }
    
    // 3. Увімкнення зони скидання
    map.on('dragenter', handleMapDragEnter);
    map.on('dragleave', handleMapDragLeave);
    map.on('dragover', handleMapDragOver);
    map.on('drop', handleMapDrop);
}

/**
 * Відображає інтерфейс гри "Розмісти пам'ятку".
 */
function renderGeoMatchingGame() {
    const gameContainer = document.getElementById('game-center-content');
    
    const draggableCardsHtml = geoMatchingData
        .filter(m => !m.isPlaced)
        .map(m => `
            <div class="draggable-monument-card" 
                 draggable="true" 
                 data-id="${m.id}"
                 ondragstart="handleMonumentDragStart(event)"
                 style="background-color: #333; border: 2px solid #ddd; padding: 5px; margin: 5px; border-radius: 4px; text-align: center; cursor: grab;">
                <img src="${m.imagePath}" alt="${m.name}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 4px;">
                <p style="font-size: 0.8em; margin: 5px 0 0;">${m.name}</p>
            </div>
        `).join('');

    const scoreHtml = geoMatchingData.map(m => `
        <span style="display: inline-block; margin-right: 10px; color: ${m.isCorrectlyPlaced ? '#4CAF50' : (m.isPlaced ? '#F44336' : '#999')};">
            ${m.name}: ${m.isCorrectlyPlaced ? '✅' : (m.isPlaced ? '❌' : '...')}
        </span>
    `).join('');

    gameContainer.innerHTML = `
        <div id="geo-matching-game">
            <button onclick="endGeoMatchingGame()" style="position: absolute; top: 20px; left: 20px; background: #555; border: none; color: white; padding: 10px; border-radius: 4px; cursor: pointer;">← Завершити гру</button>
            <button id="close-games-btn" onclick="closeGameCenter()">Закрити [X]</button>
            
            <h2 style="margin-top: 50px;">Гра: Розмісти пам'ятку на карті</h2>
            <p>Перетягніть об'єкт на його приблизне місце розташування на карті.</p>
            
            <div id="draggable-panel" style="max-height: 250px; overflow-y: auto; background: rgba(0,0,0,0.5); border: 1px dashed #FFEB3B; padding: 15px; border-radius: 8px; margin-top: 20px; display: flex; flex-wrap: wrap; justify-content: center; gap: 10px;">
                ${draggableCardsHtml}
            </div>
            
            <div id="game-results" style="margin-top: 20px; padding: 10px; background: #222; border-radius: 4px; text-align: left;">
                <p style="font-weight: bold; margin-bottom: 5px;">Рахунок:</p>
                ${scoreHtml}
            </div>
            
            <p id="geo-matching-message" style="margin-top: 20px; font-size: 1.2em;"></p>
        </div>
    `;
}

// 🟢 Обробники Drag and Drop для карток
window.handleMonumentDragStart = function(e) {
    const monumentId = e.target.getAttribute('data-id');
    e.dataTransfer.setData('text/plain', monumentId);
    e.dataTransfer.effectAllowed = 'copyMove';
    
    // Створення фантомного маркера для візуалізації
    draggableMarker = L.circleMarker([0, 0], {
        radius: 10,
        color: '#FFEB3B',
        fillColor: '#FFEB3B',
        fillOpacity: 0.8,
        opacity: 1,
        isGameLayer: true 
    }).addTo(map);
    
    // Додаємо тимчасовий обробник для оновлення положення маркера
    map.on('mousemove', updateDraggableMarkerPosition);
}

// 🟢 Оновлення положення фантомного маркера
function updateDraggableMarkerPosition(e) {
    if (draggableMarker) {
        draggableMarker.setLatLng(e.latlng);
    }
}

// 🟢 Обробники Drag and Drop для карти
function handleMapDragEnter(e) {
    L.DomUtil.addClass(map.getContainer(), 'drag-target-active');
}

function handleMapDragLeave(e) {
    L.DomUtil.removeClass(map.getContainer(), 'drag-target-active');
}

function handleMapDragOver(e) {
    e.preventDefault(); 
    e.dataTransfer.dropEffect = 'copyMove';
}

function handleMapDrop(e) {
    e.preventDefault();
    L.DomUtil.removeClass(map.getContainer(), 'drag-target-active');
    
    if (draggableMarker) {
        map.removeLayer(draggableMarker);
        draggableMarker = null;
        map.off('mousemove', updateDraggableMarkerPosition);
    }

    const monumentId = e.dataTransfer.getData('text/plain');
    if (!monumentId) return;

    const latlng = map.mouseEventToLatLng(e.originalEvent);
    const monument = geoMatchingData.find(m => m.id === monumentId);

    if (monument) {
        checkPlacement(monument, latlng);
    }
}

// 🟢 Перевірка розміщення маркера
function checkPlacement(monument, droppedLatLng) {
    const originalLatLng = L.latLng(monument.lat, monument.lng);
    
    // Використовуємо метод Leaflet для розрахунку відстані в метрах, потім переводимо в км
    const distanceMeters = droppedLatLng.distanceTo(originalLatLng);
    const distanceKm = distanceMeters / 1000;

    let isCorrect = distanceKm <= MAX_DISTANCE_KM;
    
    monument.isPlaced = true;
    monument.isCorrectlyPlaced = isCorrect;
    
    // 1. Створюємо постійний маркер у місці скидання
    L.marker(droppedLatLng, { 
        icon: isCorrect ? 
            L.icon({ iconUrl: '/static/map_app/leaflet/images/marker-icon-green.png', iconSize: [25, 41] }) : 
            L.icon({ iconUrl: '/static/map_app/leaflet/images/marker-icon-red.png', iconSize: [25, 41] }),
        isGameLayer: true
    })
    .bindPopup(`<strong>${monument.name}</strong><br>Відхилення: ${distanceKm.toFixed(1)} км.`)
    .addTo(map)
    .openPopup();
    
    // 2. Якщо неправильно, показуємо правильне місце
    if (!isCorrect) {
        L.marker(originalLatLng, { 
            icon: L.icon({ iconUrl: '/static/map_app/leaflet/images/marker-icon-gold.png', iconSize: [25, 41] }),
            isGameLayer: true
        })
        .bindTooltip(`Правильно: ${monument.name}`, { permanent: true, direction: 'right' })
        .addTo(map);
    }

    // 3. Оновлення інтерфейсу
    renderGeoMatchingGame();

    if (geoMatchingData.every(m => m.isPlaced)) {
        const correctCount = geoMatchingData.filter(m => m.isCorrectlyPlaced).length;
        document.getElementById('geo-matching-message').innerHTML = `
            <strong>Гра завершена!</strong> Ви правильно розмістили ${correctCount} з ${geoMatchingData.length} пам'яток.
        `;
    }
}

// 🟢 Завершення гри та повернення до вибору ігор
window.endGeoMatchingGame = function() {
    // 1. Вимикаємо обробники D&D
    map.off('dragenter', handleMapDragEnter);
    map.off('dragleave', handleMapDragLeave);
    map.off('dragover', handleMapDragOver);
    map.off('drop', handleMapDrop);
    
    // 2. Видаляємо всі ігрові шари
    map.eachLayer(function(layer) {
        if (layer.options.isGameLayer) {
            map.removeLayer(layer);
        }
    });

    // 3. Повертаємо усі GeoJSON області на карту
    if (window.geoJsonLayer) {
        window.geoJsonLayer.eachLayer(layer => {
            map.addLayer(layer);
            // Повертаємо обробник кліків
            layer.on('click', window.zoomToFeature);
        });
    }

    // 4. Повернення до вибору ігор
    selectRegionForGame(selectedRegionForGame);
}

// ----------------------------------------------------
// 🟢 ІНІЦІАЛІЗАЦІЯ
// ----------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    // openGamesBtn - змінна з початку цього файлу
    openGamesBtn.onclick = window.openGameCenter;
});