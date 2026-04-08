// Кэш для секций и кнопок
const sectionCache = {
    sections: null,
    buttons: null,
    getSections: function() {
        if (!this.sections) {
            this.sections = document.querySelectorAll('.content-section');
        }
        return this.sections;
    },
    getButtons: function() {
        if (!this.buttons) {
            this.buttons = document.querySelectorAll('.tab-button');
        }
        return this.buttons;
    },
    clear: function() {
        this.sections = null;
        this.buttons = null;
    }
};

// Флаг для отслеживания загруженных секций
const loadedSections = new Set();

function showSection(sectionId) {
    // Скрыть все секции
    const sections = sectionCache.getSections();
    sections.forEach(section => {
        section.classList.remove('active');
    });
    
    // Показать выбранную секцию
    const selectedSection = document.getElementById(sectionId);
    if (selectedSection) {
        selectedSection.classList.add('active');
        
        // Эти разделы перерисовываем при каждом открытии: так новые правки из XML/localStorage видны сразу.
        if (sectionId === 'groups' || sectionId === 'home' || sectionId === 'parents' || sectionId === 'events' || sectionId === 'awards' || sectionId === 'schedule') {
            loadSectionData(sectionId);
        } else if (!loadedSections.has(sectionId)) {
            loadSectionData(sectionId);
            loadedSections.add(sectionId);
        }
    }
    
    // Активная вкладка по data-section (работает и при вызове без event — с главной страницы)
    const buttons = sectionCache.getButtons();
    buttons.forEach(button => {
        const match = button.dataset && button.dataset.section === sectionId;
        button.classList.toggle('active', !!match);
    });
}

// Ленивая загрузка данных для секций
function loadSectionData(sectionId) {
    // Загружаем XML только если нужно
    if (typeof xmlDataCache !== 'undefined' && xmlDataCache) {
        const kindergarten = xmlDataCache.querySelector('детский_сад');
        if (kindergarten) {
            switch(sectionId) {
                case 'home':
                    if (typeof populateHomeUpcomingEvents === 'function') {
                        populateHomeUpcomingEvents(kindergarten);
                    }
                    if (typeof updateParentsMapLink === 'function') {
                        updateParentsMapLink(kindergarten);
                    }
                    break;
                case 'parents':
                    if (typeof updateParentsMapLink === 'function') {
                        updateParentsMapLink(kindergarten);
                    }
                    break;
                case 'groups':
                    // Обновляем группы при переключении на секцию (чтобы показать новые группы из localStorage)
                    if (typeof displayGroups === 'function') {
                        displayGroups(kindergarten);
                    }
                    break;
                case 'schedule':
                    if (typeof displaySchedule === 'function') {
                        displaySchedule(kindergarten);
                    }
                    break;
                case 'events':
                    if (typeof displayEvents === 'function') {
                        displayEvents(kindergarten);
                    }
                    break;
                case 'gallery':
                    if (typeof displayGallery === 'function') {
                        displayGallery();
                    }
                    break;
            }
        }
    } else {
        // Если XML еще не загружен, ждем его загрузки
        if (typeof loadXMLData === 'function') {
            loadXMLData().then(xmlDoc => {
                const kindergarten = xmlDoc.querySelector('детский_сад');
                if (kindergarten) {
                    switch(sectionId) {
                        case 'home':
                            if (typeof populateHomeUpcomingEvents === 'function') {
                                populateHomeUpcomingEvents(kindergarten);
                            }
                            if (typeof updateParentsMapLink === 'function') {
                                updateParentsMapLink(kindergarten);
                            }
                            break;
                        case 'parents':
                            if (typeof updateParentsMapLink === 'function') {
                                updateParentsMapLink(kindergarten);
                            }
                            break;
                        case 'groups':
                            // Обновляем группы при переключении на секцию
                            if (typeof displayGroups === 'function') {
                                displayGroups(kindergarten);
                            }
                            break;
                        case 'schedule':
                            if (typeof displaySchedule === 'function') {
                                displaySchedule(kindergarten);
                            }
                            break;
                        case 'events':
                            if (typeof displayEvents === 'function') {
                                displayEvents(kindergarten);
                            }
                            break;
                        case 'gallery':
                            if (typeof displayGallery === 'function') {
                                displayGallery();
                            }
                            break;
                    }
                }
            });
        }
    }
}

// Глобальные переменные для фотогалереи
let galleryPhotos = [];
let currentPhotoIndex = 0;

