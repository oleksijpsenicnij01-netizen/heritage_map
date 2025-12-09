// map_app/static/map_app/js/chronology_cards_game.js

// ----------------------------------------------------
// 🟢 ГЛОБАЛЬНІ ЗМІННІ / ФУНКЦІЇ ДЛЯ РЕЖИМІВ
// ----------------------------------------------------

let studyCardsData = []; 
let studyCardsPool = []; 
let learnedCardsSet = new Set(); 
let currentStudyCard = null; 
let currentChronologyHintIndex = 0;
let currentChronologyData = [];
let sortedChronologyData = [];
let fullSourceData = []; // Зберігаємо повні вихідні дані

// DRAG & DROP
let draggedElement = null; // 💡 ПОТРІБНО ОЧИЩЕННЯ
// ... (інші глобальні змінні, якщо є)

// ----------------------------------------------------
// 🛑 ДОДАНІ ДАНІ ПІДКАЗОК (Для надійності)
// ----------------------------------------------------
// Ключ - це частина назви пам'ятки, яка використовується для пошуку.

const HINTS_MAP = [
    { name_part: "Тригірський монастир", hint: "Ця пам'ятка пов'язана із річкою Тетерів і була заснована у 16 столітті." },
    { name_part: "Бердичівський Кармелітський монастир", hint: "Це потужний оборонний монастир. Його заснування пов'язане з орденом Босих кармелітів у 17 столітті." },
    { name_part: "Коліївщина", hint: "Це місце пов'язане із народним повстанням, яке відбулося у 18 столітті. Його дату можна знайти в назві." },
    { name_part: "Костел Різдва Пресвятої Діви Марії", hint: "Це архітектурна пам'ятка 18 століття. Вона знаходиться в місті Житомир." },
    { name_part: "Палац Бержинських-Терещенків", hint: "Цей палац збудований наприкінці 18 століття, відомий своєю архітектурою класицизму." },
    { name_part: "Руїни палацу Терещенків", hint: "Належав роду цукрозаводчиків Терещенків, зведений у 19 столітті." },
    { name_part: "Свято-Василіїв Собор", hint: "Це головний православний храм у місті Овруч, зведений на честь князя Володимира Великого у 19 столітті." },
    { name_part: "заснування Житомира", hint: "Символ найдавнішої історії міста. Його дата заснування вважається 884 роком." },
    { name_part: "Поліський природний заповідник", hint: "Це природоохоронний об'єкт. Його було створено найпізніше з усього списку, у другій половині 20 століття." },
];

/**
 * Функція для пошуку відповідної підказки в HINTS_MAP.
 */
function findHintForName(name) {
    const foundHint = HINTS_MAP.find(hint => name.includes(hint.name_part));
    return foundHint ? foundHint.hint : null;
}

// ----------------------------------------------------
// 💡 ДОДАНА ФУНКЦІЯ ОЧИЩЕННЯ
// ----------------------------------------------------

/**
 * 🛠️ Видаляє всі обробники подій, додані грою "Хронологія", перед видаленням контейнера.
 * Ця функція викликається з quiz.js для запобігання конфліктам Drag & Drop.
 */
window.onGameContainerRemoved = function() {
    const listContainer = document.getElementById('chronology-list');
    
    // Видаляємо слухачі, додані до контейнера списку
    if (listContainer) {
        // Ми не маємо доступу до визначень функцій handleDragOver та handleDrop,
        // тому для гарантованого очищення просто видаляємо слухачі,
        // додані до listContainer, та скидаємо глобальні змінні.
        listContainer.removeEventListener('dragover', handleDragOver);
        listContainer.removeEventListener('dragenter', (e) => e.preventDefault());
        listContainer.removeEventListener('dragleave', () => {});
        listContainer.removeEventListener('drop', handleDrop);
        
        // Видаляємо dragstart з усіх елементів
        const items = listContainer.querySelectorAll('.chronology-item');
        // Якщо слухачі додані не на item, а на listContainer, то це не потрібно.
        // Оскільки в оригінальному коді item.addEventListener('dragstart', handleDragStart);
        // краще їх теж спробувати видалити.
        items.forEach(item => item.removeEventListener('dragstart', handleDragStart));
    }
    
    // Очищаємо глобальні змінні
    draggedElement = null;
    currentChronologyHintIndex = 0;
    
    // Видаляємо функцію, щоб вона не викликалася, якщо наступна гра не є "Співпадання"
    delete window.onGameContainerRemoved;
};

