// map_app/static/map_app/js/quiz.js

// ----------------------------------------------------
// 🟢 ДОПОМІЖНА ФУНКЦІЯ: Перемішування масиву (ЗРОБЛЕНО ГЛОБАЛЬНОЮ)
// ----------------------------------------------------
window.shuffle = function(array) {
    let currentIndex = array.length, randomIndex;

    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]];
    }

    return array;
}


// ----------------------------------------------------
// 🟢 ІНІЦІАЛІЗАЦІЯ ЕЛЕМЕНТІВ DOM
// ----------------------------------------------------

const startQuizBtn = document.querySelector('.sidebar-btn');
const quizScreen = document.getElementById('quiz-screen');
const regionSelectionView = document.getElementById('region-selection-view');
const typeSelectionView = document.getElementById('type-selection-view');
const regionList = document.getElementById('region-list');
const gameTypeList = document.getElementById('game-type-list');
const mainTitle = document.getElementById('quiz-main-title');
const quizTypeTitle = document.getElementById('quiz-type-title');


// ----------------------------------------------------
// 🟢 ДАНІ (АДАПТОВАНО: ДОДАНО year ТА ЗРОБЛЕНО ГЛОБАЛЬНИМИ)
// ----------------------------------------------------

const regions = [
    { name: "Автономна Республіка Крим", isAvailable: false },
    { name: "Вінницька область", isAvailable: false },
    { name: "Волинська область", isAvailable: false },
    { name: "Дніпропетровська область", isAvailable: false },
    { name: "Донецька область", isAvailable: false },
    { name: "Житомирська область", isAvailable: true, internalName: 'zhytomyr' },
    { name: "Закарпатська область", isAvailable: false },
    { name: "Запорізька область", isAvailable: false },
    { name: "Івано-Франківська область", isAvailable: false },
    { name: "Київська область", isAvailable: false },
    { name: "Кіровоградська область", isAvailable: false },
    { name: "Луганська область", isAvailable: false },
    { name: "Львівська область", isAvailable: false },
    { name: "Миколаївська область", isAvailable: false },
    { name: "Одеська область", isAvailable: false },
    { name: "Полтавська область", isAvailable: false },
    { name: "Рівненська область", isAvailable: false },
    { name: "Сумська область", isAvailable: false },
    { name: "Тернопільська область", isAvailable: false },
    { name: "Харківська область", isAvailable: false },
    { name: "Херсонська область", isAvailable: false },
    { name: "Хмельницька область", isAvailable: false },
    { name: "Черкаська область", isAvailable: false },
    { name: "Чернівецька область", isAvailable: false },
    { name: "Чернігівська область", isAvailable: false },
];

const gameTypes = [
    { name: "Картки", emoji: "🃏", key: "cards", isEnabled: true },
    { name: "Співпадання (Назва & Фото)", emoji: "🖼️", key: "match_photo", isEnabled: true },
    { name: "Співпадання (Назва & Опис)", emoji: "📝", key: "match_description", isEnabled: true },
    { name: "Хронологія", emoji: "⏳", key: "chronology", isEnabled: true },
    { name: "Де знаходиться?", emoji: "📍", key: "location", isEnabled: true },
];