// Загрузка и отображение фотогалереи
function displayGallery() {
    const galleryContainer = document.getElementById('gallery-content');
    if (!galleryContainer) return;
    
    // Всегда используем актуальные фотографии из getDefaultPhotos
    // Это гарантирует, что пути к фотографиям всегда правильные
    let photos = getDefaultPhotos();
    
    // Обновляем localStorage с актуальными данными
    localStorage.setItem('galleryPhotos', JSON.stringify(photos));
    
    galleryPhotos = photos;
    
    console.log('Загрузка фотогалереи:', photos.length, 'фотографий');
    photos.forEach((photo, index) => {
        console.log(`Фото ${index + 1}:`, photo.url);
    });
    
    // Сразу отображаем галерею
    renderGallery(photos);
    
    // Предзагрузка изображений в фоне для проверки доступности
    preloadImages(photos);
    
    // Настройка фильтра
    const filterSelect = document.getElementById('gallery-filter');
    if (filterSelect) {
        // Удаляем старый обработчик
        const newSelect = filterSelect.cloneNode(true);
        filterSelect.parentNode.replaceChild(newSelect, filterSelect);
        
        newSelect.addEventListener('change', function() {
            filterGallery(this.value);
        });
    }
}

// Предзагрузка изображений для проверки их доступности
function preloadImages(photos) {
    const promises = photos.map(photo => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => {
                console.warn('Не удалось загрузить изображение:', photo.url);
                resolve(null); // Разрешаем промис даже при ошибке, чтобы не блокировать отображение
            };
            img.src = photo.url;
        });
    });
    return Promise.all(promises);
}