// ----------------------------------------------------
// 🟢 ЛОГІКА ГРИ "КАРТКИ" (CARDS) - БЕЗ ЗМІН
// ----------------------------------------------------

/**
 * Ініціалізує гру "Картки".
 */
window.initChronologyCardsGame = function(sourceData) {
    if (!sourceData || !Array.isArray(sourceData) || sourceData.length === 0) {
        console.error("Помилка: Немає коректних даних для гри Картки.");
        window.goToTypeSelection();
        return;
    }
    
    const existingGameContainer = document.getElementById('game-container');
    if (existingGameContainer) existingGameContainer.remove();
    
    const mainTitle = document.getElementById('quiz-main-title');
    const quizScreen = document.getElementById('quiz-screen');

    const gameContainer = document.createElement('div');
    gameContainer.id = 'game-container';
    gameContainer.classList.add('chronology-cards-game');

    if (mainTitle) mainTitle.textContent = 'Картки';

    // *** HTML-структура для режиму карток ***
    gameContainer.innerHTML = `
        <p id="game-info" style="color: white; margin-bottom: 15px; font-weight: bold; text-align: center;">Натисніть на картку, щоб перевернути (покаже назву).</p>
        
        <div id="cards-study-area" class="card-study-area">
        </div>

        <div id="cards-controls" class="card-controls" style="text-align: center; margin-top: 25px;">
            <button id="not-learned-btn" class="quiz-control-btn not-learned-btn" style="display: none;">❌ Не вивчив</button>
            <button id="learned-btn" class="quiz-control-btn learned-btn" style="display: none;">✅ Вивчив</button>
        </div>
        
        <div id="game-controls" style="text-align: center; margin-top: 25px;">
            <button class="quiz-control-btn" onclick="window.goToTypeSelection()">⬅️ Змінити гру</button>
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
    
    initializeStudyMode(sourceData);
}

function initializeStudyMode(data) {
    studyCardsData = data.map((item, index) => ({
        ...item,
        uniqueId: item.id || index 
    }));
    
    learnedCardsSet.clear();
    studyCardsPool = window.shuffle([...studyCardsData]); 
    
    const learnedBtn = document.getElementById('learned-btn');
    const notLearnedBtn = document.getElementById('not-learned-btn');

    if (learnedBtn) learnedBtn.onclick = null;
    if (notLearnedBtn) notLearnedBtn.onclick = null;
    
    if (learnedBtn) learnedBtn.addEventListener('click', () => handleCardAction(true));
    if (notLearnedBtn) notLearnedBtn.addEventListener('click', () => handleCardAction(false));

    displayNextStudyCard();
}

function handleCardAction(learned) {
    if (!currentStudyCard) return;

    if (learned) {
        learnedCardsSet.add(currentStudyCard.uniqueId);
    } else {
        studyCardsPool.push(currentStudyCard);
    }
    
    displayNextStudyCard();
}

function displayNextStudyCard() {
    const cardArea = document.getElementById('cards-study-area');
    const infoText = document.getElementById('game-info');
    const learnedBtn = document.getElementById('learned-btn');
    const notLearnedBtn = document.getElementById('not-learned-btn');

    if (studyCardsPool.length === 0 && learnedCardsSet.size === studyCardsData.length) {
        if (cardArea) cardArea.innerHTML = '<div class="study-finished"><h2>🥳 Вітаємо! Усі картки вивчено!</h2><p>Можна змінити гру.</p></div>';
        if (infoText) infoText.textContent = `Прогрес: ${studyCardsData.length} з ${studyCardsData.length}`;
        if (learnedBtn) learnedBtn.style.display = 'none';
        if (notLearnedBtn) notLearnedBtn.style.display = 'none';
        return;
    } 
    
    if (studyCardsPool.length === 0 && learnedCardsSet.size !== studyCardsData.length) {
        const unlearnedData = studyCardsData.filter(card => !learnedCardsSet.has(card.uniqueId));
        studyCardsPool.push(...window.shuffle(unlearnedData));

        if (studyCardsPool.length === 0) { 
             return;
        }
    }

    currentStudyCard = studyCardsPool.shift(); 
    if (!currentStudyCard) return; 

    if (cardArea) cardArea.innerHTML = createCardHTML(currentStudyCard);
    
    if (infoText) infoText.textContent = `Прогрес: ${learnedCardsSet.size} з ${studyCardsData.length}`;
    
    if (learnedBtn) learnedBtn.style.display = 'inline-block';
    if (notLearnedBtn) notLearnedBtn.style.display = 'inline-block';

    const cardElement = document.getElementById('current-study-card');
    if (cardElement) {
        cardElement.addEventListener('click', toggleCardFlip);
    }
}

function toggleCardFlip(e) {
    const innerCard = e.currentTarget.querySelector('.card-inner-flip');
    if (innerCard) {
        innerCard.classList.toggle('flipped');
    }
}

function createCardHTML(cardData) {
    return `
        <div id="current-study-card" class="card-flip-container" style="width: 300px; height: 400px; margin: 30px auto; perspective: 1000px; cursor: pointer;">
            <div class="card-inner-flip" 
                style="transform-style: preserve-3d; transition: transform 0.6s; position: relative; width: 100%; height: 100%;">
                
                <div class="card-face card-front" 
                    style="position: absolute; width: 100%; height: 100%; backface-visibility: hidden; display: flex; justify-content: center; align-items: center; border-radius: 10px; background-color: #388e3c; color: white; box-shadow: 0 4px 8px rgba(0,0,0,0.2); transform: rotateY(180deg); padding: 15px;">
                    <h3 style="text-align: center;">${cardData.name}</h3>
                </div>
                
                <div class="card-face card-back" 
                    style="position: absolute; width: 100%; height: 100%; backface-visibility: hidden; transform: rotateY(0deg); border-radius: 10px; background-color: #333; color: white; padding: 15px; overflow-y: auto; text-align: left;">
                    <img src="${cardData.imagePath}" alt="${cardData.name}" class="card-back-img" 
                        style="width: 100%; max-height: 150px; object-fit: cover; border-radius: 5px;">
                    <p style="margin-top: 10px; font-size: 0.9em;">${cardData.description}</p>
                    <p style="text-align: center; margin-top: 10px; opacity: 0.7; font-style: italic;">Натисніть, щоб побачити назву</p>
                </div>
            </div>
        </div>
        
        <style>
        .card-inner-flip.flipped {
            transform: rotateY(180deg);
        }
        .card-inner-flip:not(.flipped) {
            transform: rotateY(0deg);
        }
        </style>
    `;
}

// ----------------------------------------------------
// 🚀 ЛОГІКА ГРИ "ХРОНОЛОГІЯ" - БЕЗ ЗМІН (ВКЛЮЧАЮЧИ ЛОГІКУ D&D)
// ----------------------------------------------------


function handleDragStart(e) {
    draggedElement = e.target;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', e.target.dataset.id); 
    e.target.classList.add('dragging');
}

function handleDragOver(e) {
    e.preventDefault();
    
    const target = e.target.closest('.chronology-item');
    
    // Припускаємо, що draggedElement визначений глобально
    if (target && target !== draggedElement) { 
        const rect = target.getBoundingClientRect();
        
        // Визначає, чи курсор знаходиться в нижній половині цільового елемента.
        // next: true, якщо в нижній половині; false, якщо у верхній.
        const next = (e.clientY - rect.top) / rect.height > 0.5;
        
        const parent = target.parentNode;
        
        // КЛЮЧОВЕ ВИПРАВЛЕННЯ: Використовуємо nextElementSibling (ігнорує текстові вузли) 
        // та коректний тернарний оператор.
        // Якщо next=true (нижня половина), вставляємо ПЕРЕД наступним ЕЛЕМЕНТОМ.
        // Якщо next=false (верхня половина), вставляємо ПЕРЕД target.
        parent.insertBefore(draggedElement, next ? target.nextElementSibling : target);
    }
}

function handleDrop(e) {
    e.preventDefault();
    if (draggedElement) {
        draggedElement.classList.remove('dragging');
        draggedElement = null;
    }
    const listItems = document.querySelectorAll('#chronology-list .chronology-item');
    // Оновлюємо currentChronologyData, використовуючи ID елементів у списку
    currentChronologyData = Array.from(listItems).map(item => fullSourceData.find(d => String(d.id) === item.dataset.id));
    
    updateChronologyIndicatorHeight(); 
}

// 💡 Функція для оновлення висоти стрілки
function updateChronologyIndicatorHeight() {
    const listContainer = document.getElementById('chronology-list');
    const indicator = document.getElementById('chronology-order-indicator');

    if (listContainer && indicator) {
        // Гарантуємо, що висота стрілки відповідає висоті списку
        setTimeout(() => {
             // 40px - це приблизна сума вертикальних маржинів міток "Найновіше/Найстаріше"
             indicator.style.minHeight = `${listContainer.clientHeight + 40}px`; 
        }, 50);
    }
}

/**
 * Рендерить ігрове поле "Хронологія" та ініціалізує Drag&Drop.
 */
function renderChronologyGame(data) {
    const listContainer = document.getElementById('chronology-list');
    if (!listContainer) return;

    // 1. Сортуємо дані (використовуємо дані з гарантованими підказками)
    sortedChronologyData = [...data].sort((a, b) => a.year - b.year);
    // 2. Перемішуємо для поточної гри
    currentChronologyData = window.shuffle([...data]); 
    
    listContainer.innerHTML = '';

    // 3. Рендеринг елементів
    currentChronologyData.forEach(item => {
        const itemBlock = document.createElement('div');
        itemBlock.className = 'chronology-item';
        
        let displayName = item.name;
        const yearRegex = /\s\d{4}\s*р\.$/i; 
        displayName = displayName.replace(yearRegex, '').trim(); 

        itemBlock.textContent = displayName;
        // 🛑 КЛЮЧОВЕ ВИПРАВЛЕННЯ: ID елемента в data-id має бути рядком
        itemBlock.dataset.id = String(item.id); 
        itemBlock.setAttribute('draggable', true);
        
        itemBlock.addEventListener('dragstart', handleDragStart);
        listContainer.appendChild(itemBlock);
    });
    
    // 4. Додавання обробників Drag&Drop
    listContainer.addEventListener('dragover', handleDragOver);
    listContainer.addEventListener('dragenter', (e) => e.preventDefault());
    listContainer.addEventListener('dragleave', () => {});
    listContainer.addEventListener('drop', handleDrop);
    
    const checkBtn = document.getElementById('check-chronology-btn');
    const resetBtn = document.getElementById('reset-chronology-btn');
    
    if (checkBtn) checkBtn.style.display = 'inline-block';
    if (resetBtn) resetBtn.style.display = 'none';
    if (checkBtn) checkBtn.onclick = checkChronologyAnswers;
    if (resetBtn) resetBtn.onclick = () => renderChronologyGame(data);
    
    currentChronologyHintIndex = 0;
    const hintBtn = document.getElementById('hint-btn');
    if (hintBtn) {
        hintBtn.textContent = '💡 Підказка (1)';
        hintBtn.style.display = 'inline-block';
        // Видалення старих слухачів та додавання нового (для надійності)
        hintBtn.onclick = null;
        hintBtn.onclick = showChronologyHint;
    }
    
    // 5. Оновлюємо висоту стрілки
    updateChronologyIndicatorHeight();
}

/**
 * Показує модальне вікно з підказкою.
 */
function showChronologyHint() {
    const hintBtn = document.getElementById('hint-btn');
    const modal = document.getElementById('hint-modal');
    const listItems = Array.from(document.querySelectorAll('#chronology-list .chronology-item'));
    
    // Створюємо пул ID елементів, що стоять не на своєму місці (або всі ID)
    const unplacedItemsIDs = listItems
        .filter((item, index) => {
            const correctItem = sortedChronologyData[index];
            return correctItem && item.dataset.id !== String(correctItem.id); // Порівнюємо як рядки
        })
        .map(item => item.dataset.id);

    const poolToHintIDs = unplacedItemsIDs.length > 0 
        ? unplacedItemsIDs 
        : listItems.map(item => item.dataset.id); 

    if (poolToHintIDs.length === 0) {
        if (document.getElementById('hint-title')) document.getElementById('hint-title').innerHTML = `Усі елементи на місці!`;
        if (document.getElementById('hint-text')) document.getElementById('hint-text').innerHTML = `Вам не потрібна підказка. Натисніть "Перевірити порядок"!`;
        if (modal) modal.style.display = 'flex';
        return;
    }
    
    const nextHintItemID = poolToHintIDs[currentChronologyHintIndex % poolToHintIDs.length];
    
    // 🛑 КЛЮЧОВЕ ВИПРАВЛЕННЯ: Шукаємо повний об'єкт, порівнюючи ID як рядки/числа, залежно від типу d.id
    const hintItem = fullSourceData.find(d => String(d.id) === nextHintItemID);

    if (!hintItem) {
        console.error("Помилка: Не вдалося знайти повні дані для елемента, ID:", nextHintItemID);
        if (document.getElementById('hint-title')) document.getElementById('hint-title').innerHTML = `Помилка: Немає даних`;
        if (document.getElementById('hint-text')) document.getElementById('hint-text').innerHTML = `Не вдалося отримати повну інформацію для підказки. (ID: ${nextHintItemID})`;
        if (modal) modal.style.display = 'flex';
        return;
    }

    currentChronologyHintIndex = (currentChronologyHintIndex + 1);
    
    // Генеруємо підказку
    const defaultHint = `Пам'ятка **${hintItem.name}** була заснована приблизно в **${Math.floor(Math.abs(hintItem.year) / 100) * 100}** столітті. (Підказка за замовчуванням)`;
    const hintText = hintItem.hint || findHintForName(hintItem.name) || defaultHint;

    if (document.getElementById('hint-title')) document.getElementById('hint-title').innerHTML = `Підказка до "${hintItem.name}"`;
    if (document.getElementById('hint-text')) document.getElementById('hint-text').innerHTML = hintText;
    if (modal) modal.style.display = 'flex';
    
    const nextHintNumber = (currentChronologyHintIndex % poolToHintIDs.length) + 1;
    if (hintBtn) hintBtn.textContent = `💡 Підказка (${nextHintNumber})`;
}