window.zhytomyrQuizSourceData = [
    { name: "Пам'ятний знак на честь заснування Житомира", id: 1, imagePath: "/static/map_app/images/zamkova.jpg", description: "Встановлений на Замковій горі, є символом стародавньої історії міста та його заснування.", year: 1894},
    { name: "Тригірський монастир", id: 2, imagePath: "/static/map_app/images/tryhirsky_monastyr.jpg", description: "Діючий монастир, відомий своєю мальовничою локацією на березі річки Тетерів.", year: 1583},
    { name: "Свято-Василівський Собор", id: 3, imagePath: "/static/map_app/images/ghg.jpg", description: "Один із головних православних храмів міста Житомира, має велике історичне значення.", year: 1888},
    { name: "Бердичівський Кармелітський монастир", id: 4, imagePath: "/static/map_app/images/berdychiv_monastyr.jpg", description: "Потужна фортеця, що функціонує як монастир, відома своїм чудотворним образом Діви Марії.", year: 1630},
    { name: "Руїни палацу Терещенків", id: 5, imagePath: "/static/map_app/images/tereshchenko_denyshi.jpg", description: "Залишки розкішного маєтку відомої династії меценатів у селі Дениші, поруч із скелями.", year: 1911},
    { name: "Поліський природний заповідник", id: 6, imagePath: "/static/map_app/images/polissia_zapovidnyk.jpg", description: "Територія з унікальними екосистемами, включаючи болота, піщані дюни та ліси Полісся.", year: 1968},
    { name: "Палац Бержинських-Терещенків", id: 7, imagePath: "/static/map_app/images/palace_berzhynski.jpg", description: "Елегантна будівля у селі Червоне, приклад неоготичної архітектури, зараз перебуває у стані руїни.", year: 1870},
    { name: "Курган-могила учасників Коліївщини 1768 р.", id: 8, imagePath: "/static/map_app/images/koliivshchyna_kurhan.jpg", description: "Меморіальний насип, присвячений подіям національно-визвольного повстання на Правобережній Україні.", year: 1768},
    { name: "Костел Різдва Пресвятої Діви Марії", id: 9, imagePath: "/static/map_app/images/kostel_rudnya.jpg", description: "Римо-католицький храм, збудований у стилі неоготики, розташований у селі Рудня-Пошта.", year: 1905},
];


// ----------------------------------------------------
// 🟢 ФУНКЦІЇ ПЕРЕКЛЮЧЕННЯ ЕКРАНІВ (ОНОВЛЕНО: Додано очищення)
// ----------------------------------------------------

function renderRegionList() {
    regionList.innerHTML = '';
    const sortedRegions = regions.sort((a, b) => a.name.localeCompare(b.name));

    sortedRegions.forEach(region => {
        const block = document.createElement('div');
        block.className = `region-block ${region.isAvailable ? 'active' : 'disabled'}`;
        
        if (region.isAvailable) {
            block.innerHTML = `<span>${region.name}</span><span class="check-mark">✅</span>`;
            block.addEventListener('click', () => handleRegionClick(region));
        } else {
            block.innerHTML = `<span>${region.name}</span>`;
        }
        regionList.appendChild(block);
    });
}

function renderGameTypeList() {
    gameTypeList.innerHTML = '';
    
    gameTypes.forEach(game => {
        const block = document.createElement('div');
        block.className = `game-type-block ${game.isEnabled ? '' : 'disabled'}`;
        block.textContent = `${game.emoji} ${game.name}`;

        if (game.isEnabled) {
            block.addEventListener('click', () => handleGameClick(game));
        }

        gameTypeList.appendChild(block);
    });
}

window.openRegionSelectionView = function() {
    const existingGameContainer = document.getElementById('game-container');
    if (existingGameContainer) {
        // 💡 ВИПРАВЛЕННЯ: Викликаємо функцію очищення, якщо вона визначена зовнішніми модулями
        if (typeof window.onGameContainerRemoved === 'function') {
            window.onGameContainerRemoved();
        }
        existingGameContainer.remove();
    }
    
    if(quizScreen && regionSelectionView) {
        quizScreen.style.display = 'flex';
        regionSelectionView.style.display = 'flex';
        typeSelectionView.style.display = 'none';
        
        renderRegionList();
    }
}

window.closeQuizScreen = function() {
    if(quizScreen) {
        quizScreen.style.display = 'none';
        
        const existingGameContainer = document.getElementById('game-container');
        if (existingGameContainer) {
             // 💡 ВИПРАВЛЕННЯ: Викликаємо функцію очищення, якщо вона визначена зовнішніми модулями
            if (typeof window.onGameContainerRemoved === 'function') {
                window.onGameContainerRemoved();
            }
            existingGameContainer.remove();
        }
    }
}