// Дефолтные фотографии (заглушки)
function getDefaultPhotos() {
    return [
        {
            id: 1,
            url: 'foto/photo_1_2025-12-11_09-09-03.jpg',
            title: 'Здание детского сада',
            description: 'Красивое современное здание нашего детского сада ТЕРЕМОК',
            date: '2025-12-11',
            category: 'building'
        },
        {
            id: 2,
            url: 'foto/photo_2_2025-12-11_09-09-03.jpg',
            title: 'Внешний вид детского сада',
            description: 'Современное здание с красивой архитектурой и благоустроенной территорией',
            date: '2025-12-11',
            category: 'building'
        },
        {
            id: 3,
            url: 'FOTO2/photo_1_2025-12-11_09-09-11.jpg',
            title: 'Активности детей',
            description: 'Дети активно участвуют в развивающих занятиях',
            date: '2025-12-11',
            category: 'activities'
        },
        {
            id: 4,
            url: 'FOTO2/photo_2_2025-12-11_09-09-11.jpg',
            title: 'Творческие занятия',
            description: 'Развитие творческих способностей у детей',
            date: '2025-12-11',
            category: 'activities'
        },
        {
            id: 5,
            url: 'FOTO2/photo_3_2025-12-11_09-09-11.jpg',
            title: 'Игровая деятельность',
            description: 'Дети играют и развиваются в процессе игры',
            date: '2025-12-11',
            category: 'activities'
        },
        {
            id: 13,
            url: 'FOTO2/photo_4_2025-12-11_09-09-11.jpg',
            title: 'Развивающие игры',
            description: 'Образовательные игры для развития мышления',
            date: '2025-12-11',
            category: 'activities'
        },
        {
            id: 14,
            url: 'FOTO2/photo_5_2025-12-11_09-09-11.jpg',
            title: 'Групповые занятия',
            description: 'Дети работают вместе над общими задачами',
            date: '2025-12-11',
            category: 'activities'
        },
        {
            id: 15,
            url: 'FOTO2/photo_6_2025-12-11_09-09-11.jpg',
            title: 'Познавательная деятельность',
            description: 'Изучение окружающего мира через практику',
            date: '2025-12-11',
            category: 'activities'
        },
        {
            id: 16,
            url: 'FOTO2/photo_7_2025-12-11_09-09-11.jpg',
            title: 'Активные игры',
            description: 'Подвижные игры для физического развития',
            date: '2025-12-11',
            category: 'activities'
        },
        {
            id: 17,
            url: 'FOTO2/photo_2025-12-11_09-15-07.jpg',
            title: 'Развивающие активности',
            description: 'Разнообразные занятия для всестороннего развития',
            date: '2025-12-11',
            category: 'activities'
        },
        {
            id: 24,
            url: 'photo_2025-12-11_10-46-49.jpg',
            title: 'Активные занятия',
            description: 'Дети активно участвуют в развивающих занятиях',
            date: '2025-12-11',
            category: 'activities'
        },
        {
            id: 25,
            url: 'photo_2025-12-11_10-46-53.jpg',
            title: 'Творческая деятельность',
            description: 'Развитие творческих способностей через практические занятия',
            date: '2025-12-11',
            category: 'activities'
        },
        {
            id: 6,
            url: 'FotO3/photo_1_2025-12-11_10-37-44.jpg',
            title: 'Праздничное мероприятие',
            description: 'Яркое и веселое мероприятие для детей',
            date: '2025-12-11',
            category: 'events'
        },
        {
            id: 7,
            url: 'FotO3/photo_2_2025-12-11_10-37-44.jpg',
            title: 'Торжественное событие',
            description: 'Дети участвуют в праздничном мероприятии',
            date: '2025-12-11',
            category: 'events'
        },
        {
            id: 18,
            url: 'FotO3/photo_3_2025-12-11_10-37-44.jpg',
            title: 'Праздничный концерт',
            description: 'Выступление детей на праздничном концерте',
            date: '2025-12-11',
            category: 'events'
        },
        {
            id: 19,
            url: 'FotO3/photo_4_2025-12-11_10-37-44.jpg',
            title: 'Творческое мероприятие',
            description: 'Дети демонстрируют свои творческие способности',
            date: '2025-12-11',
            category: 'events'
        },
        {
            id: 20,
            url: 'FotO3/photo_5_2025-12-11_10-37-44.jpg',
            title: 'Праздничное выступление',
            description: 'Дети готовятся к праздничному выступлению',
            date: '2025-12-11',
            category: 'events'
        },
        {
            id: 21,
            url: 'FotO3/photo_6_2025-12-11_10-37-44.jpg',
            title: 'Мероприятие в детском саду',
            description: 'Увлекательное мероприятие с участием всех групп',
            date: '2025-12-11',
            category: 'events'
        },
        {
            id: 22,
            url: 'FotO3/photo_7_2025-12-11_10-37-44.jpg',
            title: 'Праздничное торжество',
            description: 'Дети радуются праздничному торжеству',
            date: '2025-12-11',
            category: 'events'
        },
        {
            id: 23,
            url: 'FotO3/photo_8_2025-12-11_10-37-44.jpg',
            title: 'Культурное мероприятие',
            description: 'Развитие культурных навыков через мероприятия',
            date: '2025-12-11',
            category: 'events'
        },
        {
            id: 8,
            url: 'https://via.placeholder.com/800x600/d299c2/fef9d7?text=Группа+Солнышко',
            title: 'Младшая группа "Солнышко"',
            description: 'Дети занимаются развивающими играми',
            date: '2025-01-08',
            category: 'groups'
        },
        {
            id: 9,
            url: 'https://via.placeholder.com/800x600/89f7fe/66a6ff?text=Группа+Радуга',
            title: 'Средняя группа "Радуга"',
            description: 'Занятие по развитию речи',
            date: '2025-01-07',
            category: 'groups'
        },
        {
            id: 10,
            url: 'https://via.placeholder.com/800x600/f093fb/f5576c?text=Группа+Звездочки',
            title: 'Старшая группа "Звездочки"',
            description: 'Подготовка к школе',
            date: '2025-01-06',
            category: 'groups'
        },
        {
            id: 11,
            url: 'https://via.placeholder.com/800x600/a8edea/fed6e3?text=Группа+Умники',
            title: 'Подготовительная группа "Умники"',
            description: 'Интеллектуальные занятия',
            date: '2025-01-05',
            category: 'groups'
        },
        {
            id: 12,
            url: 'photo_2025-12-11_09-15-14.jpg',
            title: 'Здание детского сада',
            description: 'Красивое здание детского сада ТЕРЕМОК',
            date: '2025-12-11',
            category: 'building'
        }
    ];
}

