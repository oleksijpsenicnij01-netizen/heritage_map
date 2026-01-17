let studyCardsData = [];
let studyCardsPool = [];
let learnedCardsSet = new Set();
let currentStudyCard = null;
let currentChronologyHintIndex = 0;
let currentChronologyData = [];
let sortedChronologyData = [];
let fullSourceData = []; 


let draggedElement = null;        
let draggingClone = null;         
let placeholderEl = null;       
let pointerIdActive = null;       
let initialPointerOffset = { x: 0, y: 0 };


const HINTS_MAP = [
    { name_part: "Тригірський монастир", hint: "Пов'язаний із річкою Тетерів. У грі дата відноситься до XVI ст. (1583 р.)." },
    { name_part: "Бердичівський Кармелітський монастир", hint: "Оборонний монастир. У грі заснування відноситься до XVII ст. (1630 р.)." },
    { name_part: "Коліївщини 1768", hint: "Пов'язано з подіями Коліївщини. Це XVIII ст. (1768 р.)." },
    { name_part: "Костел Різдва Пресвятої Діви Марії", hint: "Римо-католицький храм. У грі дата відноситься до початку XX ст. (1905 р.)." },
    { name_part: "Палац Бержинських-Терещенків", hint: "Палац у Червоному. У грі дата відноситься до XIX ст. (1870 р.)." },
    { name_part: "Руїни палацу Терещенків", hint: "Маєток роду Терещенків у Денишах. У грі дата відноситься до початку XX ст. (1911 р.)." },
    { name_part: "Свято-Василівський Собор", hint: "Православний храм. У грі дата відноситься до XIX ст. (1888 р.)." },
    { name_part: "на честь заснування Житомира", hint: "Пам'ятний знак на Замковій горі. У грі дата відноситься до кінця XIX ст. (1894 р.)." },
    { name_part: "Поліський природний заповідник", hint: "Природоохоронний об'єкт. У грі створення відноситься до другої половини XX ст. (1968 р.)." },
];


function findHintForName(name) {
    const foundHint = HINTS_MAP.find(hint => name.includes(hint.name_part));
    return foundHint ? foundHint.hint : null;
}


window.onGameContainerRemoved = function() {
    const listContainer = document.getElementById('chronology-list');

    if (listContainer) {

        listContainer.querySelectorAll('.chronology-item').forEach(item => {
            item.removeEventListener('pointerdown', chronologyPointerDown);
            item.removeEventListener('pointerup', chronologyPointerUp);
            item.removeEventListener('pointercancel', chronologyPointerCancel);
        });

        listContainer.removeEventListener('pointermove', chronologyPointerMove);
        listContainer.removeEventListener('pointerup', chronologyPointerUp);
        listContainer.removeEventListener('pointercancel', chronologyPointerCancel);
    }


    draggedElement = null;
    if (draggingClone) { draggingClone.remove(); draggingClone = null; }
    if (placeholderEl) { placeholderEl.remove(); placeholderEl = null; }
    pointerIdActive = null;
    initialPointerOffset = { x: 0, y: 0 };

    try { delete window.onGameContainerRemoved; } catch (e) { /* ignore */ }
};



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

    gameContainer.innerHTML = `
        <p id="game-info" style="color: white; margin-bottom: 15px; font-weight: bold; text-align: center;">Натисніть на картку, щоб перевернути (покаже назву).</p>
        <div id="cards-study-area" class="card-study-area"></div>
        <div id="cards-controls" class="card-controls" style="text-align: center; margin-top: 25px;">
            <button id="not-learned-btn" class="quiz-control-btn not-learned-btn" style="display: none;">❌ Не вивчив</button>
            <button id="learned-btn" class="quiz-control-btn learned-btn" style="display: none;">✅ Вивчив</button>
        </div>
        <div id="game-controls" style="text-align: center; margin-top: 25px;">
            <button class="quiz-control-btn" onclick="window.goToTypeSelection()">⬅️ Змінити гру</button>
        </div>
    `;

    if (quizScreen) {
        const header = document.querySelector('.quiz-header');
        if (header) header.insertAdjacentElement('afterend', gameContainer);
        else quizScreen.appendChild(gameContainer);
    }

    initializeStudyMode(sourceData);
};

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

        if (studyCardsPool.length === 0) return;
    }

    currentStudyCard = studyCardsPool.shift();
    if (!currentStudyCard) return;

    if (cardArea) cardArea.innerHTML = createCardHTML(currentStudyCard);

    if (infoText) infoText.textContent = `Прогрес: ${learnedCardsSet.size} з ${studyCardsData.length}`;
    if (learnedBtn) learnedBtn.style.display = 'inline-block';
    if (notLearnedBtn) notLearnedBtn.style.display = 'inline-block';

    const cardElement = document.getElementById('current-study-card');
    if (cardElement) cardElement.addEventListener('click', toggleCardFlip);
}