let selectedRegion = null;

function handleRegionClick(region) {
    if (region.isAvailable) {
        selectedRegion = region;
        if(regionSelectionView && typeSelectionView) {
            regionSelectionView.style.display = 'none';
            
            if (quizTypeTitle) {
                 quizTypeTitle.textContent = `Оберіть гру:`;
            }
            
            renderGameTypeList();
            typeSelectionView.style.display = 'block';
        }
    }
}

window.goToTypeSelection = function() {
    const gameArea = document.getElementById('game-container');
    if (gameArea) {
        // 💡 ВИПРАВЛЕННЯ: Викликаємо функцію очищення перед видаленням, якщо вона визначена
        if (typeof window.onGameContainerRemoved === 'function') {
            window.onGameContainerRemoved();
        }
        gameArea.remove();
    }
    
    if(typeSelectionView) {
        typeSelectionView.style.display = 'block';
    }
}


// ----------------------------------------------------
// 🟢 ЛОГІКА ГРИ "Співпадання"
// ----------------------------------------------------

let currentGameData = [];
let totalItems = 0;
let currentDragElement = null;
let matchesCount = 0;
let currentGameTypeKey = null;

// !!! КЛЮЧОВА ЗМІНА: handleGameClick тепер підтримує "Картки" !!!
function handleGameClick(game) {
    if (!game.isEnabled) return;
    
    if(typeSelectionView) {
        typeSelectionView.style.display = 'none';
    }

    // Очищуємо стару область гри
    const existingGameContainer = document.getElementById('game-container');
    if (existingGameContainer) {
        // 💡 ВИПРАВЛЕННЯ: Викликаємо функцію очищення перед видаленням
        if (typeof window.onGameContainerRemoved === 'function') {
            window.onGameContainerRemoved();
        }
        existingGameContainer.remove();
    }
    
    switch (game.key) {
        case 'cards':
            if (window.initChronologyCardsGame) {
                window.initChronologyCardsGame(window.zhytomyrQuizSourceData, 'cards');
            } else {
                console.error("Помилка: Не знайдено initChronologyCardsGame. Перевірте підключення chronology_cards_game.js");
                goToTypeSelection();
            }
            break;
            
        case 'match_photo':
        case 'match_description':
            currentGameTypeKey = game.key;
            resetGame();
            initMatchingGame(game.name, game.key);
            break;
            
        case 'chronology':
            if (window.initChronologyGame) {
                window.initChronologyGame(window.zhytomyrQuizSourceData);
            } else {
                console.error("Помилка: Не знайдено initChronologyGame. Перевірте підключення chronology_cards_game.js");
                goToTypeSelection();
            }
            break;
            
        case 'location':
            // 💡 Викликаємо функцію ініціалізації для гри "Де знаходиться?"
            if (window.initLocationGame) {
                window.initLocationGame(window.zhytomyrQuizSourceData);
            } else {
                // 💡 ВИПРАВЛЕННЯ: Забезпечуємо повідомлення про помилку, якщо location_game.js не підключено
                console.error("Помилка: Не знайдено initLocationGame. Перевірте підключення location_game.js.");
                if (mainTitle) mainTitle.textContent = `Помилка: Не завантажено гру "${game.name}"`;
                goToTypeSelection();
            }
            break;
            
        default:
            if (mainTitle) mainTitle.textContent = `ГРА "${game.name}" НЕ РЕАЛІЗОВАНА`;
            typeSelectionView.style.display = 'block';
            break;
    }
}

function resetGame() {
    currentGameData = window.shuffle([...window.zhytomyrQuizSourceData]);
    totalItems = currentGameData.length;
    matchesCount = 0;
}


/**
 * Ініціалізує HTML макет гри.
 */