// Рендеринг фотогалереи
function renderGallery(photos) {
    const galleryContainer = document.getElementById('gallery-content');
    if (!galleryContainer) return;
    
    if (photos.length === 0) {
        galleryContainer.textContent = '';
        const emptyMsg = document.createElement('p');
        emptyMsg.className = 'empty-message';
        emptyMsg.textContent = 'Фотографии пока отсутствуют';
        galleryContainer.appendChild(emptyMsg);
        return;
    }
    
    console.log('Отображение фотогалереи:', photos.length, 'фотографий');
    
    const fragment = document.createDocumentFragment();
    const tempDiv = document.createElement('div');
    
    // Безопасная обработка данных
    const sanitize = window.SecurityModule ? window.SecurityModule.sanitizeHTML : (str) => str;
    
    let html = '';
    photos.forEach((photo, index) => {
        const categoryLabels = {
            'building': '🏢 Здание',
            'activities': '🎨 Активности',
            'events': '🎉 Мероприятия',
            'groups': '👥 Группы'
        };
        
        // Санитизируем все пользовательские данные перед вставкой
        const safeTitle = sanitize(photo.title || '');
        const safeUrl = sanitize(photo.url || '');
        const safeDate = sanitize(formatDate(photo.date || ''));
        const safeCategory = categoryLabels[photo.category] || '📸';
        
        html += `
            <div class="gallery-item" onclick="openPhotoModal(${index})">
                <img src="${safeUrl}" alt="${safeTitle}" loading="lazy" onerror="this.onerror=null; this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22800%22 height=%22600%22%3E%3Crect fill=%22%23f0f0f0%22 width=%22800%22 height=%22600%22/%3E%3Ctext fill=%22%23999%22 font-family=%22sans-serif%22 font-size=%2220%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22%3EИзображение не загружено%3C/text%3E%3C/svg%3E';">
                <div class="gallery-item-badge">${safeCategory}</div>
                <div class="gallery-item-overlay">
                    <div class="gallery-item-title">${safeTitle}</div>
                    <div class="gallery-item-date">${safeDate}</div>
                </div>
            </div>
        `;
    });
    
    tempDiv.innerHTML = html;
    while (tempDiv.firstChild) {
        fragment.appendChild(tempDiv.firstChild);
    }
    galleryContainer.textContent = '';
    galleryContainer.appendChild(fragment);
}

// Фильтрация фотографий
function filterGallery(category) {
    let filtered = category === 'all' ? galleryPhotos : galleryPhotos.filter(p => p.category === category);
    renderGallery(filtered);
    
    // Сохраняем отфильтрованные фотографии для навигации
    window.filteredGalleryPhotos = filtered;
}

// Открытие модального окна с фотографией
function openPhotoModal(index) {
    const photos = window.filteredGalleryPhotos || galleryPhotos;
    if (!photos[index]) return;
    
    currentPhotoIndex = index;
    const modal = document.getElementById('photo-modal');
    const modalPhoto = document.getElementById('modal-photo');
    const photoTitle = document.getElementById('photo-title');
    const photoDescription = document.getElementById('photo-description');
    const photoDate = document.getElementById('photo-date');
    
    if (modal && modalPhoto && photoTitle && photoDescription && photoDate) {
        const photo = photos[index];
        
        // Безопасная обработка данных
        const sanitize = window.SecurityModule ? window.SecurityModule.sanitizeHTML : (str) => str;
        const sanitizeInput = window.SecurityModule ? window.SecurityModule.sanitizeInput : (str) => str;
        
        // Санитизируем URL и используем textContent для безопасного отображения
        modalPhoto.src = sanitizeInput(photo.url || '');
        modalPhoto.alt = sanitize(photo.title || '');
        photoTitle.textContent = sanitize(photo.title || '');
        photoDescription.textContent = sanitize(photo.description || '');
        photoDate.textContent = `Дата: ${sanitize(formatDate(photo.date || ''))}`;
        
        modal.style.display = 'block';
        
        // Сохраняем текущий массив фотографий для навигации
        window.currentPhotosArray = photos;
        window.currentPhotoIndex = index;
    }
}

// Закрытие модального окна
function closePhotoModal() {
    const modal = document.getElementById('photo-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Навигация по фотографиям
function navigatePhoto(direction) {
    const photos = window.currentPhotosArray || galleryPhotos;
    if (!photos || photos.length === 0) return;
    
    currentPhotoIndex = window.currentPhotoIndex || 0;
    currentPhotoIndex += direction;
    
    if (currentPhotoIndex < 0) {
        currentPhotoIndex = photos.length - 1;
    } else if (currentPhotoIndex >= photos.length) {
        currentPhotoIndex = 0;
    }
    
    window.currentPhotoIndex = currentPhotoIndex;
    openPhotoModal(currentPhotoIndex);
}

// Форматирование даты
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    // Убедиться, что первая секция видна
    const firstSection = document.querySelector('.content-section.active');
    if (!firstSection) {
        const groupsSection = document.getElementById('groups');
        if (groupsSection) {
            groupsSection.classList.add('active');
        }
    }
    
    // Загружаем награды из localStorage
    loadAwards();
    
    // Закрытие модального окна при клике вне его
    const modal = document.getElementById('child-modal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeChildModal();
            }
        });
        
        // Закрытие по Escape
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && modal.style.display === 'block') {
                closeChildModal();
            }
        });
    }
    
    // Закрытие модального окна фотографии при клике вне его
    const photoModal = document.getElementById('photo-modal');
    if (photoModal) {
        photoModal.addEventListener('click', function(e) {
            if (e.target === photoModal) {
                closePhotoModal();
            }
        });
        
        // Навигация по фотографиям клавиатурой
        document.addEventListener('keydown', function(e) {
            if (photoModal.style.display === 'block') {
                if (e.key === 'Escape') {
                    closePhotoModal();
                } else if (e.key === 'ArrowLeft') {
                    navigatePhoto(-1);
                } else if (e.key === 'ArrowRight') {
                    navigatePhoto(1);
                }
            }
        });
    }

    // Закрытие модального окна мероприятия при клике вне его
    const eventModal = document.getElementById('event-modal');
    if (eventModal) {
        eventModal.addEventListener('click', function(e) {
            if (e.target === eventModal && typeof closeEventModal === 'function') {
                closeEventModal();
            }
        });

        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && eventModal.style.display === 'block' && typeof closeEventModal === 'function') {
                closeEventModal();
            }
        });
    }
});