/**
 * Перевіряє відповіді.
 */
function checkChronologyAnswers() {
    const listItems = document.querySelectorAll('#chronology-list .chronology-item');
    let correctCount = 0;
    
    listItems.forEach((item, index) => {
        const itemId = item.dataset.id;
        const correctItem = sortedChronologyData[index]; 
        
        if (!correctItem) {
            item.textContent += ' (Помилка даних)';
            item.classList.add('incorrect');
            return;
        }
        
        const correctId = String(correctItem.id);
        
        item.classList.remove('correct', 'incorrect');
        
        if (itemId === correctId) {
            item.classList.add('correct');
            correctCount++;
        } else {
            item.classList.add('incorrect');
        }
        
        item.textContent = `${correctItem.name} (${correctItem.year} р.)`;

        item.setAttribute('draggable', false);
    });

    const checkBtn = document.getElementById('check-chronology-btn');
    const resetBtn = document.getElementById('reset-chronology-btn');
    const hintBtn = document.getElementById('hint-btn'); 
    const instructions = document.getElementById('chronology-instructions');

    if (correctCount === sortedChronologyData.length) {
        if (instructions) instructions.innerHTML = `<h3>🎉 Вітаємо! Ідеальна хронологія!</h3>`;
        if (checkBtn) checkBtn.style.display = 'none';
        if (hintBtn) hintBtn.style.display = 'none'; 
    } else {
        if (instructions) instructions.innerHTML = `<h3>❌ Результат: ${correctCount}/${sortedChronologyData.length} правильних</h3>`;
        if (checkBtn) checkBtn.style.display = 'none';
        if (hintBtn) hintBtn.style.display = 'none'; 
        if (resetBtn) resetBtn.style.display = 'inline-block';
    }
}