function initMatchingGame(gameName, gameKey) {
    // 1. Видаляємо стару, якщо існує (Очищення вже відбувається у handleGameClick)
    const existingGameContainer = document.getElementById('game-container');
    if (existingGameContainer) {
        existingGameContainer.remove();
    }

    // 2. Створюємо нову
    const gameContainer = document.createElement('div');
    gameContainer.id = 'game-container';
    
    if (mainTitle) mainTitle.textContent = gameName;
    
    // ... (решта логіки initMatchingGame)
    const nameListClass = (gameKey === 'match_description') ? 'matching-list-container name-list-container-desc' : 'matching-list-container';
    const targetListClass = (gameKey === 'match_description') ? 'matching-list-container description-list-container' : 'matching-list-container target-list-container';

    const targetGridId = (gameKey === 'match_description') ? 'description-target-items' : 'target-grid-items';

    gameContainer.innerHTML = `
        <p id="matches-info" style="color: white; margin-bottom: 10px; font-weight: bold; text-align: center;">Співпадінь: 0/${totalItems}</p>
        <div id="matching-game-area" style="flex-grow: 1; display: flex; overflow: hidden;">
            <div class="${nameListClass}">
                <div id="name-list-items"></div>
            </div>
            <div class="${targetListClass}">
                <div id="${targetGridId}"></div>
            </div>
        </div>
        <div id="game-controls" style="text-align: center; margin-top: 15px;">
            <button id="check-answers-btn" class="quiz-control-btn" style="margin-right: 10px;">Перевірити відповіді</button>
            <button id="start-new-game-btn" class="quiz-control-btn" style="display: none;">Почати гру знову</button>
            <button class="quiz-control-btn" onclick="goToTypeSelection()">⬅️ Змінити гру</button>
        </div>
    `;
    
    if(quizScreen) {
        const header = document.querySelector('.quiz-header');
        if (header) {
            header.insertAdjacentElement('afterend', gameContainer);
        } else {
            quizScreen.appendChild(gameContainer);
        }
    }
    
    // 💡 При запуску гри "Співпадання" ми повинні переконатися, що не висять слухачі з інших ігор.
    // Ми покладаємося на те, що інші ігри очистилися самі.
    
    // Ми встановлюємо "порожню" функцію очищення, яка просто видаляє слухачів гри "Співпадання" 
    // і не конфліктує з іншими іграми.
    window.onGameContainerRemoved = function() {
        const gameArea = document.getElementById('game-container');
        if (gameArea) {
            gameArea.removeEventListener('dragstart', handleDragStart);
            gameArea.removeEventListener('dragend', handleDragEnd);
            gameArea.removeEventListener('dragover', handleGlobalDragOver);
            gameArea.removeEventListener('dragleave', handleGlobalDragLeave);
            gameArea.removeEventListener('drop', handleGlobalDrop);
        }
        // Після видалення ми видаляємо функцію, щоб вона не викликалася для інших ігор
        delete window.onGameContainerRemoved;
    };
    
    renderMatchingItems(gameKey);
    setupEventListeners();
    
    document.getElementById('check-answers-btn').addEventListener('click', checkAnswers);
    document.getElementById('start-new-game-btn').addEventListener('click', () => {
        resetGame();
        initMatchingGame(gameName, gameKey);
    });
}

/**
 * Рендерить назви (прямокутники) та цільові картки (фото/описи).
 */