// Загрузка наград из localStorage + наполнение базовым длинным списком
function loadAwards() {
    const awardsContainer = document.querySelector('.awards-grid');
    if (!awardsContainer) return;
    
    const baseAwards = [
        { title: 'Лауреат конкурса «Лучший детский сад района»', year: '2025', desc: 'Признание качества образования, безопасности и внимания к каждому ребёнку.', type: 'gold' },
        { title: 'Гран-при фестиваля «Радуга талантов»', year: '2025', desc: 'Театральные и музыкальные номера воспитанников на областной сцене.', type: 'gold' },
        { title: 'Победитель конкурса «Территория детства»', year: '2024', desc: 'Организация пространства для игры, движения и творчества.', type: 'silver' },
        { title: 'Диплом «Здоровый детский сад»', year: '2024', desc: 'Закаливание, физкультура и сбалансированное питание по возрасту.', type: 'silver' },
        { title: 'Кубок «Безопасное детство»', year: '2023', desc: 'Соблюдение норм по охране жизни и здоровья, инструктажи и клубы безопасности.', type: 'bronze' },
        { title: 'Сертификат «Современная развивающая среда»', year: '2023', desc: 'Наглядность, дидактические центры и цифровые ресурсы в работе педагогов.', type: 'gold' },
        { title: 'Почётная грамота «Партнёр семьи»', year: '2022', desc: 'Совместные проекты с родителями, консультации и родительский университет.', type: 'silver' },
        { title: 'Награда «Экология и мы»', year: '2022', desc: 'Участие во Всероссийской акции и проекты по охране окружающей среды.', type: 'bronze' },
        { title: 'Диплом конкурса проектов «Шаги к школе»', year: '2021', desc: 'Подготовка старших дошкольников: чтение, логика, самообслуживание.', type: 'silver' },
        { title: 'Благодарность департамента образования', year: '2021', desc: 'За стабильную работу, открытость для родителей и развитие кадров.', type: 'bronze' },
        { title: 'Конкурс чтецов «Книжная поляна» — 1 место', year: '2020', desc: 'Воспитанники средней группы — лауреаты районного этапа.', type: 'gold' },
        { title: 'Грамота «Лучший музыкальный руководитель года»', year: '2020', desc: 'Развитие музыкальных способностей и хоровая работа с детьми.', type: 'silver' },
        { title: 'Диплом «Инклюзивная практика года»', year: '2023', desc: 'Опыт работы с детьми с ОВЗ и поддержка семей.', type: 'silver' },
        { title: 'Почётный знак «Территория детства»', year: '2022', desc: 'За благоустройство участка и создание игровых зон.', type: 'bronze' },
        { title: 'Сертификат «Цифровой детский сад»', year: '2024', desc: 'Использование безопасных цифровых ресурсов в образовательном процессе.', type: 'gold' }
    ];
    
    let storedAwards = [];
    if (window.SecurityModule) {
        storedAwards = window.SecurityModule.safeGetLocalStorage('awards') || [];
    } else {
        try {
            storedAwards = JSON.parse(localStorage.getItem('awards') || '[]');
        } catch (e) {
            storedAwards = [];
        }
    }
    
    // Объединяем сохранённые награды с базовым длинным списком (по title+year)
    const map = new Map();
    const keyOf = (a) => `${(a.year || '').trim()}|${(a.title || '').trim()}`;
    
    storedAwards.forEach(a => {
        if (!a || (!a.title && !a.year)) return;
        map.set(keyOf(a), a);
    });
    baseAwards.forEach(a => {
        if (!a || (!a.title && !a.year)) return;
        const k = keyOf(a);
        if (!map.has(k)) {
            map.set(k, a);
        }
    });
    
    const awards = Array.from(map.values());
    
    // Безопасное создание элементов
    const sanitize = window.SecurityModule ? window.SecurityModule.sanitizeHTML : (str) => str;
    awardsContainer.textContent = '';
    
    awards.forEach((award, index) => {
        const medalClass = award.type || (index % 3 === 0 ? 'gold' : index % 3 === 1 ? 'silver' : 'bronze');
        
        const card = document.createElement('div');
        card.className = 'award-card';
        
        const medal = document.createElement('div');
        medal.className = `award-medal ${medalClass}`;
        card.appendChild(medal);
        
        const h3 = document.createElement('h3');
        h3.textContent = sanitize(award.title || '');
        card.appendChild(h3);
        
        const yearP = document.createElement('p');
        yearP.className = 'award-year';
        yearP.textContent = `${sanitize(award.year || '')} год`;
        card.appendChild(yearP);
        
        const descP = document.createElement('p');
        descP.className = 'award-desc';
        descP.textContent = sanitize(award.desc || '');
        card.appendChild(descP);
        
        awardsContainer.appendChild(card);
    });
}