function toggleCardFlip(e) {
    const innerCard = e.currentTarget.querySelector('.card-inner-flip');
    if (innerCard) innerCard.classList.toggle('flipped');
}

function createCardHTML(cardData) {
    return `
        <div id="current-study-card" class="card-flip-container" style="width: 300px; height: 400px; margin: 30px auto; perspective: 1000px; cursor: pointer;">
            <div class="card-inner-flip" style="transform-style: preserve-3d; transition: transform 0.6s; position: relative; width: 100%; height: 100%;">
                <div class="card-face card-front" style="position: absolute; width: 100%; height: 100%; backface-visibility: hidden; display: flex; justify-content: center; align-items: center; border-radius: 10px; background-color: #388e3c; color: white; box-shadow: 0 4px 8px rgba(0,0,0,0.2); transform: rotateY(180deg); padding: 15px;">
                    <h3 style="text-align: center;">${cardData.name}</h3>
                </div>
                <div class="card-face card-back" style="position: absolute; width: 100%; height: 100%; backface-visibility: hidden; transform: rotateY(0deg); border-radius: 10px; background-color: #333; color: white; padding: 15px; overflow-y: auto; text-align: left;">
                    <img src="${cardData.imagePath}" alt="${cardData.name}" class="card-back-img" style="width: 100%; max-height: 150px; object-fit: cover; border-radius: 5px;">
                    <p style="margin-top: 10px; font-size: 0.9em;">${cardData.description}</p>
                    <p style="text-align: center; margin-top: 10px; opacity: 0.7; font-style: italic;">Натисніть, щоб побачити назву</p>
                </div>
            </div>
        </div>
        <style>
        .card-inner-flip.flipped { transform: rotateY(180deg); }
        .card-inner-flip:not(.flipped) { transform: rotateY(0deg); }
        </style>
    `;
}


function chronologyPointerDown(e) {
 
    if (pointerIdActive !== null) return; 
    pointerIdActive = e.pointerId;
    e.currentTarget.setPointerCapture(pointerIdActive);

    const item = e.currentTarget;
    draggedElement = item;


    draggingClone = item.cloneNode(true);
    draggingClone.style.position = 'fixed';
    draggingClone.style.top = '0px';
    draggingClone.style.left = '0px';
    draggingClone.style.pointerEvents = 'none';
    draggingClone.style.zIndex = '9999';
    draggingClone.style.width = `${item.getBoundingClientRect().width}px`;
    draggingClone.style.boxShadow = '0 6px 18px rgba(0,0,0,0.3)';
    draggingClone.classList.add('dragging-clone');

    document.body.appendChild(draggingClone);


    placeholderEl = document.createElement('div');
    placeholderEl.className = 'chronology-placeholder';
    placeholderEl.style.height = `${item.getBoundingClientRect().height}px`;
    placeholderEl.style.border = '2px dashed rgba(255,255,255,0.08)';
    placeholderEl.style.margin = getComputedStyle(item).margin;
    placeholderEl.style.boxSizing = 'border-box';

    item.parentNode.insertBefore(placeholderEl, item.nextSibling);


    item.style.visibility = 'hidden';


    const rect = item.getBoundingClientRect();
    initialPointerOffset.x = e.clientX - rect.left;
    initialPointerOffset.y = e.clientY - rect.top;


    updateDraggingClonePosition(e.clientX, e.clientY);


    const list = document.getElementById('chronology-list');
    if (list) {
        list.addEventListener('pointermove', chronologyPointerMove);
        list.addEventListener('pointerup', chronologyPointerUp);
        list.addEventListener('pointercancel', chronologyPointerCancel);
    }
    document.addEventListener('pointermove', chronologyPointerMove);
    document.addEventListener('pointerup', chronologyPointerUp);
    document.addEventListener('pointercancel', chronologyPointerCancel);

    console.log('🔹 chronology pointerdown', item.textContent.trim());
}

function updateDraggingClonePosition(clientX, clientY) {
    if (!draggingClone) return;
    const left = clientX - initialPointerOffset.x;
    const top = clientY - initialPointerOffset.y;
    draggingClone.style.transform = `translate(${left}px, ${top}px)`;
}

function chronologyPointerMove(e) {
    if (pointerIdActive !== e.pointerId) return;
    if (!draggingClone) return;

    e.preventDefault();

    updateDraggingClonePosition(e.clientX, e.clientY);


    const list = document.getElementById('chronology-list');
    if (!list) return;

    const items = Array.from(list.querySelectorAll('.chronology-item'))
        .filter(it => it !== draggedElement);

    let insertBeforeNode = null;
    for (const it of items) {
        const rect = it.getBoundingClientRect();
        const midpoint = rect.top + rect.height / 2;
        if (e.clientY < midpoint) {
            insertBeforeNode = it;
            break;
        }
    }


    if (!insertBeforeNode) {
        list.appendChild(placeholderEl);
    } else {
        list.insertBefore(placeholderEl, insertBeforeNode);
    }
}

