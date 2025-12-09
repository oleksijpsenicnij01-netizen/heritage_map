// map_app/static/map_app/js/quiz/quiz.js

const startQuizBtn = document.getElementById('start-quiz-btn');
const regionSelectionModal = document.getElementById('quiz-region-selection');
const typeSelectionModal = document.getElementById('quiz-type-selection');
const regionList = document.getElementById('region-list');

// ----------------------------------------------------
// 🟢 ДАНІ ОБЛАСТЕЙ (ІМІТАЦІЯ - ТРЕБА ЗБІЛЬШИТИ ЇХ КІЛЬКІСТЬ)
// ----------------------------------------------------

const regions = [
    { name: "Вінницька область", isAvailable: false },
    { name: "Волинська область", isAvailable: false },
    { name: "Дніпропетровська область", isAvailable: false },
    { name: "Донецька область", isAvailable: false },
    { name: "Житомирська область", isAvailable: true, internalName: 'zhytomyr' }, // Активна область
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
    { name: "Автономна Республіка Крим", isAvailable: false },
    { name: "Місто Київ", isAvailable: false },
    { name: "Місто Севастополь", isAvailable: false },
];


// ----------------------------------------------------
// 🟢 ФУНКЦІЇ ДЛЯ ВІДОБРАЖЕННЯ ІНТЕРФЕЙСУ
// ----------------------------------------------------

/**
 * Рендерить список областей у модальному вікні.
 */
function renderRegionList() {
    regionList.innerHTML = ''; // Очищуємо попередній список
    regions.forEach(region => {
        const block = document.createElement('div');
        block.className = 'region-block';
        
        if (region.isAvailable) {
            block.classList.add('active');
            block.innerHTML = `<span>${region.name}</span><span class="check-mark">✅</span>`;
            block.addEventListener('click', () => handleRegionClick(region));
        } else {
            block.classList.add('disabled');
            block.innerHTML = `<span>${region.name}</span>`;
            // Не додаємо обробник кліка для неактивних областей
        }

        regionList.appendChild(block);
    });
}

/**
 * Обробник кліка на кнопку "Грати Тести".
 */
startQuizBtn.addEventListener('click', () => {
    renderRegionList();
    openRegionSelection();
});

/**
 * Відкриває модальне вікно вибору області.
 */
function openRegionSelection() {
    // Закриваємо вікно вибору типу гри, якщо воно було відкрите
    typeSelectionModal.style.display = 'none'; 
    // Відкриваємо вікно вибору області
    regionSelectionModal.style.display = 'flex';
}

/**
 * Обробник кліка на активну область (Житомирську).
 * @param {object} region - Об'єкт обраної області.
 */
function handleRegionClick(region) {
    if (region.isAvailable) {
        // 1. Приховати вікно вибору області
        regionSelectionModal.style.display = 'none';

        // 2. Встановити заголовок для вікна вибору типу гри
        document.getElementById('quiz-type-title').textContent = 
            `Оберіть тип гри для ${region.name}:`;
        
        // 3. Відкрити вікно вибору типу гри
        typeSelectionModal.style.display = 'flex';
    }
}

/**
 * Глобальна функція для закриття будь-якого модального вікна гри.
 */
window.closeQuizModal = function() {
    regionSelectionModal.style.display = 'none';
    typeSelectionModal.style.display = 'none';
}

// ----------------------------------------------------
// 🟢 ЛОГІКА ТИПІВ ГРИ (На майбутнє)
// ----------------------------------------------------

const gameTypes = document.getElementById('game-type-list');

gameTypes.addEventListener('click', function(e) {
    const target = e.target;
    if (target.classList.contains('game-type-block') && !target.classList.contains('disabled')) {
        const gameType = target.textContent.trim();
        alert(`Ви обрали гру "${gameType}". Починаємо гру для Житомирської області! (Тут буде код запуску гри)`);
        closeQuizModal();
        
        // Тут буде логіка запуску гри:
        // if (gameType === 'Співставлення') {
        //     // startMatchingGame();
        // } else if (gameType === 'Картки') {
        //     // startFlashcardsGame();
        // }
    }
});