// Дебаунсинг функция
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function readApplicationFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Не удалось прочитать файл'));
        reader.readAsDataURL(file);
    });
}

// Обработка формы заявки на поступление
async function handleApplication(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    
    // Валидация данных с помощью модуля безопасности
    let validation;
    if (typeof window !== 'undefined' && window.SecurityModule) {
        validation = window.SecurityModule.validateApplicationForm(formData);
    } else {
        // Базовая валидация, если модуль безопасности не загружен
        validation = { valid: true, errors: [] };
    }
    
    if (!validation.valid) {
        const resultDiv = document.getElementById('application-result');
        if (resultDiv) {
            resultDiv.style.display = 'block';
            resultDiv.className = 'application-result error';
            resultDiv.innerHTML = `
                <h3>❌ Ошибка валидации</h3>
                <ul>
                    ${validation.errors.map(error => `<li>${window.SecurityModule ? window.SecurityModule.sanitizeHTML(error) : error}</li>`).join('')}
                </ul>
            `;
            setTimeout(() => {
                resultDiv.style.display = 'none';
            }, 10000);
        }
        return;
    }
    
    // Санитизация данных перед сохранением
    const sanitize = window.SecurityModule ? window.SecurityModule.sanitizeInput : (str) => str;
    const safeSetHTML = window.SecurityModule ? window.SecurityModule.safeSetHTML : (el, html) => { if (el) el.innerHTML = html; };

    let attachment = null;
    const file = formData.get('application-file');
    if (file && typeof file === 'object' && file.size > 0) {
        const maxSize = 2 * 1024 * 1024; // 2MB
        if (file.size > maxSize) {
            const resultDiv = document.getElementById('application-result');
            if (resultDiv) {
                resultDiv.style.display = 'block';
                resultDiv.className = 'application-result error';
                resultDiv.textContent = '❌ Файл слишком большой. Максимальный размер: 2 МБ.';
            }
            return;
        }

        try {
            const dataUrl = await readApplicationFile(file);
            attachment = {
                name: sanitize(file.name || ''),
                type: sanitize(file.type || 'application/octet-stream'),
                size: Number(file.size || 0),
                dataUrl
            };
        } catch (e) {
            const resultDiv = document.getElementById('application-result');
            if (resultDiv) {
                resultDiv.style.display = 'block';
                resultDiv.className = 'application-result error';
                resultDiv.textContent = '❌ Не удалось прикрепить файл. Попробуйте еще раз.';
            }
            return;
        }
    }
    
    const application = {
        childName: sanitize(formData.get('child-name') || ''),
        childSurname: sanitize(formData.get('child-surname') || ''),
        childAge: parseFloat(formData.get('child-age') || '0'),
        parentName: sanitize(formData.get('parent-name') || ''),
        parentPhone: sanitize(formData.get('parent-phone') || ''),
        parentEmail: sanitize(formData.get('parent-email') || ''),
        preferredGroup: sanitize(formData.get('preferred-group') || ''),
        comments: sanitize(formData.get('comments') || ''),
        date: new Date().toLocaleString('ru-RU'),
        attachment
    };
    
    // Безопасное сохранение заявки в localStorage
    let applications = [];
    if (window.SecurityModule) {
        const stored = window.SecurityModule.safeGetLocalStorage('applications');
        applications = stored || [];
    } else {
        try {
            applications = JSON.parse(localStorage.getItem('applications') || '[]');
        } catch (e) {
            applications = [];
        }
    }
    
    applications.push(application);
    
    if (window.SecurityModule) {
        window.SecurityModule.safeSetLocalStorage('applications', applications);
    } else {
        localStorage.setItem('applications', JSON.stringify(applications));
    }
    
    // Показываем результат безопасным способом
    const resultDiv = document.getElementById('application-result');
    if (resultDiv) {
        resultDiv.style.display = 'block';
        resultDiv.className = 'application-result success';
        
        // Используем безопасный способ вставки HTML
        if (window.SecurityModule) {
            resultDiv.textContent = ''; // Очищаем
            const h3 = window.SecurityModule.createSafeElement('h3', '✓ Заявка успешно отправлена!');
            const p1 = window.SecurityModule.createSafeElement('p', 'Спасибо за вашу заявку. Мы свяжемся с вами в ближайшее время.');
            const p2 = window.SecurityModule.createSafeElement('p', '');
            p2.appendChild(document.createTextNode('Номер заявки: #'));
            const strong1 = window.SecurityModule.createSafeElement('strong', applications.length.toString());
            p2.appendChild(strong1);
            const p3 = window.SecurityModule.createSafeElement('p', '');
            p3.appendChild(document.createTextNode('Дата подачи: '));
            const strong2 = window.SecurityModule.createSafeElement('strong', application.date);
            p3.appendChild(strong2);
            const p4 = window.SecurityModule.createSafeElement(
                'p',
                application.attachment ? `Файл: ${application.attachment.name}` : 'Файл не прикреплен'
            );
            
            resultDiv.appendChild(h3);
            resultDiv.appendChild(p1);
            resultDiv.appendChild(p2);
            resultDiv.appendChild(p3);
            resultDiv.appendChild(p4);
        } else {
            // Fallback для старых браузеров
            resultDiv.innerHTML = `
                <h3>✓ Заявка успешно отправлена!</h3>
                <p>Спасибо за вашу заявку. Мы свяжемся с вами в ближайшее время.</p>
                <p><strong>Номер заявки:</strong> #${applications.length}</p>
                <p><strong>Дата подачи:</strong> ${application.date}</p>
                <p><strong>Файл:</strong> ${application.attachment ? application.attachment.name : 'не прикреплен'}</p>
            `;
        }
        
        // Прокручиваем к результату
        resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    
    // Очищаем форму
    form.reset();
    
    // Скрываем результат через 10 секунд
    setTimeout(() => {
        if (resultDiv) {
            resultDiv.style.display = 'none';
        }
    }, 10000);
}

// Дебаунсинг для поиска
let searchGroupsTimeout = null;
let searchChildrenTimeout = null;

// Функции поиска групп и детей
function searchGroups(searchQuery) {
    // Очищаем предыдущий таймаут
    if (searchGroupsTimeout) {
        clearTimeout(searchGroupsTimeout);
    }
    
    // Применяем дебаунсинг для оптимизации
    searchGroupsTimeout = setTimeout(() => {
        searchGroupsImmediate(searchQuery);
    }, 300);
}

function searchGroupsImmediate(searchQuery) {
    const query = (searchQuery || '').toLowerCase().trim();
    const groupCards = document.querySelectorAll('.group-card');
    const clearBtn = document.getElementById('clear-group-search');
    const resultsInfo = document.getElementById('search-results-info');
    const childSearchInput = document.getElementById('child-search');
    const hasChildSearch = childSearchInput && childSearchInput.value.trim();
    
    // Показываем/скрываем кнопку очистки
    if (clearBtn) {
        clearBtn.style.display = query ? 'block' : 'none';
    }
    
    if (!query) {
        // Очищаем поиск групп
        groupCards.forEach(card => {
            card.classList.remove('hidden-by-search', 'highlighted');
        });
        // Если нет поиска детей, скрываем информацию о результатах
        if (!hasChildSearch && resultsInfo) {
            resultsInfo.style.display = 'none';
        } else if (hasChildSearch) {
            // Перезапускаем поиск детей для обновления результатов
            searchChildren(childSearchInput.value);
        }
        return;
    }
    
    let foundCount = 0;
    let totalGroups = 0;
    
    groupCards.forEach(card => {
        totalGroups++;
        const groupName = card.getAttribute('data-group-name') || '';
        
        if (groupName.includes(query)) {
            card.classList.remove('hidden-by-search');
            card.classList.add('highlighted');
            foundCount++;
        } else {
            card.classList.remove('highlighted');
            card.classList.add('hidden-by-search');
        }
    });
    
    // Если есть поиск детей, обновляем его результаты
    if (hasChildSearch) {
        searchChildren(childSearchInput.value);
    }
    
    // Показываем информацию о результатах (комбинируем с поиском детей если есть)
    if (resultsInfo && !hasChildSearch) {
        if (foundCount > 0) {
            resultsInfo.textContent = `Найдено групп: ${foundCount} из ${totalGroups}`;
            resultsInfo.style.display = 'block';
            resultsInfo.style.background = 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)';
        } else {
            resultsInfo.textContent = 'Группы не найдены';
            resultsInfo.style.display = 'block';
            resultsInfo.style.background = 'linear-gradient(135deg, #ff6b6b 0%, #ff5252 100%)';
        }
    }
}