function chronologyPointerUp(e) {
    if (pointerIdActive !== e.pointerId) return;


    const list = document.getElementById('chronology-list');
    if (list) {
        list.removeEventListener('pointermove', chronologyPointerMove);
        list.removeEventListener('pointerup', chronologyPointerUp);
        list.removeEventListener('pointercancel', chronologyPointerCancel);
    }
    document.removeEventListener('pointermove', chronologyPointerMove);
    document.removeEventListener('pointerup', chronologyPointerUp);
    document.removeEventListener('pointercancel', chronologyPointerCancel);


    if (placeholderEl && draggedElement) {
        placeholderEl.parentNode.insertBefore(draggedElement, placeholderEl);
        placeholderEl.remove();
        placeholderEl = null;
    }


    if (draggingClone) {
        draggingClone.remove();
        draggingClone = null;
    }

    if (draggedElement) {
        draggedElement.style.visibility = '';

        setTimeout(() => {
            const listItems = document.querySelectorAll('#chronology-list .chronology-item');
            currentChronologyData = Array.from(listItems).map(item => fullSourceData.find(d => String(d.id) === item.dataset.id));
            updateChronologyIndicatorHeight();
        }, 20);
    }


    pointerIdActive = null;
    draggedElement = null;
    initialPointerOffset = { x: 0, y: 0 };

    console.log('🔹 chronology pointerup');
}

function chronologyPointerCancel(e) {

    chronologyPointerUp(e);
}


function initChronologyDragAndDrop(listContainer) {
    if (!listContainer) return;


    listContainer.querySelectorAll('.chronology-item').forEach(item => {
        item.removeEventListener('pointerdown', chronologyPointerDown);
        item.removeEventListener('pointerup', chronologyPointerUp);
        item.removeEventListener('pointercancel', chronologyPointerCancel);
    });


    const items = listContainer.querySelectorAll('.chronology-item');
    items.forEach(item => {

        item.setAttribute('draggable', 'false');
        item.addEventListener('pointerdown', chronologyPointerDown);
    });

    console.log('✅ Chronology drag & drop initialized (pointer fallback):', items.length, 'items');
}



function updateChronologyIndicatorHeight() {
    const listContainer = document.getElementById('chronology-list');
    const indicator = document.getElementById('chronology-order-indicator');

    if (listContainer && indicator) {
        setTimeout(() => {
            indicator.style.minHeight = `${listContainer.clientHeight + 40}px`;
        }, 50);
    }
}



function renderChronologyGame(data) {
    const listContainer = document.getElementById('chronology-list');
    if (!listContainer) return;

    sortedChronologyData = [...data].sort((a, b) => a.year - b.year);
    currentChronologyData = window.shuffle([...data]);

    listContainer.innerHTML = '';

    currentChronologyData.forEach(item => {
        const itemBlock = document.createElement('div');
        itemBlock.className = 'chronology-item';

        let displayName = item.name;
        const yearRegex = /\s\d{4}\s*р\.$/i;
        displayName = displayName.replace(yearRegex, '').trim();

        itemBlock.textContent = displayName;
        itemBlock.dataset.id = String(item.id);


        itemBlock.style.cursor = 'grab';

        listContainer.appendChild(itemBlock);
    });


    initChronologyDragAndDrop(listContainer);

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
        hintBtn.onclick = showChronologyHint;
    }

    updateChronologyIndicatorHeight();
}