function renderMatchingItems(gameKey) {
    const nameListItems = document.getElementById('name-list-items');
    const targetGridItems = document.getElementById((gameKey === 'match_description') ? 'description-target-items' : 'target-grid-items');
    if (!nameListItems || !targetGridItems) return;

    nameListItems.innerHTML = '';
    targetGridItems.innerHTML = '';

    const shuffledNames = window.shuffle(currentGameData.map(item => ({ id: item.id, name: item.name })));
    
    const shuffledTargets = window.shuffle(currentGameData.map(item => ({
        id: item.id,
        imagePath: item.imagePath,
        description: item.description
    })));

    // Рендеримо Назви (Draggable)
    shuffledNames.forEach(item => {
        const nameBlock = document.createElement('div');
        nameBlock.className = 'draggable-item';
        nameBlock.textContent = item.name;
        nameBlock.setAttribute('draggable', true);
        nameBlock.dataset.id = item.id;
        nameListItems.appendChild(nameBlock);
    });

    // Рендеримо Цільові елементи (Droppable)
    if (gameKey === 'match_photo') {
        targetGridItems.style.display = 'grid';

        shuffledTargets.forEach(item => {
            const targetBlock = document.createElement('div');
            targetBlock.className = 'droppable-target photo-target';
            targetBlock.dataset.targetId = item.id;
            
            const contentDiv = document.createElement('div');
            contentDiv.className = 'target-content';
            
            const img = document.createElement('img');
            img.src = item.imagePath;
            img.alt = 'Пам\'ятка';
            img.className = 'target-image';
            
            contentDiv.appendChild(img);
            targetBlock.appendChild(contentDiv);
            targetGridItems.appendChild(targetBlock);
        });
    } else if (gameKey === 'match_description') {
        targetGridItems.style.display = 'block';
        
        shuffledTargets.forEach(item => {
            const targetBlock = document.createElement('div');
            targetBlock.className = 'droppable-target droppable-description';
            targetBlock.dataset.targetId = item.id;
            
            const contentDiv = document.createElement('div');
            contentDiv.className = 'target-content';
            
            const descriptionText = document.createElement('p');
            descriptionText.textContent = item.description;
            
            contentDiv.appendChild(descriptionText);
            targetBlock.appendChild(contentDiv);
            targetGridItems.appendChild(targetBlock);
        });
    }
}

// ----------------------------------------------------
// 🟢 ЛОГІКА DRAG & DROP
// ----------------------------------------------------

function setupEventListeners() {
    const gameArea = document.getElementById('game-container');
    if (!gameArea) return;
    
    // !!! КЛЮЧОВЕ ОНОВЛЕННЯ: Тепер слухачі видаляються через window.onGameContainerRemoved !!!
    // Але ми повинні переконатися, що вони НЕ були видалені через onGameContainerRemoved
    // Оскільки ми встановлюємо onGameContainerRemoved вище, це може призвести до дублювання, якщо 
    // setupEventListeners викликається кілька разів.
    
    // Видаляємо та додаємо обробники, щоб уникнути їх дублювання
    gameArea.removeEventListener('dragstart', handleDragStart);
    gameArea.removeEventListener('dragend', handleDragEnd);
    gameArea.removeEventListener('dragover', handleGlobalDragOver);
    gameArea.removeEventListener('dragleave', handleGlobalDragLeave);
    gameArea.removeEventListener('drop', handleGlobalDrop);

    gameArea.addEventListener('dragstart', handleDragStart);
    gameArea.addEventListener('dragend', handleDragEnd);
    gameArea.addEventListener('dragover', handleGlobalDragOver);
    gameArea.addEventListener('dragleave', handleGlobalDragLeave);
    gameArea.addEventListener('drop', handleGlobalDrop);
}

function handleDragStart(e) {
    const target = e.target.closest('.draggable-item');
    if (target && target.draggable) {
        currentDragElement = target;
        e.dataTransfer.setData('text/plain', target.dataset.id);
        setTimeout(() => target.style.opacity = '0.0', 0);
    }
}

function handleDragEnd(e) {
    const target = e.target.closest('.draggable-item');
    if (target) {
        if (!target.parentNode.classList.contains('droppable-target')) {
             target.style.opacity = '1';
        }
    }
    currentDragElement = null;
}

function handleGlobalDragOver(e) {
    e.preventDefault();
    const target = e.target.closest('.droppable-target');
    if (target) {
        target.classList.add('drag-over');
    }
}

function handleGlobalDragLeave(e) {
    const target = e.target.closest('.droppable-target');
    if (target) {
        target.classList.remove('drag-over');
    }
}