// ----------------------------------------------------
// 🟢 ЛОГІКА ГРИ "ХРОНОЛОГІЯ" - ЗАПУСК ГРИ
// ----------------------------------------------------

/**
 * Ініціалізує гру "Хронологія".
 */
window.initChronologyGame = function(sourceData) {
    if (!sourceData || !Array.isArray(sourceData) || sourceData.length === 0) {
        console.error("Помилка: Немає коректних даних для гри Хронологія.");
        window.goToTypeSelection();
        return;
    }
    
    // 🛑 КЛЮЧОВЕ ВИПРАВЛЕННЯ: Гарантуємо наявність поля 'hint'
    fullSourceData = sourceData.map(item => {
        const calculatedHint = findHintForName(item.name);

        return {
            ...item,
            // Якщо у вихідних даних підказки немає, беремо з HINTS_MAP
            hint: item.hint || calculatedHint 
        };
    });

    const existingGameContainer = document.getElementById('game-container');
    if (existingGameContainer) existingGameContainer.remove();
    
    const mainTitle = document.getElementById('quiz-main-title');
    const quizScreen = document.getElementById('quiz-screen');

    const gameContainer = document.createElement('div');
    gameContainer.id = 'game-container';
    gameContainer.classList.add('chronology-game');

    if (mainTitle) mainTitle.textContent = 'Хронологія';

    // 🚀 HTML-код: Стрілка зліва + Flex-контейнер
    gameContainer.innerHTML = `
        <div id="chronology-instructions" class="instructions-panel">
            <p>Розташуйте пам'ятки в хронологічному порядку (від найстарішої до новітньої).</p>
        </div>
        
        <div id="chronology-game-area" class="chronology-game-area" 
            style="display: flex; flex-direction: row; align-items: stretch; justify-content: center; gap: 20px;">
            
            <div id="chronology-order-indicator" 
                style="display: flex; flex-direction: column; align-items: center; justify-content: space-between; margin: 20px 0 20px 0; max-height: 100%; min-width: 80px;">
                <span class="order-label top-label" style="color: white; font-weight: bold; margin-bottom: 5px;">Найстаріше</span>
                <div class="order-line-arrow" style="width: 2px; flex-grow: 1; background-color: #4CAF50; position: relative; margin: 5px 0;">
                    <div style="width: 0; height: 0; border-left: 5px solid transparent; border-right: 5px solid transparent; border-top: 10px solid #4CAF50; position: absolute; bottom: -10px; left: -4px;"></div>
                </div>
                <span class="order-label bottom-label" style="color: white; font-weight: bold; margin-top: 5px;">Найновіше</span>
            </div>
            
            <div id="chronology-list-container" style="flex-grow: 1; max-width: 600px;">
                <div id="chronology-list" class="chronology-list">
                    </div>
            </div>
            
        </div>
        
        <div id="game-controls" style="text-align: center; margin-top: 25px;">
            <button id="hint-btn" class="quiz-control-btn hint-btn">💡 Підказка (1)</button>
            <button id="check-chronology-btn" class="quiz-control-btn">Перевірити порядок</button>
            <button id="reset-chronology-btn" class="quiz-control-btn" style="display: none;">Перемішати знову</button>
            <button class="quiz-control-btn" onclick="window.goToTypeSelection()">⬅️ Змінити гру</button>
        </div>
        
        <div id="hint-modal" class="modal-overlay" style="display:none; position: fixed; z-index: 1000; left: 0; top: 0; width: 100%; height: 100%; overflow: auto; background-color: rgba(0,0,0,0.4); justify-content: center; align-items: center;">
            <div class="modal-content" style="background-color: #333; margin: auto; padding: 20px; border: 1px solid #888; width: 80%; max-width: 400px; border-radius: 10px; color: white; text-align: center;">
                <span class="close-btn" style="color: #aaa; float: right; font-size: 28px; font-weight: bold; cursor: pointer;">&times;</span>
                <h3 id="hint-title">Підказка...</h3>
                <p id="hint-text" style="margin: 15px 0;"></p>
                <button id="modal-close-btn" class="quiz-control-btn" style="margin-top: 10px;">Закрити</button>
            </div>
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
    
    const hintBtn = document.getElementById('hint-btn');
    if (hintBtn) hintBtn.onclick = showChronologyHint;
    
    const modal = document.getElementById('hint-modal');
    const closeBtn = modal ? modal.querySelector('.close-btn') : null;
    const modalCloseBtn = document.getElementById('modal-close-btn');
    
    if (closeBtn) closeBtn.onclick = () => modal.style.display = 'none';
    if (modalCloseBtn) modalCloseBtn.onclick = () => modal.style.display = 'none';

    renderChronologyGame(fullSourceData);
}