function showChronologyHint() {
    const modal = document.getElementById('hint-modal');
    const listItems = Array.from(document.querySelectorAll('#chronology-list .chronology-item'));

    const unplacedItemsIDs = listItems
        .filter((item, index) => {
            const correctItem = sortedChronologyData[index];
            return correctItem && item.dataset.id !== String(correctItem.id);
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
    const hintItem = fullSourceData.find(d => String(d.id) === nextHintItemID);

    if (!hintItem) {
        console.error("Помилка: Не вдалося знайти повні дані для елемента, ID:", nextHintItemID);
        if (document.getElementById('hint-title')) document.getElementById('hint-title').innerHTML = `Помилка: Немає даних`;
        if (document.getElementById('hint-text')) document.getElementById('hint-text').innerHTML = `Не вдалося отримати повну інформацію для підказки. (ID: ${nextHintItemID})`;
        if (modal) modal.style.display = 'flex';
        return;
    }

    currentChronologyHintIndex = (currentChronologyHintIndex + 1);

    const defaultHint = `Пам'ятка **${hintItem.name}** була заснована приблизно в **${Math.floor(Math.abs(hintItem.year) / 100) * 100}** столітті. (Підказка за замовчуванням)`;
    const hintText = hintItem.hint || findHintForName(hintItem.name) || defaultHint;

    if (document.getElementById('hint-title')) document.getElementById('hint-title').innerHTML = `Підказка до "${hintItem.name}"`;
    if (document.getElementById('hint-text')) document.getElementById('hint-text').innerHTML = hintText;
    if (modal) modal.style.display = 'flex';

    const hintBtn = document.getElementById('hint-btn');
    const nextHintNumber = (currentChronologyHintIndex % poolToHintIDs.length) + 1;
    if (hintBtn) hintBtn.textContent = `💡 Підказка (${nextHintNumber})`;
}



function checkChronologyAnswers() {
    const listItems = document.querySelectorAll('#chronology-list .chronology-item');
    let correctCount = 0;

    listItems.forEach((item, index) => {
        const itemId = String(item.dataset.id);
        const currentData = fullSourceData.find(d => String(d.id) === itemId);
        const correctItem = sortedChronologyData[index];

        item.classList.remove('correct', 'incorrect');

        if (!currentData || !correctItem) {
            item.classList.add('incorrect');
            return;
        }

        const isCorrect = itemId === String(correctItem.id);

        if (isCorrect) {
            item.classList.add('correct');
            correctCount++;
        } else {
            item.classList.add('incorrect');
        }

        item.textContent = `${currentData.name} (${currentData.year} р.)`;
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

    const regionKey = (window.selectedRegion && window.selectedRegion.internalName) ? window.selectedRegion.internalName : "zhytomyr";
    if (window.submitGameResult) {
        window.submitGameResult({
            region: regionKey,
            game_key: "chronology",
            score: correctCount
        });
    }

    const listContainer = document.getElementById('chronology-list');
    if (listContainer) {
        listContainer.querySelectorAll('.chronology-item').forEach(item => {
            item.removeEventListener('pointerdown', chronologyPointerDown);
            item.removeEventListener('pointerup', chronologyPointerUp);
            item.removeEventListener('pointercancel', chronologyPointerCancel);
        });
        listContainer.removeEventListener('pointermove', chronologyPointerMove);
    }
}



window.initChronologyGame = function(sourceData) {
    if (!sourceData || !Array.isArray(sourceData) || sourceData.length === 0) {
        console.error("Помилка: Немає коректних даних для гри Хронологія.");
        window.goToTypeSelection();
        return;
    }

    fullSourceData = sourceData.map(item => {
        const calculatedHint = findHintForName(item.name);
        return {
            ...item,
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

    gameContainer.innerHTML = `
        <div id="chronology-instructions" class="instructions-panel">
            <p>Розташуйте пам'ятки в хронологічному порядку (від найстарішої до новітньої).</p>
        </div>
        <div id="chronology-game-area" class="chronology-game-area" style="display: flex; flex-direction: row; align-items: stretch; justify-content: center; gap: 20px;">
            <div id="chronology-order-indicator" style="display: flex; flex-direction: column; align-items: center; justify-content: space-between; margin: 20px 0 20px 0; max-height: 100%; min-width: 80px;">
                <span class="order-label top-label" style="color: white; font-weight: bold; margin-bottom: 5px;">Найстаріше</span>
                <div class="order-line-arrow" style="width: 2px; flex-grow: 1; background-color: #4CAF50; position: relative; margin: 5px 0;">
                    <div style="width: 0; height: 0; border-left: 5px solid transparent; border-right: 5px solid transparent; border-top: 10px solid #4CAF50; position: absolute; bottom: -10px; left: -4px;"></div>
                </div>
                <span class="order-label bottom-label" style="color: white; font-weight: bold; margin-top: 5px;">Найновіше</span>
            </div>
            <div id="chronology-list-container" style="flex-grow: 1; max-width: 600px;">
                <div id="chronology-list" class="chronology-list"></div>
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

    if (quizScreen) {
        const header = document.querySelector('.quiz-header');
        if (header) header.insertAdjacentElement('afterend', gameContainer);
        else quizScreen.appendChild(gameContainer);
    }

    const hintBtn = document.getElementById('hint-btn');
    if (hintBtn) hintBtn.onclick = showChronologyHint;

    const modal = document.getElementById('hint-modal');
    const closeBtn = modal ? modal.querySelector('.close-btn') : null;
    const modalCloseBtn = document.getElementById('modal-close-btn');

    if (closeBtn) closeBtn.onclick = () => modal.style.display = 'none';
    if (modalCloseBtn) modalCloseBtn.onclick = () => modal.style.display = 'none';

    renderChronologyGame(fullSourceData);
};