function searchChildren(searchQuery) {
    // Очищаем предыдущий таймаут
    if (searchChildrenTimeout) {
        clearTimeout(searchChildrenTimeout);
    }
    
    // Применяем дебаунсинг для оптимизации
    searchChildrenTimeout = setTimeout(() => {
        searchChildrenImmediate(searchQuery);
    }, 300);
}

function searchChildrenImmediate(searchQuery) {
    const query = (searchQuery || '').toLowerCase().trim();
    const childCards = document.querySelectorAll('.child-card');
    const clearBtn = document.getElementById('clear-child-search');
    const resultsInfo = document.getElementById('search-results-info');
    const groupSearchInput = document.getElementById('group-search');
    const hasGroupSearch = groupSearchInput && groupSearchInput.value.trim();
    
    // Показываем/скрываем кнопку очистки
    if (clearBtn) {
        clearBtn.style.display = query ? 'block' : 'none';
    }
    
    if (!query) {
        // Очищаем поиск детей
        childCards.forEach(card => {
            card.classList.remove('hidden-by-search', 'highlighted');
        });
        // Если нет поиска групп, скрываем информацию о результатах
        if (!hasGroupSearch && resultsInfo) {
            resultsInfo.style.display = 'none';
        }
        return;
    }
    
    let foundCount = 0;
    let totalChildren = 0;
    const foundGroups = new Set();
    
    childCards.forEach(card => {
        totalChildren++;
        const firstName = card.getAttribute('data-child-first-name') || '';
        const lastName = card.getAttribute('data-child-last-name') || '';
        const fullName = card.getAttribute('data-child-full-name') || '';
        
        // Поиск по имени, фамилии или полному имени
        if (firstName.includes(query) || lastName.includes(query) || fullName.includes(query)) {
            card.classList.remove('hidden-by-search');
            card.classList.add('highlighted');
            foundCount++;
            
            // Открываем родительскую группу
            const groupCard = card.closest('.group-card');
            if (groupCard) {
                const groupId = groupCard.getAttribute('data-group-id');
                if (groupId) {
                    foundGroups.add(groupId);
                    // Раскрываем группу если она свернута
                    const childrenList = document.getElementById(`children-${groupId}`);
                    if (childrenList && childrenList.style.display === 'none') {
                        toggleGroup(groupId);
                    }
                    // Показываем группу (если она не скрыта поиском групп)
                    if (!hasGroupSearch || !groupCard.classList.contains('hidden-by-search')) {
                        groupCard.classList.remove('hidden-by-search');
                    }
                }
            }
        } else {
            card.classList.remove('highlighted');
            // Скрываем карточку ребенка, если он не найден
            card.classList.add('hidden-by-search');
        }
    });
    
    // Показываем информацию о результатах (комбинируем с поиском групп если есть)
    if (resultsInfo) {
        if (foundCount > 0) {
            let message = `Найдено детей: ${foundCount}`;
            if (hasGroupSearch) {
                const groupQuery = groupSearchInput.value.trim();
                const groupCards = document.querySelectorAll('.group-card:not(.hidden-by-search)');
                message += ` в ${groupCards.length} группе(ах)`;
            }
            resultsInfo.textContent = message;
            resultsInfo.style.display = 'block';
            resultsInfo.style.background = 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)';
        } else {
            resultsInfo.textContent = 'Дети не найдены';
            resultsInfo.style.display = 'block';
            resultsInfo.style.background = 'linear-gradient(135deg, #ff6b6b 0%, #ff5252 100%)';
        }
    }
}

function clearGroupSearch() {
    const input = document.getElementById('group-search');
    if (input) {
        input.value = '';
        searchGroups('');
    }
}

function clearChildSearch() {
    const input = document.getElementById('child-search');
    if (input) {
        input.value = '';
        searchChildren('');
    }
}