function handleGlobalDrop(e) {
    e.preventDefault();
    const target = e.target.closest('.droppable-target');
    const droppedId = e.dataTransfer.getData('text/plain');
    const draggedNameElement = document.querySelector(`.draggable-item[data-id="${droppedId}"]`);

    if (!target || !draggedNameElement) {
        return;
    }

    target.classList.remove('drag-over');
    
    // 1. Повертаємо попередньо скинутий елемент у список
    const existingDropped = target.querySelector('.draggable-item');
    if (existingDropped && existingDropped !== draggedNameElement) {
        existingDropped.style.cssText = '';
        
        document.getElementById('name-list-items').appendChild(existingDropped);
    }
    
    // 2. Вставляємо новий елемент у ціль
    draggedNameElement.style.opacity = '1';
    
    // 3. Обнуляємо всі стилі, які можуть конфліктувати, і дозволяємо CSS працювати
    draggedNameElement.style.cssText = '';
    
    // Встановлюємо лише position: absolute, щоб витягнути з потоку.
    draggedNameElement.style.position = 'absolute';

    if (currentGameTypeKey === 'match_photo') {
        draggedNameElement.style.bottom = '0px';
        draggedNameElement.style.width = '100%';
        target.querySelectorAll('.matched-overlay').forEach(o => o.remove());
    }
    
    // Вставляємо елемент у контейнер вмісту цілі
    target.querySelector('.target-content').appendChild(draggedNameElement);
    
    // 4. Скидаємо будь-які старі класи перевірки
    target.classList.remove('correct', 'incorrect');
    draggedNameElement.draggable = true;
}


// ----------------------------------------------------
// 🟢 ЛОГІКА ПЕРЕВІРКИ ЧЕРЕЗ КНОПКУ
// ----------------------------------------------------

function checkAnswers() {
    let correctCount = 0;
    const targets = document.querySelectorAll('.droppable-target');
    const matchesInfo = document.getElementById('matches-info');
    const checkBtn = document.getElementById('check-answers-btn');
    const restartBtn = document.getElementById('start-new-game-btn');
    
    targets.forEach(target => {
        const droppedItem = target.querySelector('.draggable-item');
        target.classList.remove('correct', 'incorrect');
        
        if (droppedItem) {
            const correctId = target.dataset.targetId;
            const droppedId = droppedItem.dataset.id;

            if (correctId === droppedId) {
                target.classList.add('correct');
                correctCount++;
                droppedItem.style.backgroundColor = '#4CAF50';
            } else {
                target.classList.add('incorrect');
                droppedItem.style.backgroundColor = '#f44336';
            }
            
            // Забороняємо подальше перетягування
            droppedItem.draggable = false;
        } else {
            // Якщо ціль порожня
            target.classList.add('incorrect');
        }
    });

    // 3. Відображення результатів та керування кнопками
    matchesInfo.textContent = `Співпадінь: ${correctCount}/${totalItems}`;
    
    checkBtn.style.display = 'none';
    restartBtn.style.display = 'inline-block';
    
    // 4. Якщо все правильно
    if (correctCount === totalItems) {
        if (mainTitle) mainTitle.textContent = "🎉 ГРУ ЗАВЕРШЕНО! 🎉";
        matchesInfo.style.color = '#4CAF50';
    }
    
    // 5. Вимикаємо слухачів drop/dragover для цілей після перевірки
    const gameArea = document.getElementById('game-container');
    if (gameArea) {
        gameArea.removeEventListener('drop', handleGlobalDrop);
        gameArea.removeEventListener('dragover', handleGlobalDragOver);
        gameArea.removeEventListener('dragleave', handleGlobalDragLeave);
    }
}


// ----------------------------------------------------
// 🟢 ОБРОБНИКИ ПОДІЙ (Запуск)
// ----------------------------------------------------

if (startQuizBtn) {
    startQuizBtn.addEventListener('click', () => {
        startQuizBtn.blur();
        window.openRegionSelectionView();
    });
}