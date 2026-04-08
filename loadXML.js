// Кэш для XML данных (глобальный для использования в других файлах)
let xmlDataCache = null;
let xmlLoadPromise = null;

// Делаем кэш доступным глобально
if (typeof window !== 'undefined') {
    window.xmlDataCache = null;
    Object.defineProperty(window, 'xmlDataCache', {
        get: function() { return xmlDataCache; },
        set: function(value) { xmlDataCache = value; }
    });
}

// Функция для загрузки и парсинга XML с кэшированием
function loadXMLData() {
    // Если данные уже загружены, возвращаем их сразу
    if (xmlDataCache) {
        return Promise.resolve(xmlDataCache);
    }
    
    // Если загрузка уже идет, возвращаем существующий промис
    if (xmlLoadPromise) {
        return xmlLoadPromise;
    }
    
    // Проверяем протокол - если file://, сразу используем встроенные данные
    if (window.location.protocol === 'file:') {
        console.log('Обнаружен протокол file://, используем встроенные данные');
        return loadEmbeddedData();
    }
    
    // Создаем новый промис для загрузки
    xmlLoadPromise = new Promise((resolve, reject) => {
        // Сначала пытаемся загрузить через XMLHttpRequest
        const xhr = new XMLHttpRequest();
        xhr.open('GET', 'data.xml', true);
        
        xhr.onerror = function() {
            // Пытаемся загрузить через fetch или встроенные данные
            console.log('Ошибка загрузки XML, пытаемся альтернативный способ');
            tryLoadXMLAlternative().then(resolve).catch(reject);
        };
        
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                if (xhr.status === 200 || xhr.status === 0) {
                    // Статус 0 может быть при file:// протоколе, но может не работать из-за CORS
                    let xmlDoc = xhr.responseXML;
                    
                    if (!xmlDoc || xmlDoc.documentElement.nodeName === 'parsererror') {
                        // Попытка парсинга как текста
                        if (xhr.responseText && xhr.responseText.length > 0) {
                            const parser = new DOMParser();
                            xmlDoc = parser.parseFromString(xhr.responseText, 'text/xml');
                            
                            // Проверка на ошибку парсинга
                            if (xmlDoc.documentElement.nodeName === 'parsererror') {
                                console.log('Ошибка парсинга XML, пытаемся альтернативный способ');
                                tryLoadXMLAlternative().then(resolve).catch(reject);
                                return;
                            }
                        } else {
                            // Нет данных, используем альтернативный способ
                            console.log('Нет данных в ответе, пытаемся альтернативный способ');
                            tryLoadXMLAlternative().then(resolve).catch(reject);
                            return;
                        }
                    }
                    
                    // Кэшируем результат
                    xmlDataCache = xmlDoc;
                    xmlLoadPromise = null;
                    resolve(xmlDoc);
                } else {
                    if (xhr.status === 0) {
                        // Статус 0 обычно означает CORS ошибку при file://
                        // Пытаемся альтернативный способ
                        console.log('CORS ошибка, пытаемся альтернативный способ');
                        tryLoadXMLAlternative().then(resolve).catch(reject);
                    } else {
                        console.log('Ошибка загрузки XML (статус: ' + xhr.status + '), пытаемся альтернативный способ');
                        tryLoadXMLAlternative().then(resolve).catch(reject);
                    }
                }
            }
        };
        
        try {
            xhr.send();
        } catch (e) {
            console.log('Ошибка XMLHttpRequest, пытаемся альтернативный способ:', e);
            tryLoadXMLAlternative().then(resolve).catch(reject);
        }
    });
    
    return xmlLoadPromise;
}

// Альтернативный способ загрузки XML (для file:// протокола)
function tryLoadXMLAlternative() {
    return new Promise((resolve, reject) => {
        // Пытаемся использовать fetch (может работать в некоторых браузерах)
        if (typeof fetch !== 'undefined') {
            fetch('data.xml')
                .then(response => {
                    if (!response.ok) throw new Error('Network response was not ok');
                    return response.text();
                })
                .then(text => {
                    const parser = new DOMParser();
                    const xmlDoc = parser.parseFromString(text, 'text/xml');
                    
                    if (xmlDoc.documentElement.nodeName === 'parsererror') {
                        throw new Error('XML parsing error');
                    }
                    
                    // Кэшируем результат
                    xmlDataCache = xmlDoc;
                    xmlLoadPromise = null;
                    resolve(xmlDoc);
                })
                .catch(error => {
                    console.log('Fetch не удался, используем встроенные данные:', error);
                    loadEmbeddedData().then(resolve).catch(reject);
                });
        } else {
            // Если fetch недоступен, используем встроенные данные
            console.log('Fetch недоступен, используем встроенные данные');
            loadEmbeddedData().then(resolve).catch(reject);
        }
    });
}

// Функция для отображения ошибки с инструкциями
function showError(message) {
    const container = document.querySelector('.container');
    if (container) {
        container.innerHTML = `
            <header style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 40px; text-align: center;">
                <h1>ТЕРЕМОК</h1>
            </header>
            <div style="padding: 40px; text-align: center;">
                <div style="background: #fff3cd; border: 2px solid #ffc107; border-radius: 10px; padding: 30px; margin: 20px 0;">
                    <h2 style="color: #856404; margin-bottom: 20px;">⚠️ Ошибка загрузки данных</h2>
                    <p style="color: #856404; font-size: 1.1em; margin-bottom: 20px;">${message}</p>
                </div>
                <div style="background: #e7f3ff; border: 2px solid #2196F3; border-radius: 10px; padding: 30px; margin: 20px 0; text-align: left;">
                    <h3 style="color: #1976D2; margin-bottom: 15px;">📋 Как запустить приложение:</h3>
                    <ol style="color: #1976D2; line-height: 2;">
                        <li><strong>Через Python:</strong><br/>
                            <code style="background: white; padding: 5px 10px; border-radius: 5px; display: inline-block; margin-top: 5px;">
                                python -m http.server 8000
                            </code><br/>
                            Затем откройте: <code style="background: white; padding: 5px 10px; border-radius: 5px;">http://localhost:8000/index.html</code>
                        </li>
                        <li style="margin-top: 15px;"><strong>Через Node.js:</strong><br/>
                            <code style="background: white; padding: 5px 10px; border-radius: 5px; display: inline-block; margin-top: 5px;">
                                npx http-server
                            </code>
                        </li>
                        <li style="margin-top: 15px;"><strong>Через PHP:</strong><br/>
                            <code style="background: white; padding: 5px 10px; border-radius: 5px; display: inline-block; margin-top: 5px;">
                                php -S localhost:8000
                            </code>
                        </li>
                    </ol>
                    <p style="color: #1976D2; margin-top: 20px;">
                        <strong>Или</strong> откройте файл <code style="background: white; padding: 5px 10px; border-radius: 5px;">data.xml</code> напрямую в браузере для просмотра с XSLT трансформацией.
                    </p>
                </div>
                <button onclick="location.reload()" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; border: none; padding: 15px 30px; border-radius: 25px; font-size: 1.1em; cursor: pointer; margin-top: 20px;">
                    🔄 Попробовать снова
                </button>
            </div>
        `;
    } else {
        document.body.innerHTML = '<div style="padding: 40px; text-align: center;"><h1>Ошибка загрузки данных</h1><p>' + message + '</p></div>';
    }
}

// Кэш для элементов заголовка
const headerCache = {
    name: null,
    address: null,
    phone: null,
    email: null,
    description: null,
    init: function() {
        if (!this.name) this.name = document.getElementById('kindergarten-name');
        if (!this.address) this.address = document.getElementById('address');
        if (!this.phone) this.phone = document.getElementById('phone');
        if (!this.email) this.email = document.getElementById('email');
        if (!this.description) this.description = document.getElementById('description');
    }
};

// Функция для отображения данных из XML
function displayData(xmlDoc) {
    console.log('displayData вызвана, xmlDoc:', xmlDoc);
    
    if (!xmlDoc) {
        console.error('xmlDoc пуст или не определен');
        // Пытаемся загрузить встроенные данные
        loadEmbeddedData().then(embeddedDoc => {
            displayData(embeddedDoc);
        }).catch(err => {
            console.error('Ошибка загрузки встроенных данных:', err);
        });
        return;
    }
    
    // Получаем корневой элемент
    const kindergarten = xmlDoc.querySelector('детский_сад');
    
    if (!kindergarten) {
        console.error('Не найден корневой элемент детский_сад');
        // Пытаемся загрузить встроенные данные
        loadEmbeddedData().then(embeddedDoc => {
            displayData(embeddedDoc);
        }).catch(err => {
            console.error('Ошибка загрузки встроенных данных:', err);
        });
        return;
    }
    
    console.log('Корневой элемент найден');
    
    // Инициализируем кэш заголовка
    headerCache.init();
    
    // Заполняем заголовок
    const name = kindergarten.querySelector('название');
    if (name && headerCache.name) {
        headerCache.name.textContent = name.textContent;
        console.log('Название установлено:', name.textContent);
    }
    
    // Заполняем контактную информацию
    const address = kindergarten.querySelector('адрес');
    if (address && headerCache.address) {
        headerCache.address.textContent = address.textContent;
    }
    
    const phone = kindergarten.querySelector('телефон');
    if (phone && headerCache.phone) {
        headerCache.phone.textContent = phone.textContent;
    }
    
    const email = kindergarten.querySelector('email');
    if (email && headerCache.email) {
        headerCache.email.textContent = email.textContent;
    }
    
    const description = kindergarten.querySelector('описание');
    if (description && headerCache.description) {
        headerCache.description.textContent = description.textContent;
    }
    
    updateFooterFromKindergarten(kindergarten);
    updateParentsMapLink(kindergarten);
    populateHomeUpcomingEvents(kindergarten);
    
    // Отображаем группы (всегда загружаем при первой загрузке)
    try {
        displayGroups(kindergarten);
        console.log('Группы отображены');
    } catch (e) {
        console.error('Ошибка при отображении групп:', e);
    }
    
    // Расписание и мероприятия загружаются лениво при активации секции
    // Но если секция уже активна, загружаем сразу
    const activeSection = document.querySelector('.content-section.active');
    if (activeSection) {
        const sectionId = activeSection.id;
        if (sectionId === 'schedule') {
            try {
                displaySchedule(kindergarten);
            } catch (e) {
                console.error('Ошибка при отображении расписания:', e);
            }
        } else if (sectionId === 'events') {
            try {
                displayEvents(kindergarten);
            } catch (e) {
                console.error('Ошибка при отображении мероприятий:', e);
            }
        }
    }
    
    console.log('displayData завершена успешно');
}

// Глобальная переменная для хранения данных о детях
let childrenData = {};
let groupsDataForSearch = []; // Данные групп для поиска

// Кэш для DOM селекторов
const domCache = {
    groupsContainer: null,
    scheduleContainer: null,
    eventsContainer: null,
    getGroupsContainer: function() {
        if (!this.groupsContainer) {
            this.groupsContainer = document.getElementById('groups-content');
        }
        return this.groupsContainer;
    },
    getScheduleContainer: function() {
        if (!this.scheduleContainer) {
            this.scheduleContainer = document.getElementById('schedule-content');
        }
        return this.scheduleContainer;
    },
    getEventsContainer: function() {
        if (!this.eventsContainer) {
            this.eventsContainer = document.getElementById('events-content');
        }
        return this.eventsContainer;
    }
};

// Функция для отображения групп
function displayGroups(kindergarten) {
    const groupsContainer = domCache.getGroupsContainer();
    if (!groupsContainer) return;
    
    // Очищаем данные для поиска
    groupsDataForSearch = [];
    childrenData = {};
    
    // Загружаем группы из XML
    const xmlGroups = kindergarten.querySelectorAll('группа');
    // Индекс по id: метаданные группы могут быть из adminGroups, а дети — только в XML
    const xmlGroupsById = new Map();
    xmlGroups.forEach((group, groupIndex) => {
        const gid = group.getAttribute('id') || String(groupIndex + 1);
        xmlGroupsById.set(gid, group);
    });
    
    // Загружаем группы из localStorage (добавленные через админ-панель)
    let adminGroups = [];
    if (typeof window !== 'undefined') {
        if (window.SecurityModule) {
            adminGroups = window.SecurityModule.safeGetLocalStorage('adminGroups') || [];
        } else {
            try {
                adminGroups = JSON.parse(localStorage.getItem('adminGroups') || '[]');
            } catch (e) {
                adminGroups = [];
            }
        }
    }
    
    console.log('Загружено групп из XML:', xmlGroups.length);
    console.log('Загружено групп из localStorage:', adminGroups.length);
    console.log('Группы из localStorage:', adminGroups);
    
    // Создаем Map для хранения групп по ID (приоритет у adminGroups)
    const groupsMap = new Map();
    
    // Сначала добавляем группы из XML
    xmlGroups.forEach((group, groupIndex) => {
        const groupId = group.getAttribute('id') || String(groupIndex + 1);
        if (!groupsMap.has(groupId)) {
            groupsMap.set(groupId, {
                source: 'xml',
                element: group
            });
        }
    });
    
    // Затем добавляем/перезаписываем группы из localStorage
    adminGroups.forEach(group => {
        if (group && group.id) {
            groupsMap.set(group.id, {
                source: 'localStorage',
                data: group
            });
            console.log('Добавлена группа из localStorage:', group.id, group.name);
        }
    });
    
    console.log('Всего групп для отображения:', groupsMap.size);
    
    if (groupsMap.size === 0) {
        groupsContainer.innerHTML = '<p>Группы не найдены</p>';
        return;
    }
    
    // Используем DocumentFragment для оптимизации DOM-манипуляций
    const fragment = document.createDocumentFragment();
    const tempDiv = document.createElement('div');
    
    let html = '';
    
    // Обрабатываем все группы
    groupsMap.forEach((groupInfo, groupId) => {
        let name, age, teacher, nanniesList, xmlChildrenCount, groupAcceptedChildren;
        
        if (groupInfo.source === 'localStorage') {
            // Группа из localStorage
            const group = groupInfo.data;
            const sanitize = (typeof window !== 'undefined' && window.SecurityModule) ? 
                window.SecurityModule.sanitizeHTML : (str) => str;
            name = sanitize(group.name || 'Без названия');
            age = sanitize(group.age || '');
            teacher = sanitize(group.teacher || '');
            const nannies = (group.nannies || []).map(n => sanitize(n));
            nanniesList = nannies.length > 0 
                ? `<p><strong>Няни:</strong> ${nannies.join(', ')}</p>` 
                : '';
            const xmlEl = xmlGroupsById.get(groupId);
            const xmlKids = xmlEl ? xmlEl.querySelectorAll('ребенок').length : 0;
            const storedKids = (group.children && Array.isArray(group.children)) ? group.children.length : 0;
            // children в adminGroups обычно не сохраняют; считаем детей из XML при совпадении id
            xmlChildrenCount = xmlKids || storedKids;
        } else {
            // Группа из XML
            const group = groupInfo.element;
            name = group.querySelector('название')?.textContent || 'Без названия';
            age = group.querySelector('возраст')?.textContent || '';
            teacher = group.querySelector('воспитатель')?.textContent || '';
            
            // Получаем нянь
            const nannies = group.querySelectorAll('няни няня');
            nanniesList = '';
            if (nannies.length > 0) {
                nanniesList = '<p><strong>Няни:</strong> ';
                nannies.forEach((nanny, index) => {
                    nanniesList += nanny.textContent;
                    if (index < nannies.length - 1) {
                        nanniesList += ', ';
                    }
                });
                nanniesList += '</p>';
            }
            
            // Получаем детей из XML
            const children = group.querySelectorAll('ребенок');
            xmlChildrenCount = children.length;
        }
        
        // Получаем принятых детей из localStorage для этой группы
        let acceptedChildren = [];
        if (typeof window !== 'undefined') {
            if (window.SecurityModule) {
                acceptedChildren = window.SecurityModule.safeGetLocalStorage('acceptedChildren') || [];
            } else {
                try {
                    acceptedChildren = JSON.parse(localStorage.getItem('acceptedChildren') || '[]');
                } catch (e) {
                    acceptedChildren = [];
                }
            }
        }
        
        // Фильтруем детей для этой группы
        groupAcceptedChildren = acceptedChildren.filter(child => child.groupId === groupId);
        
        // Сохраняем данные группы для поиска
        groupsDataForSearch.push({
            id: groupId,
            name: name,
            element: null
        });
        
        // Безопасная обработка данных для HTML
        const sanitize = (typeof window !== 'undefined' && window.SecurityModule) ? 
            window.SecurityModule.sanitizeHTML : (str) => str;
        const safeName = sanitize(name);
        const safeAge = sanitize(age);
        const safeTeacher = sanitize(teacher);
        
        // Создаем уникальный placeholder для количества детей для этой группы
        const childrenCountPlaceholder = `__CHILDREN_COUNT_${groupId}__`;
        const acceptedChildrenCountPlaceholder = `__ACCEPTED_CHILDREN_COUNT_${groupId}__`;
        
        html += `
            <div class="group-card" data-group-id="${groupId}" data-group-name="${safeName.toLowerCase()}">
                <div class="group-header" onclick="toggleGroup('${groupId}')">
                    <h3>${safeName}</h3>
                    <span class="toggle-icon" id="toggle-${groupId}">▼</span>
                </div>
                <div class="group-info">
                    <p><strong>Возраст:</strong> ${safeAge}</p>
                    <p><strong>Воспитатель:</strong> ${safeTeacher}</p>
                    ${nanniesList}
                    <p><strong>Количество детей:</strong> ${childrenCountPlaceholder}${acceptedChildrenCountPlaceholder}</p>
                </div>
                <button type="button" class="group-schedule-btn" onclick="selectGroupForSchedule('${groupId}', event)">
                    Расписание группы
                </button>
                <div class="children-list" id="children-${groupId}" style="display: none;">
                    <h4>Дети в группе:</h4>
                    <div class="children-grid">
        `;
        
        let childIndex = 0;
        let actualXmlChildrenCount = 0; // Фактическое количество детей из XML / той же разметки
        
        // Дети из разметки XML: и для группы source==='xml', и когда метаданные из adminGroups, но id совпадает с группой в data.xml
        const xmlGroupElementForChildren = groupInfo.source === 'xml'
            ? groupInfo.element
            : xmlGroupsById.get(groupId);
        
        if (xmlGroupElementForChildren) {
            const groupEl = xmlGroupElementForChildren;
            const children = groupEl.querySelectorAll('ребенок');
            
            children.forEach((child) => {
                const firstName = child.querySelector('имя')?.textContent || '';
                const lastName = child.querySelector('фамилия')?.textContent || '';
                const childAge = child.querySelector('возраст')?.textContent || '';
                const parent = child.querySelector('родитель')?.textContent || '';
                const phone = child.querySelector('телефон')?.textContent || '';
                const notes = child.querySelector('примечания')?.textContent || '';
                
                if (!firstName && !lastName) {
                    return;
                }
                
                const childId = `${groupId}-xml-${childIndex}`;
                
                childrenData[childId] = {
                    firstName,
                    lastName,
                    childAge,
                    parent,
                    phone,
                    notes,
                    groupName: name
                };
                
                const sanitizeChild = (typeof window !== 'undefined' && window.SecurityModule) ? 
                    window.SecurityModule.sanitizeHTML : (str) => str;
                const safeFirstName = sanitizeChild(firstName || '');
                const safeLastName = sanitizeChild(lastName || '');
                const safeAge = sanitizeChild(childAge || '');
                
                html += `
                    <div class="child-card" onclick="showChildInfo('${childId}')" data-child-first-name="${safeFirstName.toLowerCase()}" data-child-last-name="${safeLastName.toLowerCase()}" data-child-full-name="${(safeFirstName + ' ' + safeLastName).toLowerCase()}">
                        <div class="child-avatar">${safeFirstName.charAt(0)}${safeLastName.charAt(0)}</div>
                        <div class="child-name">${safeFirstName} ${safeLastName}</div>
                        <div class="child-age">${safeAge} лет</div>
                        <div class="child-more">Подробнее →</div>
                    </div>
                `;
                childIndex++;
                actualXmlChildrenCount++;
            });
            
            xmlChildrenCount = actualXmlChildrenCount;
        } else if (groupInfo.source === 'localStorage' && groupInfo.data && Array.isArray(groupInfo.data.children) && groupInfo.data.children.length > 0) {
            // Редкий случай: дети в объекте группы (импорт/расширение), без узла в XML
            groupInfo.data.children.forEach((child) => {
                const firstName = child.firstName || '';
                const lastName = child.lastName || '';
                if (!firstName && !lastName) {
                    return;
                }
                const childAge = child.age || '';
                const parent = child.parent || '';
                const phone = child.phone || '';
                const notes = child.notes || '';
                
                const childId = `${groupId}-stored-${childIndex}`;
                childrenData[childId] = {
                    firstName,
                    lastName,
                    childAge,
                    parent,
                    phone,
                    notes,
                    groupName: name
                };
                
                const sanitizeChild = (typeof window !== 'undefined' && window.SecurityModule) ? 
                    window.SecurityModule.sanitizeHTML : (str) => str;
                const safeFirstName = sanitizeChild(firstName || '');
                const safeLastName = sanitizeChild(lastName || '');
                const safeAge = sanitizeChild(childAge || '');
                
                html += `
                    <div class="child-card" onclick="showChildInfo('${childId}')" data-child-first-name="${safeFirstName.toLowerCase()}" data-child-last-name="${safeLastName.toLowerCase()}" data-child-full-name="${(safeFirstName + ' ' + safeLastName).toLowerCase()}">
                        <div class="child-avatar">${safeFirstName.charAt(0)}${safeLastName.charAt(0)}</div>
                        <div class="child-name">${safeFirstName} ${safeLastName}</div>
                        <div class="child-age">${safeAge} лет</div>
                        <div class="child-more">Подробнее →</div>
                    </div>
                `;
                childIndex++;
                actualXmlChildrenCount++;
            });
            xmlChildrenCount = actualXmlChildrenCount;
        }
        
        // Используем уже объявленный groupAcceptedChildren (объявлен выше на строке 445)
        // Добавляем принятых детей
        groupAcceptedChildren.forEach((child) => {
            const childId = child.id || `${groupId}-accepted-${childIndex}`;
            
            // Сохраняем данные о ребенке
            childrenData[childId] = {
                firstName: child.firstName,
                lastName: child.lastName,
                childAge: child.age,
                parent: child.parent,
                phone: child.phone,
                notes: child.notes || '',
                email: child.email || '',
                groupName: name
            };
            
            // Безопасная обработка данных
            const sanitize = (typeof window !== 'undefined' && window.SecurityModule) ? 
                window.SecurityModule.sanitizeHTML : (str) => str;
            const safeFirstName = sanitize(child.firstName || '');
            const safeLastName = sanitize(child.lastName || '');
            const safeAge = sanitize(child.age || '');
            
            html += `
                <div class="child-card" onclick="showChildInfo('${childId}')" style="border-left: 3px solid #4CAF50;" data-child-first-name="${safeFirstName.toLowerCase()}" data-child-last-name="${safeLastName.toLowerCase()}" data-child-full-name="${(safeFirstName + ' ' + safeLastName).toLowerCase()}">
                    <div class="child-avatar">${safeFirstName.charAt(0)}${safeLastName.charAt(0)}</div>
                    <div class="child-name">${safeFirstName} ${safeLastName}</div>
                    <div class="child-age">${safeAge} лет</div>
                    <div class="child-more" style="color: #4CAF50;">✓ Принят(а)</div>
                </div>
            `;
            childIndex++;
        });
        
        // Пересчитываем общее количество детей после добавления всех
        const totalChildrenCount = actualXmlChildrenCount + groupAcceptedChildren.length;
        
        // Заменяем уникальные плейсхолдеры на реальные значения (уникальные для каждой группы)
        html = html.replace(childrenCountPlaceholder, totalChildrenCount.toString());
        if (groupAcceptedChildren.length > 0) {
            html = html.replace(acceptedChildrenCountPlaceholder, ` (принято: ${groupAcceptedChildren.length})`);
        } else {
            html = html.replace(acceptedChildrenCountPlaceholder, '');
        }
        
        html += `
                    </div>
                </div>
            </div>
        `;
    });
    
    console.log('HTML сгенерирован, длина:', html.length);
    
    // Используем innerHTML один раз вместо множественных операций
    tempDiv.innerHTML = html;
    while (tempDiv.firstChild) {
        fragment.appendChild(tempDiv.firstChild);
    }
    groupsContainer.innerHTML = '';
    groupsContainer.appendChild(fragment);
    updateSelectedGroupHighlight();
    
    console.log('Группы отображены в контейнере');
}

// Выбранная в разделе "Группы" группа для автоподстановки в "Расписание"
let preferredScheduleGroupId = null;

function setPreferredScheduleGroup(groupId) {
    preferredScheduleGroupId = groupId ? String(groupId) : null;
    try {
        localStorage.setItem('preferredScheduleGroupId', preferredScheduleGroupId || '');
    } catch (e) {
        // localStorage может быть недоступен
    }
}

function getPreferredScheduleGroup() {
    if (preferredScheduleGroupId) return preferredScheduleGroupId;
    try {
        const saved = localStorage.getItem('preferredScheduleGroupId');
        preferredScheduleGroupId = saved ? String(saved) : null;
    } catch (e) {
        preferredScheduleGroupId = null;
    }
    return preferredScheduleGroupId;
}

function updateSelectedGroupHighlight() {
    const selectedId = getPreferredScheduleGroup();
    const cards = document.querySelectorAll('#groups-content .group-card');
    cards.forEach((card) => {
        const cardId = card.getAttribute('data-group-id');
        card.classList.toggle('group-card-selected', !!selectedId && cardId === selectedId);
    });
}

function selectGroupForSchedule(groupId, event) {
    if (event && typeof event.stopPropagation === 'function') {
        event.stopPropagation();
    }
    setPreferredScheduleGroup(groupId);
    updateSelectedGroupHighlight();
    if (typeof showSection === 'function') {
        showSection('schedule');
    }
    // Принудительно обновляем селект и таблицу, даже если вкладка уже была открыта ранее
    const groupSelect = document.getElementById('schedule-group-select');
    if (groupSelect && Array.from(groupSelect.options).some(opt => opt.value === String(groupId))) {
        groupSelect.value = String(groupId);
        if (typeof renderScheduleTable === 'function') {
            renderScheduleTable(String(groupId));
        }
    }
}

// Функция для переключения видимости списка детей
function toggleGroup(groupId) {
    const childrenList = document.getElementById(`children-${groupId}`);
    const toggleIcon = document.getElementById(`toggle-${groupId}`);

    // Запоминаем выбранную группу для вкладки "Расписание"
    setPreferredScheduleGroup(groupId);
    updateSelectedGroupHighlight();
    
    if (childrenList.style.display === 'none') {
        childrenList.style.display = 'block';
        toggleIcon.textContent = '▲';
    } else {
        childrenList.style.display = 'none';
        toggleIcon.textContent = '▼';
    }
}

// Функция для отображения информации о ребенке
function showChildInfo(childId) {
    const child = childrenData[childId];
    if (!child) return;
    
    const modal = document.getElementById('child-modal');
    const modalContent = document.getElementById('child-modal-content');
    if (!modal || !modalContent) return;
    
    // Безопасное создание содержимого модального окна
    const sanitize = (typeof window !== 'undefined' && window.SecurityModule) ? 
        window.SecurityModule.sanitizeHTML : (str) => str;
    const createSafeElement = (typeof window !== 'undefined' && window.SecurityModule) ? 
        window.SecurityModule.createSafeElement : null;
    
    modalContent.textContent = ''; // Очищаем
    
    // Создаем элементы безопасным способом
    const header = document.createElement('div');
    header.className = 'modal-header';
    
    const h2 = document.createElement('h2');
    h2.textContent = 'Информация о ребенке';
    header.appendChild(h2);
    
    const closeBtn = document.createElement('span');
    closeBtn.className = 'close-modal';
    closeBtn.textContent = '×';
    closeBtn.onclick = closeChildModal;
    header.appendChild(closeBtn);
    
    const body = document.createElement('div');
    body.className = 'modal-body';
    
    const avatar = document.createElement('div');
    avatar.className = 'child-detail-avatar';
    avatar.textContent = (child.firstName.charAt(0) || '') + (child.lastName.charAt(0) || '');
    body.appendChild(avatar);
    
    const h3 = document.createElement('h3');
    h3.textContent = `${sanitize(child.firstName || '')} ${sanitize(child.lastName || '')}`;
    body.appendChild(h3);
    
    const infoDiv = document.createElement('div');
    infoDiv.className = 'child-detail-info';
    
    // Создаем информационные строки
    const fields = [
        { label: 'Возраст:', value: `${sanitize(child.childAge || '')} лет` },
        { label: 'Группа:', value: sanitize(child.groupName || '') },
        { label: 'Родитель:', value: sanitize(child.parent || '') },
        { label: 'Телефон:', value: sanitize(child.phone || ''), isPhone: true }
    ];
    
    fields.forEach(field => {
        const row = document.createElement('div');
        row.className = 'info-row' + (field.isPhone ? '' : '');
        
        const strong = document.createElement('strong');
        strong.textContent = field.label + ' ';
        row.appendChild(strong);
        
        if (field.isPhone && field.value) {
            const link = document.createElement('a');
            link.href = `tel:${field.value}`;
            link.textContent = field.value;
            row.appendChild(link);
        } else {
            const span = document.createElement('span');
            span.textContent = field.value;
            row.appendChild(span);
        }
        
        infoDiv.appendChild(row);
    });
    
    // Примечания
    if (child.notes) {
        const notesRow = document.createElement('div');
        notesRow.className = 'info-row notes';
        
        const strong = document.createElement('strong');
        strong.textContent = 'Примечания: ';
        notesRow.appendChild(strong);
        
        const span = document.createElement('span');
        span.textContent = sanitize(child.notes);
        notesRow.appendChild(span);
        
        infoDiv.appendChild(notesRow);
    }
    
    body.appendChild(infoDiv);
    modalContent.appendChild(header);
    modalContent.appendChild(body);
    
    modal.style.display = 'block';
}

// Функция для закрытия модального окна
function closeChildModal() {
    const modal = document.getElementById('child-modal');
    modal.style.display = 'none';
}

// Глобальные данные расписания
let scheduleData = [];

const weekDayOrder = {
    'Понедельник': 1,
    'Вторник': 2,
    'Среда': 3,
    'Четверг': 4,
    'Пятница': 5,
    'Суббота': 6,
    'Воскресенье': 7
};

const weekDaysFull = [
    'Понедельник',
    'Вторник',
    'Среда',
    'Четверг',
    'Пятница',
    'Суббота',
    'Воскресенье'
];

function getDefaultActivityByDay(day) {
    if (day === 'Суббота') return 'Сокращенный день: дежурные занятия и прогулка';
    if (day === 'Воскресенье') return 'Выходной. Детский сад не работает';
    return 'Полный день: занятия по программе, прогулка, питание и игры';
}

function getDefaultTimeByDay(day) {
    if (day === 'Суббота') return '08:00-13:00';
    if (day === 'Воскресенье') return 'Выходной';
    return '08:00-18:00';
}

function ensureScheduleForAllDays(items) {
    const groupIds = ['1', '2', '3', '4'];
    const keyOf = (groupId, day) => `${groupId}|${day}`;
    const existing = new Set(items.map(i => keyOf(i.groupId, i.day)));
    const result = [...items];

    groupIds.forEach((groupId) => {
        weekDaysFull.forEach((day) => {
            const key = keyOf(groupId, day);
            if (!existing.has(key)) {
                result.push({
                    day,
                    time: getDefaultTimeByDay(day),
                    activity: getDefaultActivityByDay(day),
                    groupId
                });
            }
        });
    });

    return result;
}

function getGroupStudyActivity(groupId, day) {
    const byGroup = {
        '1': `Развивающие игры и сенсорика (${day})`,
        '2': `Занятия по развитию речи и математики (${day})`,
        '3': `Подготовка к школе и логика (${day})`,
        '4': `Интеллектуальные занятия и подготовка к школе (${day})`
    };
    return byGroup[String(groupId)] || `Образовательный блок (${day})`;
}

function buildDetailedDayPlan(day, groupId) {
    if (day === 'Воскресенье') {
        return [
            { day, time: 'Выходной', activity: 'Отдых. Детский сад не работает', groupId: String(groupId) }
        ];
    }

    if (day === 'Суббота') {
        return [
            { day, time: '08:00-08:30', activity: 'Прием детей, утренняя гимнастика', groupId: String(groupId) },
            { day, time: '08:30-09:00', activity: 'Завтрак', groupId: String(groupId) },
            { day, time: '09:00-10:00', activity: getGroupStudyActivity(groupId, day), groupId: String(groupId) },
            { day, time: '10:00-11:00', activity: 'Прогулка', groupId: String(groupId) },
            { day, time: '11:00-12:00', activity: 'Творческие занятия и игры', groupId: String(groupId) },
            { day, time: '12:00-13:00', activity: 'Обед, уход домой (сокращенный день)', groupId: String(groupId) }
        ];
    }

    return [
        { day, time: '08:00-08:30', activity: 'Прием детей, утренняя гимнастика', groupId: String(groupId) },
        { day, time: '08:30-09:00', activity: 'Завтрак', groupId: String(groupId) },
        { day, time: '09:00-10:00', activity: getGroupStudyActivity(groupId, day), groupId: String(groupId) },
        { day, time: '10:00-11:00', activity: 'Прогулка', groupId: String(groupId) },
        { day, time: '11:00-12:00', activity: 'Занятия по творчеству/музыке', groupId: String(groupId) },
        { day, time: '12:00-13:00', activity: 'Обед', groupId: String(groupId) },
        { day, time: '13:00-15:00', activity: 'Тихий час / отдых', groupId: String(groupId) },
        { day, time: '15:00-15:30', activity: 'Полдник', groupId: String(groupId) },
        { day, time: '15:30-16:30', activity: 'Игры и кружки', groupId: String(groupId) },
        { day, time: '16:30-18:00', activity: 'Прогулка, свободная деятельность, уход домой', groupId: String(groupId) }
    ];
}

function ensureDetailedSchedule(items) {
    const groupIds = ['1', '2', '3', '4'];
    const result = [];

    groupIds.forEach((groupId) => {
        weekDaysFull.forEach((day) => {
            const dayGroupItems = items.filter(i => String(i.groupId) === String(groupId) && i.day === day);
            const hasDetailed = dayGroupItems.length >= 4;

            if (hasDetailed) {
                result.push(...dayGroupItems);
            } else {
                result.push(...buildDetailedDayPlan(day, groupId));
            }
        });
    });

    return result;
}

function parseScheduleTimeToMinutes(timeStr) {
    const src = String(timeStr || '').trim();
    // Поддержка форматов "08:30" и диапазонов "08:30-09:00"
    const startPart = src.includes('-') ? src.split('-')[0].trim() : src;
    const m = startPart.match(/^(\d{1,2}):(\d{2})$/);
    if (!m) return Number.MAX_SAFE_INTEGER;
    return Number(m[1]) * 60 + Number(m[2]);
}

// Дебаунсинг для фильтрации расписания
let scheduleFilterTimeout = null;

// Функция для отображения расписания
function displaySchedule(kindergarten) {
    const scheduleContainer = domCache.getScheduleContainer();
    if (!scheduleContainer) return;
    
    const scheduleItems = kindergarten.querySelectorAll('расписание день');
    const groupSelect = document.getElementById('schedule-group-select');
    const daySelect = document.getElementById('schedule-day-select');
    
    if (scheduleItems.length === 0) {
        scheduleContainer.innerHTML = '<tr><td colspan="3">Расписание не найдено</td></tr>';
        return;
    }
    
    // Подготовим данные расписания
    scheduleData = Array.from(scheduleItems).map(item => {
        const day = item.getAttribute('день_недели') || item.getAttribute('day') || '';
        const time = item.querySelector('время')?.textContent || '';
        const activity = item.querySelector('активность')?.textContent || '';
        const rawGroup = item.getAttribute('группа') || item.getAttribute('group') || 'all';
        const groupId = (rawGroup || 'all').toString().trim();
        return { day, time, activity, groupId };
    });
    scheduleData = ensureScheduleForAllDays(scheduleData);
    scheduleData = ensureDetailedSchedule(scheduleData);
    
    // Заполняем выпадающий список групп, если он есть
    if (groupSelect && groupSelect.options.length === 1) {
        const groups = kindergarten.querySelectorAll('группы группа');
        groups.forEach(group => {
            const id = group.getAttribute('id');
            const name = group.querySelector('название')?.textContent || `Группа ${id}`;
            if (id) {
                const option = document.createElement('option');
                option.value = id;
                option.textContent = name;
                groupSelect.appendChild(option);
            }
        });
        
        // Дебаунсинг для изменения фильтра расписания
        groupSelect.addEventListener('change', function() {
            const value = this.value;
            const dayValue = daySelect ? daySelect.value : 'all';
            if (scheduleFilterTimeout) {
                clearTimeout(scheduleFilterTimeout);
            }
            scheduleFilterTimeout = setTimeout(() => {
                renderScheduleTable(value, dayValue);
            }, 150);
        });
    }

    // Заполняем выпадающий список дней полным набором (Пн-Вс)
    if (daySelect && daySelect.options.length === 1) {
        weekDaysFull.forEach(day => {
            const option = document.createElement('option');
            option.value = day;
            option.textContent = day;
            daySelect.appendChild(option);
        });

        daySelect.addEventListener('change', function() {
            const dayValue = this.value;
            const groupValue = groupSelect ? groupSelect.value : 'all';
            if (scheduleFilterTimeout) {
                clearTimeout(scheduleFilterTimeout);
            }
            scheduleFilterTimeout = setTimeout(() => {
                renderScheduleTable(groupValue, dayValue);
            }, 150);
        });
    }
    
    // Подставляем ранее выбранную группу из вкладки "Группы"
    if (groupSelect) {
        const preferredGroup = getPreferredScheduleGroup();
        if (preferredGroup && Array.from(groupSelect.options).some(opt => opt.value === preferredGroup)) {
            groupSelect.value = preferredGroup;
        }
    }

    // Отрисовываем расписание по выбранной группе и дню
    renderScheduleTable(groupSelect ? groupSelect.value : 'all', daySelect ? daySelect.value : 'all');
}

// Вспомогательная функция для отрисовки таблицы расписания по группе и дню
function renderScheduleTable(groupId, day) {
    const scheduleContainer = domCache.getScheduleContainer();
    if (!scheduleContainer) return;
    
    const normalizedGroupId = (groupId || 'all').toString().trim();
    const normalizedDay = (day || 'all').toString().trim();
    const scheduleNote = document.getElementById('schedule-note');
    
    const filtered = scheduleData.filter(item => {
        const groupMatch = (!normalizedGroupId || normalizedGroupId === 'all') ? true : item.groupId === normalizedGroupId;
        const dayMatch = (!normalizedDay || normalizedDay === 'all') ? true : item.day === normalizedDay;
        return groupMatch && dayMatch;
    });

    // В субботу сокращенный день: оставляем занятия до 13:00
    const saturdayApplied = normalizedDay === 'Суббота';
    const finalItems = saturdayApplied
        ? filtered.filter(item => parseScheduleTimeToMinutes(item.time) <= 13 * 60)
        : filtered;

    finalItems.sort((a, b) => {
        const dayA = weekDayOrder[a.day] || 99;
        const dayB = weekDayOrder[b.day] || 99;
        if (dayA !== dayB) return dayA - dayB;
        return parseScheduleTimeToMinutes(a.time) - parseScheduleTimeToMinutes(b.time);
    });
    
    if (scheduleNote) {
        if (saturdayApplied) {
            scheduleNote.textContent = 'Суббота: сокращенный день (занятия до 13:00).';
            scheduleNote.style.display = 'block';
        } else {
            scheduleNote.textContent = '';
            scheduleNote.style.display = 'none';
        }
    }

    if (finalItems.length === 0) {
        scheduleContainer.innerHTML = '<tr><td colspan="3">Для выбранной группы расписание не задано</td></tr>';
        return;
    }
    
    // Используем DocumentFragment для оптимизации
    const fragment = document.createDocumentFragment();
    const tbody = scheduleContainer.closest('table')?.querySelector('tbody') || scheduleContainer;
    
    finalItems.forEach(item => {
        const tr = document.createElement('tr');
        const dayCell = document.createElement('td');
        dayCell.textContent = item.day || 'Не указан';
        const timeCell = document.createElement('td');
        timeCell.className = 'time-cell';
        timeCell.textContent = item.time;
        const activityCell = document.createElement('td');
        activityCell.textContent = item.activity;
        tr.appendChild(dayCell);
        tr.appendChild(timeCell);
        tr.appendChild(activityCell);
        fragment.appendChild(tr);
    });
    
    // Очищаем и добавляем новые элементы
    if (tbody === scheduleContainer) {
        scheduleContainer.innerHTML = '';
        scheduleContainer.appendChild(fragment);
    } else {
        tbody.innerHTML = '';
        tbody.appendChild(fragment);
    }
}

function updateFooterFromKindergarten(kindergarten) {
    if (!kindergarten) return;
    const linkPhone = document.getElementById('footer-phone-link');
    const linkEmail = document.getElementById('footer-email-link');
    const setText = (id, tag) => {
        const el = document.getElementById(id);
        const node = kindergarten.querySelector(tag);
        if (el && node) el.textContent = node.textContent;
    };
    setText('footer-address', 'адрес');
    const phoneNode = kindergarten.querySelector('телефон');
    const emailNode = kindergarten.querySelector('email');
    setText('footer-phone', 'телефон');
    setText('footer-email', 'email');
    if (linkPhone && phoneNode) {
        const tel = phoneNode.textContent.replace(/[^\d+]/g, '');
        linkPhone.href = tel ? 'tel:' + tel : '#';
    }
    if (linkEmail && emailNode && emailNode.textContent.trim()) {
        linkEmail.href = 'mailto:' + emailNode.textContent.trim();
    }
}

function updateParentsMapLink(kindergarten) {
    const link = document.getElementById('parents-map-link');
    if (!link) return;
    const addr = kindergarten && kindergarten.querySelector('адрес') ? kindergarten.querySelector('адрес').textContent.trim() : '';
    if (addr) {
        link.href = 'https://yandex.ru/maps/?text=' + encodeURIComponent(addr);
        link.hidden = false;
    } else {
        link.hidden = true;
    }
}

function homeSectionEscapeHtml(text) {
    if (text == null || text === '') return '';
    const d = document.createElement('div');
    d.textContent = String(text);
    return d.innerHTML;
}

function parseHomeEventDate(str) {
    if (!str || typeof str !== 'string') return NaN;
    const trimmed = str.trim();
    let t = Date.parse(trimmed);
    if (!isNaN(t)) return t;
    const m = trimmed.match(/^(\d{1,2})[./](\d{1,2})[./](\d{2,4})$/);
    if (m) {
        let y = parseInt(m[3], 10);
        if (y < 100) y += 2000;
        const d = new Date(y, parseInt(m[2], 10) - 1, parseInt(m[1], 10));
        return d.getTime();
    }
    return NaN;
}

function formatHomeEventDateLabel(dateStr) {
    const ts = parseHomeEventDate(dateStr);
    if (isNaN(ts)) return dateStr;
    return new Date(ts).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}

function parseXmlEventsToList(kindergarten) {
    if (!kindergarten) return [];
    const events = kindergarten.querySelectorAll('мероприятия мероприятие');
    return Array.from(events).map(event => ({
        name: event.querySelector('название')?.textContent || '',
        date: event.querySelector('дата')?.textContent || '',
        description: event.querySelector('описание')?.textContent || ''
    }));
}

function parseAdminEventsToList() {
    try {
        const raw = JSON.parse(localStorage.getItem('adminEvents') || '[]');
        if (!Array.isArray(raw)) return [];
        return raw.map(e => ({
            name: e.name || '',
            date: e.date || '',
            description: e.description || ''
        }));
    } catch (e) {
        return [];
    }
}

function mergeEventsLists(xmlList, adminList) {
    const map = new Map();
    const keyOf = (e) => `${String(e.date || '').trim()}|${String(e.name || '').trim()}`;
    for (const e of xmlList) {
        if ((e.name && e.name.trim()) || (e.date && e.date.trim())) {
            map.set(keyOf(e), { name: e.name, date: e.date, description: e.description });
        }
    }
    for (const e of adminList) {
        if ((e.name && e.name.trim()) || (e.date && e.date.trim())) {
            map.set(keyOf(e), { name: e.name, date: e.date, description: e.description });
        }
    }
    const arr = Array.from(map.values());
    arr.sort((a, b) => {
        const ta = parseHomeEventDate(a.date);
        const tb = parseHomeEventDate(b.date);
        if (isNaN(ta) && isNaN(tb)) return 0;
        if (isNaN(ta)) return 1;
        if (isNaN(tb)) return -1;
        return ta - tb;
    });
    return arr;
}

/** Полный список для сайта: мероприятия из data.xml + добавленные в админ-панели */
function getMergedEventsForSite(kindergarten) {
    return mergeEventsLists(parseXmlEventsToList(kindergarten), parseAdminEventsToList());
}

function collectEventsForHome(kindergarten) {
    return getMergedEventsForSite(kindergarten);
}

function populateHomeUpcomingEvents(kindergarten) {
    const el = document.getElementById('home-upcoming-events');
    if (!el) return;
    const list = collectEventsForHome(kindergarten);
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const withTs = list
        .map(e => ({ ...e, ts: parseHomeEventDate(e.date) }))
        .filter(e => !isNaN(e.ts));
    const upcoming = withTs
        .filter(e => e.ts >= startOfToday.getTime())
        .sort((a, b) => a.ts - b.ts)
        .slice(0, 4);
    if (upcoming.length === 0) {
        el.innerHTML = '<p class="home-muted">Ближайшие даты смотрите в разделе «Мероприятия» или уточняйте по телефону.</p>';
        return;
    }
    el.innerHTML = upcoming.map(e => `
        <div class="home-event-mini">
            <span class="home-event-date">${homeSectionEscapeHtml(formatHomeEventDateLabel(e.date))}</span>
            <span class="home-event-name">${homeSectionEscapeHtml(e.name)}</span>
        </div>
    `).join('');
}

// Временное хранилище мероприятий для модального окна подробностей
let currentEventsList = [];

function getEventPreviewText(text, maxLength = 140) {
    const src = String(text || '').trim();
    if (src.length <= maxLength) return src;
    return `${src.slice(0, maxLength).trimEnd()}...`;
}

function getEventSeasonLabel(monthIndex) {
    if (monthIndex === 11 || monthIndex <= 1) return 'Зима';
    if (monthIndex >= 2 && monthIndex <= 4) return 'Весна';
    if (monthIndex >= 5 && monthIndex <= 7) return 'Лето';
    return 'Осень';
}

function getEventMeta(event) {
    const ts = parseHomeEventDate(event && event.date ? event.date : '');
    if (isNaN(ts)) {
        return {
            dateLabel: event && event.date ? String(event.date) : 'Не указана',
            statusLabel: 'Дата не распознана',
            countdownLabel: 'Срок не определён',
            monthLabel: 'Не указан',
            seasonLabel: 'Не указан'
        };
    }

    const eventDate = new Date(ts);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const eventDay = new Date(eventDate);
    eventDay.setHours(0, 0, 0, 0);
    const diffDays = Math.round((eventDay.getTime() - today.getTime()) / 86400000);

    let statusLabel = 'Запланировано';
    let countdownLabel = '';

    if (diffDays === 0) {
        statusLabel = 'Сегодня';
        countdownLabel = 'Проходит сегодня';
    } else if (diffDays > 0) {
        countdownLabel = `До мероприятия: ${diffDays} дн.`;
    } else {
        statusLabel = 'Завершено';
        countdownLabel = `Прошло: ${Math.abs(diffDays)} дн. назад`;
    }

    const monthLabel = eventDate.toLocaleDateString('ru-RU', { month: 'long' });
    const seasonLabel = getEventSeasonLabel(eventDate.getMonth());

    return {
        dateLabel: formatHomeEventDateLabel(event.date),
        statusLabel,
        countdownLabel,
        monthLabel,
        seasonLabel
    };
}

function showEventDetails(eventIndex) {
    const event = currentEventsList[eventIndex];
    if (!event) return;

    const modal = document.getElementById('event-modal');
    const modalContent = document.getElementById('event-modal-content');
    if (!modal || !modalContent) return;

    modalContent.textContent = '';

    const header = document.createElement('div');
    header.className = 'modal-header';

    const title = document.createElement('h2');
    title.className = 'event-modal-title';
    title.textContent = event.name || 'Мероприятие';
    header.appendChild(title);

    const closeBtn = document.createElement('span');
    closeBtn.className = 'close-modal';
    closeBtn.textContent = '×';
    closeBtn.onclick = closeEventModal;
    header.appendChild(closeBtn);

    const body = document.createElement('div');
    body.className = 'modal-body';

    const meta = getEventMeta(event);

    const date = document.createElement('p');
    date.className = 'event-modal-date';
    date.textContent = `Дата: ${meta.dateLabel}`;
    body.appendChild(date);

    const metaWrap = document.createElement('div');
    metaWrap.className = 'child-detail-info';
    const metaFields = [
        { label: 'Статус:', value: meta.statusLabel },
        { label: 'Срок:', value: meta.countdownLabel },
        { label: 'Месяц:', value: meta.monthLabel },
        { label: 'Сезон:', value: meta.seasonLabel },
        { label: 'Для кого:', value: 'Для воспитанников детского сада и родителей' }
    ];

    metaFields.forEach(field => {
        const row = document.createElement('div');
        row.className = 'info-row';

        const strong = document.createElement('strong');
        strong.textContent = field.label;
        row.appendChild(strong);

        const span = document.createElement('span');
        span.textContent = field.value;
        row.appendChild(span);

        metaWrap.appendChild(row);
    });
    body.appendChild(metaWrap);

    const description = document.createElement('p');
    description.className = 'event-modal-description';
    description.textContent = event.description || 'Описание отсутствует.';
    body.appendChild(description);

    modalContent.appendChild(header);
    modalContent.appendChild(body);
    modal.style.display = 'block';
}

function closeEventModal() {
    const modal = document.getElementById('event-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Функция для отображения мероприятий (раздел на index: XML + админка, по дате)
function displayEvents(kindergarten) {
    const eventsContainer = domCache.getEventsContainer();
    if (!eventsContainer) return;
    
    const list = getMergedEventsForSite(kindergarten);
    currentEventsList = list;
    
    if (list.length === 0) {
        eventsContainer.innerHTML = '<p>Мероприятия не найдены</p>';
        return;
    }
    
    let html = '';
    list.forEach((event, index) => {
        const shortDescription = getEventPreviewText(event.description);
        html += `
            <div class="event-card">
                <h3>${homeSectionEscapeHtml(event.name)}</h3>
                <p class="event-date"><strong>Дата:</strong> ${homeSectionEscapeHtml(event.date)}</p>
                <p class="event-description">${homeSectionEscapeHtml(shortDescription)}</p>
                <button type="button" class="event-details-btn" data-event-index="${index}">Подробнее</button>
            </div>
        `;
    });
    
    eventsContainer.innerHTML = html;

    eventsContainer.querySelectorAll('.event-details-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            const index = Number(btn.getAttribute('data-event-index'));
            if (!Number.isNaN(index)) {
                showEventDetails(index);
            }
        });
    });
}

// Функция для загрузки встроенных данных (резервный вариант)
function loadEmbeddedData() {
    return new Promise((resolve, reject) => {
        const embeddedXML = `<?xml version="1.0" encoding="UTF-8"?>
<детский_сад>
    <название>ТЕРЕМОК</название>
    <адрес>п. Борск, ул. Ленина, д. 1</адрес>
    <телефон>+7 (495) 123-45-67</телефон>
    <email>teremok@example.com</email>
    <описание>Детский сад "ТЕРЕМОК" - это место, где каждый ребенок чувствует себя как дома. Мы заботимся о развитии, здоровье и счастье наших воспитанников.</описание>
    
    <группы>
        <группа id="1">
            <название>Младшая группа "Солнышко"</название>
            <возраст>2-3 года</возраст>
            <воспитатель>Иванова Мария Петровна</воспитатель>
            <няни>
                <няня>Соколова Анна Викторовна</няня>
                <няня>Петрова Елена Сергеевна</няня>
            </няни>
            <количество_детей>20</количество_детей>
            <дети>
                <ребенок>
                    <имя>Анна</имя>
                    <фамилия>Петрова</фамилия>
                    <возраст>2.5</возраст>
                    <родитель>Петров Иван Сергеевич</родитель>
                    <телефон>+7 (495) 111-11-11</телефон>
                    <примечания>Активная, любит рисовать</примечания>
                </ребенок>
                <ребенок>
                    <имя>Максим</имя>
                    <фамилия>Сидоров</фамилия>
                    <возраст>3</возраст>
                    <родитель>Сидорова Елена Викторовна</родитель>
                    <телефон>+7 (495) 222-22-22</телефон>
                    <примечания>Любит конструктор, общительный</примечания>
                </ребенок>
                <ребенок>
                    <имя>София</имя>
                    <фамилия>Козлова</фамилия>
                    <возраст>2.8</возраст>
                    <родитель>Козлов Дмитрий Александрович</родитель>
                    <телефон>+7 (495) 333-33-33</телефон>
                    <примечания>Любит музыку и танцы</примечания>
                </ребенок>
                <ребенок>
                    <имя>Даниил</имя>
                    <фамилия>Федоров</фамилия>
                    <возраст>2.6</возраст>
                    <родитель>Федорова Ольга Сергеевна</родитель>
                    <телефон>+7 (495) 444-44-44</телефон>
                    <примечания>Любит книги и сказки</примечания>
                </ребенок>
                <ребенок>
                    <имя>Мария</имя>
                    <фамилия>Иванова</фамилия>
                    <возраст>2.9</возраст>
                    <родитель>Иванов Сергей Петрович</родитель>
                    <телефон>+7 (495) 555-55-55</телефон>
                    <примечания>Очень дружелюбная, помогает другим</примечания>
                </ребенок>
                <ребенок>
                    <имя>Кирилл</имя>
                    <фамилия>Смирнов</фамилия>
                    <возраст>2.7</возраст>
                    <родитель>Смирнова Наталья Викторовна</родитель>
                    <телефон>+7 (495) 666-66-66</телефон>
                    <примечания>Любит подвижные игры</примечания>
                </ребенок>
                <ребенок>
                    <имя>Екатерина</имя>
                    <фамилия>Кузнецова</фамилия>
                    <возраст>2.4</возраст>
                    <родитель>Кузнецов Андрей Николаевич</родитель>
                    <телефон>+7 (495) 777-77-77</телефон>
                    <примечания>Любит лепить из пластилина</примечания>
                </ребенок>
                <ребенок>
                    <имя>Артем</имя>
                    <фамилия>Попов</фамилия>
                    <возраст>3</возраст>
                    <родитель>Попова Елена Дмитриевна</родитель>
                    <телефон>+7 (495) 888-88-88</телефон>
                    <примечания>Любит пазлы и головоломки</примечания>
                </ребенок>
                <ребенок>
                    <имя>Алиса</имя>
                    <фамилия>Васильева</фамилия>
                    <возраст>2.5</возраст>
                    <родитель>Васильев Игорь Александрович</родитель>
                    <телефон>+7 (495) 999-99-99</телефон>
                    <примечания>Любит животных, мечтает стать ветеринаром</примечания>
                </ребенок>
                <ребенок>
                    <имя>Роман</имя>
                    <фамилия>Петров</фамилия>
                    <возраст>2.8</возраст>
                    <родитель>Петрова Светлана Игоревна</родитель>
                    <телефон>+7 (495) 101-10-10</телефон>
                    <примечания>Любит машинки и технику</примечания>
                </ребенок>
                <ребенок>
                    <имя>Варвара</имя>
                    <фамилия>Соколова</фамилия>
                    <возраст>2.6</возраст>
                    <родитель>Соколов Владимир Сергеевич</родитель>
                    <телефон>+7 (495) 202-20-20</телефон>
                    <примечания>Любит петь и выступать</примечания>
                </ребенок>
                <ребенок>
                    <имя>Илья</имя>
                    <фамилия>Лебедев</фамилия>
                    <возраст>2.9</возраст>
                    <родитель>Лебедева Анна Петровна</родитель>
                    <телефон>+7 (495) 303-30-30</телефон>
                    <примечания>Любит спорт и активные игры</примечания>
                </ребенок>
                <ребенок>
                    <имя>Милана</имя>
                    <фамилия>Новикова</фамилия>
                    <возраст>2.7</возраст>
                    <родитель>Новиков Дмитрий Викторович</родитель>
                    <телефон>+7 (495) 404-40-40</телефон>
                    <примечания>Любит наряжаться и играть в куклы</примечания>
                </ребенок>
                <ребенок>
                    <имя>Тимофей</имя>
                    <фамилия>Морозов</фамилия>
                    <возраст>2.5</возраст>
                    <родитель>Морозова Татьяна Андреевна</родитель>
                    <телефон>+7 (495) 505-50-50</телефон>
                    <примечания>Любит экспериментировать и исследовать</примечания>
                </ребенок>
                <ребенок>
                    <имя>Вероника</имя>
                    <фамилия>Волкова</фамилия>
                    <возраст>2.8</возраст>
                    <родитель>Волков Роман Николаевич</родитель>
                    <телефон>+7 (495) 606-60-60</телефон>
                    <примечания>Любит природу и прогулки</примечания>
                </ребенок>
                <ребенок>
                    <имя>Ярослав</имя>
                    <фамилия>Белов</фамилия>
                    <возраст>2.6</возраст>
                    <родитель>Белова Оксана Викторовна</родитель>
                    <телефон>+7 (495) 707-70-70</телефон>
                    <примечания>Любит машинки и игрушки</примечания>
                </ребенок>
                <ребенок>
                    <имя>Эмилия</имя>
                    <фамилия>Григорьева</фамилия>
                    <возраст>2.9</возраст>
                    <родитель>Григорьев Павел Сергеевич</родитель>
                    <телефон>+7 (495) 808-80-80</телефон>
                    <примечания>Любит петь и танцевать</примечания>
                </ребенок>
                <ребенок>
                    <имя>Федор</имя>
                    <фамилия>Дмитриев</фамилия>
                    <возраст>2.7</возраст>
                    <родитель>Дмитриева Анна Игоревна</родитель>
                    <телефон>+7 (495) 909-90-90</телефон>
                    <примечания>Любит конструкторы и строительство</примечания>
                </ребенок>
                <ребенок>
                    <имя>Арина</имя>
                    <фамилия>Егорова</фамилия>
                    <возраст>2.5</возраст>
                    <родитель>Егоров Максим Дмитриевич</родитель>
                    <телефон>+7 (495) 010-10-10</телефон>
                    <примечания>Любит куклы и наряды</примечания>
                </ребенок>
            </дети>
        </группа>
        
        <группа id="2">
            <название>Средняя группа "Радуга"</название>
            <возраст>3-4 года</возраст>
            <воспитатель>Смирнова Ольга Николаевна</воспитатель>
            <няни>
                <няня>Козлова Татьяна Дмитриевна</няня>
                <няня>Волкова Ирина Петровна</няня>
            </няни>
            <количество_детей>23</количество_детей>
            <дети>
                <ребенок>
                    <имя>Дмитрий</имя>
                    <фамилия>Волков</фамилия>
                    <возраст>3.5</возраст>
                    <родитель>Волкова Анна Сергеевна</родитель>
                    <телефон>+7 (495) 444-44-44</телефон>
                    <примечания>Любит строить из кубиков, лидер в группе</примечания>
                </ребенок>
                <ребенок>
                    <имя>Елизавета</имя>
                    <фамилия>Новикова</фамилия>
                    <возраст>4</возраст>
                    <родитель>Новиков Сергей Петрович</родитель>
                    <телефон>+7 (495) 555-55-55</телефон>
                    <примечания>Отлично рисует, творческая личность</примечания>
                </ребенок>
                <ребенок>
                    <имя>Артем</имя>
                    <фамилия>Морозов</фамилия>
                    <возраст>3.7</возраст>
                    <родитель>Морозова Татьяна Ивановна</родитель>
                    <телефон>+7 (495) 666-66-66</телефон>
                    <примечания>Любит математику и логические игры</примечания>
                </ребенок>
                <ребенок>
                    <имя>Арина</имя>
                    <фамилия>Федорова</фамилия>
                    <возраст>3.6</возраст>
                    <родитель>Федоров Иван Дмитриевич</родитель>
                    <телефон>+7 (495) 707-70-70</телефон>
                    <примечания>Любит читать и рассказывать истории</примечания>
                </ребенок>
                <ребенок>
                    <имя>Матвей</имя>
                    <фамилия>Иванов</фамилия>
                    <возраст>3.8</возраст>
                    <родитель>Иванова Мария Сергеевна</родитель>
                    <телефон>+7 (495) 808-80-80</телефон>
                    <примечания>Любит футбол и спортивные игры</примечания>
                </ребенок>
                <ребенок>
                    <имя>Ангелина</имя>
                    <фамилия>Смирнова</фамилия>
                    <возраст>3.5</возраст>
                    <родитель>Смирнов Петр Николаевич</родитель>
                    <телефон>+7 (495) 909-90-90</телефон>
                    <примечания>Любит танцевать, участвует в утренниках</примечания>
                </ребенок>
                <ребенок>
                    <имя>Глеб</имя>
                    <фамилия>Кузнецов</фамилия>
                    <возраст>3.9</возраст>
                    <родитель>Кузнецова Елена Андреевна</родитель>
                    <телефон>+7 (495) 110-11-11</телефон>
                    <примечания>Любит эксперименты и опыты</примечания>
                </ребенок>
                <ребенок>
                    <имя>Диана</имя>
                    <фамилия>Попова</фамилия>
                    <возраст>3.4</возраст>
                    <родитель>Попов Александр Игоревич</родитель>
                    <телефон>+7 (495) 220-22-22</телефон>
                    <примечания>Любит животных, мечтает о собаке</примечания>
                </ребенок>
                <ребенок>
                    <имя>Егор</имя>
                    <фамилия>Васильев</фамилия>
                    <возраст>3.7</возраст>
                    <родитель>Васильева Ольга Петровна</родитель>
                    <телефон>+7 (495) 330-33-33</телефон>
                    <примечания>Любит музыку, играет на детском пианино</примечания>
                </ребенок>
                <ребенок>
                    <имя>Ксения</имя>
                    <фамилия>Петрова</фамилия>
                    <возраст>3.6</возраст>
                    <родитель>Петров Виктор Сергеевич</родитель>
                    <телефон>+7 (495) 440-44-44</телефон>
                    <примечания>Любит помогать воспитателю, ответственная</примечания>
                </ребенок>
                <ребенок>
                    <имя>Лев</имя>
                    <фамилия>Соколов</фамилия>
                    <возраст>3.8</возраст>
                    <родитель>Соколова Ирина Владимировна</родитель>
                    <телефон>+7 (495) 550-55-55</телефон>
                    <примечания>Любит конструкторы и моделирование</примечания>
                </ребенок>
                <ребенок>
                    <имя>Маргарита</имя>
                    <фамилия>Лебедева</фамилия>
                    <возраст>3.5</возраст>
                    <родитель>Лебедев Андрей Николаевич</родитель>
                    <телефон>+7 (495) 660-66-66</телефон>
                    <примечания>Любит театр и ролевые игры</примечания>
                </ребенок>
                <ребенок>
                    <имя>Никита</имя>
                    <фамилия>Новиков</фамилия>
                    <возраст>3.9</возраст>
                    <родитель>Новикова Светлана Дмитриевна</родитель>
                    <телефон>+7 (495) 770-77-77</телефон>
                    <примечания>Любит природу и экскурсии</примечания>
                </ребенок>
                <ребенок>
                    <имя>Олеся</имя>
                    <фамилия>Морозова</фамилия>
                    <возраст>3.4</возраст>
                    <родитель>Морозов Роман Викторович</родитель>
                    <телефон>+7 (495) 880-88-88</телефон>
                    <примечания>Любит рукоделие и поделки</примечания>
                </ребенок>
                <ребенок>
                    <имя>Павел</имя>
                    <фамилия>Волков</фамилия>
                    <возраст>3.6</возраст>
                    <родитель>Волкова Наталья Игоревна</родитель>
                    <телефон>+7 (495) 990-99-99</телефон>
                    <примечания>Любит головоломки и загадки</примечания>
                </ребенок>
                <ребенок>
                    <имя>Стефания</имя>
                    <фамилия>Федорова</фамилия>
                    <возраст>3.7</возраст>
                    <родитель>Федоров Игорь Сергеевич</родитель>
                    <телефон>+7 (495) 111-22-22</телефон>
                    <примечания>Любит петь и музыку</примечания>
                </ребенок>
                <ребенок>
                    <имя>Тимур</имя>
                    <фамилия>Иванов</фамилия>
                    <возраст>3.8</возраст>
                    <родитель>Иванова Елена Петровна</родитель>
                    <телефон>+7 (495) 222-33-33</телефон>
                    <примечания>Любит спорт и соревнования</примечания>
                </ребенок>
                <ребенок>
                    <имя>Ульяна</имя>
                    <фамилия>Смирнова</фамилия>
                    <возраст>3.5</возраст>
                    <родитель>Смирнов Дмитрий Андреевич</родитель>
                    <телефон>+7 (495) 333-44-44</телефон>
                    <примечания>Любит рисовать и раскрашивать</примечания>
                </ребенок>
                <ребенок>
                    <имя>Ярослав</имя>
                    <фамилия>Белов</фамилия>
                    <возраст>3.6</возраст>
                    <родитель>Белова Оксана Викторовна</родитель>
                    <телефон>+7 (495) 444-55-55</телефон>
                    <примечания>Любит спорт и активные игры</примечания>
                </ребенок>
                <ребенок>
                    <имя>Эмилия</имя>
                    <фамилия>Григорьева</фамилия>
                    <возраст>3.9</возраст>
                    <родитель>Григорьев Павел Сергеевич</родитель>
                    <телефон>+7 (495) 555-66-66</телефон>
                    <примечания>Любит театр и выступления</примечания>
                </ребенок>
                <ребенок>
                    <имя>Федор</имя>
                    <фамилия>Дмитриев</фамилия>
                    <возраст>3.4</возраст>
                    <родитель>Дмитриева Анна Игоревна</родитель>
                    <телефон>+7 (495) 666-77-77</телефон>
                    <примечания>Любит головоломки и загадки</примечания>
                </ребенок>
                <ребенок>
                    <имя>Арина</имя>
                    <фамилия>Егорова</фамилия>
                    <возраст>3.7</возраст>
                    <родитель>Егоров Максим Дмитриевич</родитель>
                    <телефон>+7 (495) 777-88-88</телефон>
                    <примечания>Любит музыку и пение</примечания>
                </ребенок>
            </дети>
        </группа>
        
        <группа id="3">
            <название>Старшая группа "Звездочки"</название>
            <возраст>4-5 лет</возраст>
            <воспитатель>Петрова Елена Владимировна</воспитатель>
            <няни>
                <няня>Новикова Светлана Игоревна</няня>
                <няня>Морозова Наталья Александровна</няня>
            </няни>
            <количество_детей>25</количество_детей>
            <дети>
                <ребенок>
                    <имя>Александр</имя>
                    <фамилия>Лебедев</фамилия>
                    <возраст>4.5</возраст>
                    <родитель>Лебедев Андрей Викторович</родитель>
                    <телефон>+7 (495) 777-77-77</телефон>
                    <примечания>Отлично читает, любит энциклопедии</примечания>
                </ребенок>
                <ребенок>
                    <имя>Виктория</имя>
                    <фамилия>Соколова</фамилия>
                    <возраст>5</возраст>
                    <родитель>Соколова Наталья Дмитриевна</родитель>
                    <телефон>+7 (495) 888-88-88</телефон>
                    <примечания>Любит выступать, участвует в конкурсах</примечания>
                </ребенок>
                <ребенок>
                    <имя>Михаил</имя>
                    <фамилия>Павлов</фамилия>
                    <возраст>4.8</возраст>
                    <родитель>Павлов Игорь Сергеевич</родитель>
                    <телефон>+7 (495) 999-99-99</телефон>
                    <примечания>Любит шахматы и логические игры</примечания>
                </ребенок>
                <ребенок>
                    <имя>Анна</имя>
                    <фамилия>Кузнецова</фамилия>
                    <возраст>4.6</возраст>
                    <родитель>Кузнецов Сергей Викторович</родитель>
                    <телефон>+7 (495) 444-55-55</телефон>
                    <примечания>Любит писать и сочинять рассказы</примечания>
                </ребенок>
                <ребенок>
                    <имя>Богдан</имя>
                    <фамилия>Попов</фамилия>
                    <возраст>4.7</возраст>
                    <родитель>Попова Мария Игоревна</родитель>
                    <телефон>+7 (495) 555-66-66</телефон>
                    <примечания>Любит футбол, мечтает стать футболистом</примечания>
                </ребенок>
                <ребенок>
                    <имя>Валерия</имя>
                    <фамилия>Васильева</фамилия>
                    <возраст>4.5</возраст>
                    <родитель>Васильев Петр Николаевич</родитель>
                    <телефон>+7 (495) 666-77-77</телефон>
                    <примечания>Любит танцевать, занимается хореографией</примечания>
                </ребенок>
                <ребенок>
                    <имя>Григорий</имя>
                    <фамилия>Петров</фамилия>
                    <возраст>4.9</возраст>
                    <родитель>Петрова Ольга Дмитриевна</родитель>
                    <телефон>+7 (495) 777-88-88</телефон>
                    <примечания>Любит науку и эксперименты</примечания>
                </ребенок>
                <ребенок>
                    <имя>Дарья</имя>
                    <фамилия>Соколова</фамилия>
                    <возраст>4.4</возраст>
                    <родитель>Соколов Андрей Сергеевич</родитель>
                    <телефон>+7 (495) 888-99-99</телефон>
                    <примечания>Любит животных, мечтает стать ветеринаром</примечания>
                </ребенок>
                <ребенок>
                    <имя>Евгений</имя>
                    <фамилия>Лебедев</фамилия>
                    <возраст>4.6</возраст>
                    <родитель>Лебедева Ирина Викторовна</родитель>
                    <телефон>+7 (495) 999-00-00</телефон>
                    <примечания>Любит конструкторы и моделирование</примечания>
                </ребенок>
                <ребенок>
                    <имя>Жанна</имя>
                    <фамилия>Новикова</фамилия>
                    <возраст>4.7</возраст>
                    <родитель>Новиков Роман Петрович</родитель>
                    <телефон>+7 (495) 100-11-11</телефон>
                    <примечания>Любит рисовать и создавать картины</примечания>
                </ребенок>
                <ребенок>
                    <имя>Захар</имя>
                    <фамилия>Морозов</фамилия>
                    <возраст>4.8</возраст>
                    <родитель>Морозова Татьяна Андреевна</родитель>
                    <телефон>+7 (495) 200-22-22</телефон>
                    <примечания>Любит музыку, играет на детском синтезаторе</примечания>
                </ребенок>
                <ребенок>
                    <имя>Ирина</имя>
                    <фамилия>Волкова</фамилия>
                    <возраст>4.5</возраст>
                    <родитель>Волков Дмитрий Игоревич</родитель>
                    <телефон>+7 (495) 300-33-33</телефон>
                    <примечания>Любит театр и актерское мастерство</примечания>
                </ребенок>
                <ребенок>
                    <имя>Константин</имя>
                    <фамилия>Федоров</фамилия>
                    <возраст>4.9</возраст>
                    <родитель>Федорова Светлана Николаевна</родитель>
                    <телефон>+7 (495) 400-44-44</телефон>
                    <примечания>Любит спорт и соревнования</примечания>
                </ребенок>
                <ребенок>
                    <имя>Лада</имя>
                    <фамилия>Иванова</фамилия>
                    <возраст>4.6</возраст>
                    <родитель>Иванов Виктор Сергеевич</родитель>
                    <телефон>+7 (495) 500-55-55</телефон>
                    <примечания>Любит рукоделие и поделки</примечания>
                </ребенок>
                <ребенок>
                    <имя>Максим</имя>
                    <фамилия>Смирнов</фамилия>
                    <возраст>4.7</возраст>
                    <родитель>Смирнова Елена Дмитриевна</родитель>
                    <телефон>+7 (495) 600-66-66</телефон>
                    <примечания>Любит головоломки и загадки</примечания>
                </ребенок>
                <ребенок>
                    <имя>Надежда</имя>
                    <фамилия>Кузнецова</фамилия>
                    <возраст>4.8</возраст>
                    <родитель>Кузнецов Игорь Петрович</родитель>
                    <телефон>+7 (495) 700-77-77</телефон>
                    <примечания>Любит читать и изучать новое</примечания>
                </ребенок>
                <ребенок>
                    <имя>Олег</имя>
                    <фамилия>Попов</фамилия>
                    <возраст>4.5</возраст>
                    <родитель>Попова Наталья Андреевна</родитель>
                    <телефон>+7 (495) 800-88-88</телефон>
                    <примечания>Любит природу и экскурсии</примечания>
                </ребенок>
                <ребенок>
                    <имя>Полина</имя>
                    <фамилия>Васильева</фамилия>
                    <возраст>4.9</возраст>
                    <родитель>Васильев Александр Игоревич</родитель>
                    <телефон>+7 (495) 900-99-99</телефон>
                    <примечания>Любит петь и музыку</примечания>
                </ребенок>
                <ребенок>
                    <имя>Руслан</имя>
                    <фамилия>Петров</фамилия>
                    <возраст>4.6</возраст>
                    <родитель>Петрова Ольга Викторовна</родитель>
                    <телефон>+7 (495) 111-00-00</телефон>
                    <примечания>Любит технику и компьютеры</примечания>
                </ребенок>
                <ребенок>
                    <имя>Светлана</имя>
                    <фамилия>Соколова</фамилия>
                    <возраст>4.7</возраст>
                    <родитель>Соколов Роман Дмитриевич</родитель>
                    <телефон>+7 (495) 222-11-11</телефон>
                    <примечания>Любит помогать другим, ответственная</примечания>
                </ребенок>
                <ребенок>
                    <имя>Ярослав</имя>
                    <фамилия>Белов</фамилия>
                    <возраст>4.8</возраст>
                    <родитель>Белова Оксана Викторовна</родитель>
                    <телефон>+7 (495) 333-22-22</телефон>
                    <примечания>Любит спорт и соревнования</примечания>
                </ребенок>
                <ребенок>
                    <имя>Эмилия</имя>
                    <фамилия>Григорьева</фамилия>
                    <возраст>4.5</возраст>
                    <родитель>Григорьев Павел Сергеевич</родитель>
                    <телефон>+7 (495) 444-33-33</телефон>
                    <примечания>Любит рисовать и создавать картины</примечания>
                </ребенок>
                <ребенок>
                    <имя>Федор</имя>
                    <фамилия>Дмитриев</фамилия>
                    <возраст>4.9</возраст>
                    <родитель>Дмитриева Анна Игоревна</родитель>
                    <телефон>+7 (495) 555-44-44</телефон>
                    <примечания>Любит науку и эксперименты</примечания>
                </ребенок>
                <ребенок>
                    <имя>Арина</имя>
                    <фамилия>Егорова</фамилия>
                    <возраст>4.6</возраст>
                    <родитель>Егоров Максим Дмитриевич</родитель>
                    <телефон>+7 (495) 666-55-55</телефон>
                    <примечания>Любит музыку и пение</примечания>
                </ребенок>
            </дети>
        </группа>
        
        <группа id="4">
            <название>Подготовительная группа "Умники"</название>
            <возраст>5-6 лет</возраст>
            <воспитатель>Кузнецова Татьяна Анатольевна</воспитатель>
            <няни>
                <няня>Лебедева Ольга Викторовна</няня>
                <няня>Соколова Мария Николаевна</няня>
            </няни>
            <количество_детей>27</количество_детей>
            <дети>
                <ребенок>
                    <имя>Полина</имя>
                    <фамилия>Орлова</фамилия>
                    <возраст>5.5</возраст>
                    <родитель>Орлов Владимир Николаевич</родитель>
                    <телефон>+7 (495) 101-10-10</телефон>
                    <примечания>Отлично читает и пишет, готовится к школе</примечания>
                </ребенок>
                <ребенок>
                    <имя>Иван</имя>
                    <фамилия>Макаров</фамилия>
                    <возраст>6</возраст>
                    <родитель>Макарова Светлана Игоревна</родитель>
                    <телефон>+7 (495) 202-20-20</телефон>
                    <примечания>Любит математику, решает сложные задачи</примечания>
                </ребенок>
                <ребенок>
                    <имя>Алиса</имя>
                    <фамилия>Захарова</фамилия>
                    <возраст>5.8</возраст>
                    <родитель>Захаров Роман Александрович</родитель>
                    <телефон>+7 (495) 303-30-30</телефон>
                    <примечания>Любит английский язык, изучает его дополнительно</примечания>
                </ребенок>
                <ребенок>
                    <имя>Арсений</имя>
                    <фамилия>Лебедев</фамилия>
                    <возраст>5.6</возраст>
                    <родитель>Лебедева Мария Сергеевна</родитель>
                    <телефон>+7 (495) 404-40-40</телефон>
                    <примечания>Любит шахматы, участвует в турнирах</примечания>
                </ребенок>
                <ребенок>
                    <имя>Богдана</имя>
                    <фамилия>Попова</фамилия>
                    <возраст>5.7</возраст>
                    <родитель>Попов Игорь Викторович</родитель>
                    <телефон>+7 (495) 505-50-50</телефон>
                    <примечания>Любит рисовать, готовится в художественную школу</примечания>
                </ребенок>
                <ребенок>
                    <имя>Владислав</имя>
                    <фамилия>Васильев</фамилия>
                    <возраст>5.9</возраст>
                    <родитель>Васильева Елена Петровна</родитель>
                    <телефон>+7 (495) 606-60-60</телефон>
                    <примечания>Любит спорт, занимается плаванием</примечания>
                </ребенок>
                <ребенок>
                    <имя>Галина</имя>
                    <фамилия>Петрова</фамилия>
                    <возраст>5.5</возраст>
                    <родитель>Петров Дмитрий Николаевич</родитель>
                    <телефон>+7 (495) 707-70-70</телефон>
                    <примечания>Любит музыку, учится играть на фортепиано</примечания>
                </ребенок>
                <ребенок>
                    <имя>Данил</имя>
                    <фамилия>Соколов</фамилия>
                    <возраст>5.8</возраст>
                    <родитель>Соколова Ольга Андреевна</родитель>
                    <телефон>+7 (495) 808-80-80</телефон>
                    <примечания>Любит науку и эксперименты</примечания>
                </ребенок>
                <ребенок>
                    <имя>Евгения</имя>
                    <фамилия>Лебедева</фамилия>
                    <возраст>5.6</возраст>
                    <родитель>Лебедев Сергей Игоревич</родитель>
                    <телефон>+7 (495) 909-90-90</телефон>
                    <примечания>Любит читать, знает много стихов наизусть</примечания>
                </ребенок>
                <ребенок>
                    <имя>Жан</имя>
                    <фамилия>Новиков</фамилия>
                    <возраст>5.7</возраст>
                    <родитель>Новикова Ирина Викторовна</родитель>
                    <телефон>+7 (495) 101-01-01</телефон>
                    <примечания>Любит конструкторы, строит сложные модели</примечания>
                </ребенок>
                <ребенок>
                    <имя>Злата</имя>
                    <фамилия>Морозова</фамилия>
                    <возраст>5.5</возраст>
                    <родитель>Морозов Роман Дмитриевич</родитель>
                    <телефон>+7 (495) 202-02-02</телефон>
                    <примечания>Любит танцевать, занимается балетом</примечания>
                </ребенок>
                <ребенок>
                    <имя>Игорь</имя>
                    <фамилия>Волков</фамилия>
                    <возраст>5.9</возраст>
                    <родитель>Волкова Татьяна Сергеевна</родитель>
                    <телефон>+7 (495) 303-03-03</телефон>
                    <примечания>Любит футбол, мечтает стать профессиональным игроком</примечания>
                </ребенок>
                <ребенок>
                    <имя>Карина</имя>
                    <фамилия>Федорова</фамилия>
                    <возраст>5.6</возраст>
                    <родитель>Федоров Андрей Петрович</родитель>
                    <телефон>+7 (495) 404-04-04</телефон>
                    <примечания>Любит животных, мечтает стать ветеринаром</примечания>
                </ребенок>
                <ребенок>
                    <имя>Лука</имя>
                    <фамилия>Иванов</фамилия>
                    <возраст>5.8</возраст>
                    <родитель>Иванова Светлана Николаевна</родитель>
                    <телефон>+7 (495) 505-05-05</телефон>
                    <примечания>Любит головоломки и логические задачи</примечания>
                </ребенок>
                <ребенок>
                    <имя>Мария</имя>
                    <фамилия>Смирнова</фамилия>
                    <возраст>5.7</возраст>
                    <родитель>Смирнов Виктор Игоревич</родитель>
                    <телефон>+7 (495) 606-06-06</телефон>
                    <примечания>Любит театр, участвует в спектаклях</примечания>
                </ребенок>
                <ребенок>
                    <имя>Николай</имя>
                    <фамилия>Кузнецов</фамилия>
                    <возраст>5.9</возраст>
                    <родитель>Кузнецова Ольга Дмитриевна</родитель>
                    <телефон>+7 (495) 707-07-07</телефон>
                    <примечания>Любит технику и компьютеры</примечания>
                </ребенок>
                <ребенок>
                    <имя>Оксана</имя>
                    <фамилия>Попова</фамилия>
                    <возраст>5.6</возраст>
                    <родитель>Попов Александр Андреевич</родитель>
                    <телефон>+7 (495) 808-08-08</телефон>
                    <примечания>Любит рукоделие и творчество</примечания>
                </ребенок>
                <ребенок>
                    <имя>Прохор</имя>
                    <фамилия>Васильев</фамилия>
                    <возраст>5.8</возраст>
                    <родитель>Васильева Ирина Викторовна</родитель>
                    <телефон>+7 (495) 909-09-09</телефон>
                    <примечания>Любит природу и экскурсии</примечания>
                </ребенок>
                <ребенок>
                    <имя>Раиса</имя>
                    <фамилия>Петрова</фамилия>
                    <возраст>5.7</возраст>
                    <родитель>Петров Роман Сергеевич</родитель>
                    <телефон>+7 (495) 110-10-10</телефон>
                    <примечания>Любит петь, участвует в хоре</примечания>
                </ребенок>
                <ребенок>
                    <имя>Семен</имя>
                    <фамилия>Соколов</фамилия>
                    <возраст>5.9</возраст>
                    <родитель>Соколова Наталья Петровна</родитель>
                    <телефон>+7 (495) 220-20-20</телефон>
                    <примечания>Любит спорт, занимается гимнастикой</примечания>
                </ребенок>
                <ребенок>
                    <имя>Таисия</имя>
                    <фамилия>Лебедева</фамилия>
                    <возраст>5.6</возраст>
                    <родитель>Лебедев Игорь Дмитриевич</родитель>
                    <телефон>+7 (495) 330-30-30</телефон>
                    <примечания>Любит читать и изучать новое</примечания>
                </ребенок>
                <ребенок>
                    <имя>Устин</имя>
                    <фамилия>Новиков</фамилия>
                    <возраст>5.8</возраст>
                    <родитель>Новикова Елена Андреевна</родитель>
                    <телефон>+7 (495) 440-40-40</телефон>
                    <примечания>Любит моделирование и конструирование</примечания>
                </ребенок>
                <ребенок>
                    <имя>Ярослав</имя>
                    <фамилия>Белов</фамилия>
                    <возраст>5.7</возраст>
                    <родитель>Белова Оксана Викторовна</родитель>
                    <телефон>+7 (495) 550-50-50</телефон>
                    <примечания>Любит шахматы и логические игры</примечания>
                </ребенок>
                <ребенок>
                    <имя>Эмилия</имя>
                    <фамилия>Григорьева</фамилия>
                    <возраст>5.9</возраст>
                    <родитель>Григорьев Павел Сергеевич</родитель>
                    <телефон>+7 (495) 660-60-60</телефон>
                    <примечания>Любит танцевать, занимается балетом</примечания>
                </ребенок>
                <ребенок>
                    <имя>Федор</имя>
                    <фамилия>Дмитриев</фамилия>
                    <возраст>5.6</возраст>
                    <родитель>Дмитриева Анна Игоревна</родитель>
                    <телефон>+7 (495) 770-70-70</телефон>
                    <примечания>Любит читать и изучать новое</примечания>
                </ребенок>
                <ребенок>
                    <имя>Арина</имя>
                    <фамилия>Егорова</фамилия>
                    <возраст>5.8</возраст>
                    <родитель>Егоров Максим Дмитриевич</родитель>
                    <телефон>+7 (495) 880-80-80</телефон>
                    <примечания>Любит музыку, учится играть на скрипке</примечания>
                </ребенок>
            </дети>
        </группа>
    </группы>
    
    <расписание>
        <!-- Младшая группа "Солнышко" -->
        <день день_недели="Понедельник" группа="1">
            <время>08:00-09:00</время>
            <активность>Прием детей, утренняя гимнастика</активность>
        </день>
        <день день_недели="Понедельник" группа="1">
            <время>09:00-09:30</время>
            <активность>Завтрак</активность>
        </день>
        <день день_недели="Понедельник" группа="1">
            <время>09:30-10:00</время>
            <активность>Развивающие игры</активность>
        </день>
        <день день_недели="Понедельник" группа="1">
            <время>10:00-11:00</время>
            <активность>Прогулка (младшая группа "Солнышко")</активность>
        </день>
        <день день_недели="Понедельник" группа="1">
            <время>12:00-13:00</время>
            <активность>Обед и подготовка ко сну</активность>
        </день>
        <день день_недели="Понедельник" группа="1">
            <время>13:00-15:00</время>
            <активность>Тихий час</активность>
        </день>
        <день день_недели="Понедельник" группа="1">
            <время>15:30-16:00</время>
            <активность>Полдник</активность>
        </день>
        <день день_недели="Понедельник" группа="1">
            <время>16:00-17:00</время>
            <активность>Спокойные игры в группе</активность>
        </день>
        <день день_недели="Понедельник" группа="1">
            <время>17:00-18:00</время>
            <активность>Подготовка к уходу домой</активность>
        </день>

        <!-- Средняя группа "Радуга" -->
        <день день_недели="Понедельник" группа="2">
            <время>08:00-09:00</время>
            <активность>Прием детей, утренняя гимнастика</активность>
        </день>
        <день день_недели="Понедельник" группа="2">
            <время>09:00-09:30</время>
            <активность>Завтрак</активность>
        </день>
        <день день_недели="Понедельник" группа="2">
            <время>09:30-10:30</время>
            <активность>Занятия (развитие речи, математика)</активность>
        </день>
        <день день_недели="Понедельник" группа="2">
            <время>10:30-11:30</время>
            <активность>Прогулка (средняя группа "Радуга")</активность>
        </день>
        <день день_недели="Понедельник" группа="2">
            <время>12:00-13:00</время>
            <активность>Обед</активность>
        </день>
        <день день_недели="Понедельник" группа="2">
            <время>13:00-15:00</время>
            <активность>Тихий час</активность>
        </день>
        <день день_недели="Понедельник" группа="2">
            <время>15:30-16:00</время>
            <активность>Полдник</активность>
        </день>
        <день день_недели="Понедельник" группа="2">
            <время>16:00-17:00</время>
            <активность>Кружки и творческие занятия</активность>
        </день>
        <день день_недели="Понедельник" группа="2">
            <время>17:00-18:00</время>
            <активность>Игры, уход домой</активность>
        </день>

        <!-- Старшая группа "Звездочки" -->
        <день день_недели="Понедельник" группа="3">
            <время>08:00-09:00</время>
            <активность>Прием детей, утренняя гимнастика</активность>
        </день>
        <день день_недели="Понедельник" группа="3">
            <время>09:00-09:30</время>
            <активность>Завтрак</активность>
        </день>
        <день день_недели="Понедельник" группа="3">
            <время>09:30-10:30</время>
            <активность>Подготовительные занятия к школе</активность>
        </день>
        <день день_недели="Понедельник" группа="3">
            <время>11:00-12:00</время>
            <активность>Прогулка (старшая группа "Звездочки")</активность>
        </день>
        <день день_недели="Понедельник" группа="3">
            <время>12:00-13:00</время>
            <активность>Обед</активность>
        </день>
        <день день_недели="Понедельник" группа="3">
            <время>13:00-15:00</время>
            <активность>Тихий час / чтение сказок</активность>
        </день>
        <день день_недели="Понедельник" группа="3">
            <время>15:30-16:00</время>
            <активность>Полдник</активность>
        </день>
        <день день_недели="Понедельник" группа="3">
            <время>16:00-17:00</время>
            <активность>Кружки и подготовка домашних заданий</активность>
        </день>
        <день день_недели="Понедельник" группа="3">
            <время>17:00-18:00</время>
            <активность>Игры, уход домой</активность>
        </день>

        <!-- Подготовительная группа "Умники" -->
        <день день_недели="Понедельник" группа="4">
            <время>08:00-09:00</время>
            <активность>Прием детей, зарядка</активность>
        </день>
        <день день_недели="Понедельник" группа="4">
            <время>09:00-09:30</время>
            <активность>Завтрак</активность>
        </день>
        <день день_недели="Понедельник" группа="4">
            <время>09:30-10:30</время>
            <активность>Интеллектуальные занятия, подготовка к школе</активность>
        </день>
        <день день_недели="Понедельник" группа="4">
            <время>11:30-12:30</время>
            <активность>Прогулка (подготовительная группа "Умники")</активность>
        </день>
        <день день_недели="Понедельник" группа="4">
            <время>12:30-13:30</время>
            <активность>Обед</активность>
        </день>
        <день день_недели="Понедельник" группа="4">
            <время>13:30-15:00</время>
            <активность>Отдых, чтение, спокойные игры</активность>
        </день>
        <день день_недели="Понедельник" группа="4">
            <время>15:30-16:00</время>
            <активность>Полдник</активность>
        </день>
        <день день_недели="Понедельник" группа="4">
            <время>16:00-17:00</время>
            <активность>Кружки, подготовка к школе</активность>
        </день>
        <день день_недели="Понедельник" группа="4">
            <время>17:00-18:00</время>
            <активность>Прогулка, уход домой</активность>
        </день>
    </расписание>
    
    <мероприятия>
        <мероприятие>
            <название>День открытых дверей</название>
            <дата>2026-04-12</дата>
            <описание>Знакомство с группами и педагогами, экскурсия по саду</описание>
        </мероприятие>
        <мероприятие>
            <название>Весенний творческий фестиваль</название>
            <дата>2026-05-15</дата>
            <описание>Выступления детей и выставка работ</описание>
        </мероприятие>
        <мероприятие>
            <название>Спортивный праздник</название>
            <дата>2026-06-01</дата>
            <описание>Семейные эстафеты и игры на улице</описание>
        </мероприятие>
        <мероприятие>
            <название>День защиты детей</название>
            <дата>2026-06-09</дата>
            <описание>Игровая программа, мастер-классы и подарки для воспитанников</описание>
        </мероприятие>
        <мероприятие>
            <название>Выпускной утренник</название>
            <дата>2026-06-24</дата>
            <описание>Праздник для старших групп с вручением памятных подарков</описание>
        </мероприятие>
        <мероприятие>
            <название>Летняя творческая смена</название>
            <дата>2026-07-01</дата>
            <описание>Неделя тематических занятий: природа, театр и эксперименты</описание>
        </мероприятие>
        <мероприятие>
            <название>День семьи</название>
            <дата>2026-07-08</дата>
            <описание>Совместные игры родителей и детей на площадке сада</описание>
        </мероприятие>
        <мероприятие>
            <название>Экологический квест «Лесная тропа»</название>
            <дата>2026-09-18</дата>
            <описание>Прогулка с заданиями: узнаём растения и бережём природу</описание>
        </мероприятие>
        <мероприятие>
            <название>Осенняя выставка поделок</название>
            <дата>2026-10-28</дата>
            <описание>Работы детей и родителей — поделки из природных материалов</описание>
        </мероприятие>
        <мероприятие>
            <название>Новогодний театрализованный праздник</название>
            <дата>2026-12-26</дата>
            <описание>Сказка, хороводы и встреча с волшебными героями по группам</описание>
        </мероприятие>
        <мероприятие>
            <название>Летняя творческая лаборатория «Краски и бумага»</название>
            <дата>2026-07-18</дата>
            <описание>Мастер-классы по аппликации и рисунку на открытом воздухе</описание>
        </мероприятие>
        <мероприятие>
            <название>Фестиваль песен у костра</название>
            <дата>2026-08-05</дата>
            <описание>Вечер скороспелок, народные хороводы и угощение на площадке</описание>
        </мероприятие>
        <мероприятие>
            <название>День знаний в детском саду</название>
            <дата>2026-09-01</дата>
            <описание>Знакомимся с новыми друзьями, обсуждаем планы на учебный год</описание>
        </мероприятие>
        <мероприятие>
            <название>День дошкольного работника</название>
            <дата>2026-09-27</дата>
            <описание>Тёплые поздравления для педагогов и концерт от детей</описание>
        </мероприятие>
        <мероприятие>
            <название>Неделя безопасности: финальный квест</название>
            <дата>2026-11-12</дата>
            <описание>Игровые станции: дорога, огонь, «Осторожно — незнакомец!»</описание>
        </мероприятие>
        <мероприятие>
            <название>Театральная неделя: сказки на сцене</название>
            <дата>2026-11-19</дата>
            <описание>Каждая группа показывает короткую сценку по любимым книгам</описание>
        </мероприятие>
        <мероприятие>
            <название>Рождественские посиделки</название>
            <дата>2027-01-11</дата>
            <описание>Чаепитие, колядки и мастерская открыток для семьи</описание>
        </мероприятие>
        <мероприятие>
            <название>Масленица: блины и хороводы</название>
            <дата>2027-02-22</дата>
            <описание>Народные игры, чучело Масленицы и угощение от поваров</описание>
        </мероприятие>
        <мероприятие>
            <название>Весенний концерт к 8 Марта</название>
            <дата>2027-03-05</дата>
            <описание>Песни, стихи и подарки для мам, бабушек и педагогов</описание>
        </мероприятие>
        <мероприятие>
            <название>День книги: читальный марафон</название>
            <дата>2027-03-23</дата>
            <описание>Совместное чтение, обмен любимыми сказками и мини-библиотека в группах</описание>
        </мероприятие>
        <мероприятие>
            <название>Пасхальная мастерская</название>
            <дата>2027-04-12</дата>
            <описание>Украшение яиц и обсуждение весенних семейных традиций</описание>
        </мероприятие>
        <мероприятие>
            <название>Весенняя спартакиада «Быстрые ножки»</название>
            <дата>2027-04-25</дата>
            <описание>Эстафеты, прыжки и командные игры на свежем воздухе</описание>
        </мероприятие>
        <мероприятие>
            <название>Благотворительная ярмарка поделок</название>
            <дата>2027-05-20</дата>
            <описание>Работы детей и родителей — сбор средств на благоустройство участка</описание>
        </мероприятие>
        <мероприятие>
            <название>Выпускной бал 2027</название>
            <дата>2027-06-18</дата>
            <описание>Торжественная линейка, вальс и прощание со старшей группой</описание>
        </мероприятие>
    </мероприятия>
</детский_сад>`;
    
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(embeddedXML, 'text/xml');
        
        // Проверка на ошибку парсинга
        if (xmlDoc.documentElement.nodeName === 'parsererror') {
            showError('Ошибка парсинга встроенных XML данных.');
            reject(new Error('XML parsing error'));
            return;
        }
        
        // Кэшируем результат
        xmlDataCache = xmlDoc;
        xmlLoadPromise = null;
        resolve(xmlDoc);
    });
}

// Загружаем данные при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM загружен, начинаем загрузку данных...');
    console.log('Протокол:', window.location.protocol);
    
    // Используем requestIdleCallback для отображения данных в свободное время
    const loadAndDisplay = function() {
        console.log('Начинаем загрузку XML данных...');
        
        // Если протокол file://, сразу используем встроенные данные
        if (window.location.protocol === 'file:') {
            console.log('Протокол file:// обнаружен, используем встроенные данные');
            loadEmbeddedData().then(embeddedDoc => {
                console.log('Встроенные данные загружены, отображаем...');
                displayData(embeddedDoc);
            }).catch(err => {
                console.error('Ошибка загрузки встроенных данных:', err);
                showError('Не удалось загрузить данные. Пожалуйста, обновите страницу.');
            });
            return;
        }
        
        // Для http/https протоколов пытаемся загрузить data.xml
        // Добавляем таймаут для загрузки (максимум 3 секунды)
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Таймаут загрузки данных')), 3000);
        });
        
        Promise.race([
            loadXMLData(),
            timeoutPromise
        ]).then(xmlDoc => {
            console.log('XML данные загружены успешно:', xmlDoc);
            if (xmlDoc) {
                try {
                    displayData(xmlDoc);
                    console.log('Данные отображены успешно');
                } catch (e) {
                    console.error('Ошибка при отображении данных:', e);
                    // Пытаемся использовать встроенные данные
                    loadEmbeddedData().then(embeddedDoc => {
                        displayData(embeddedDoc);
                    }).catch(err => {
                        console.error('Ошибка загрузки встроенных данных:', err);
                        showError('Не удалось загрузить данные. Пожалуйста, обновите страницу.');
                    });
                }
            } else {
                console.error('XML документ пуст');
                // Пытаемся использовать встроенные данные
                loadEmbeddedData().then(embeddedDoc => {
                    displayData(embeddedDoc);
                }).catch(err => {
                    console.error('Ошибка загрузки встроенных данных:', err);
                    showError('Не удалось загрузить данные. Пожалуйста, обновите страницу.');
                });
            }
        }).catch(error => {
            console.log('Ошибка загрузки XML (это нормально для file:// протокола):', error.message);
            // Пытаемся использовать встроенные данные как fallback
            console.log('Пытаемся загрузить встроенные данные...');
            loadEmbeddedData().then(embeddedDoc => {
                console.log('Встроенные данные загружены, отображаем...');
                displayData(embeddedDoc);
            }).catch(err => {
                console.error('Ошибка загрузки встроенных данных:', err);
                showError('Не удалось загрузить данные. Пожалуйста, обновите страницу.');
            });
        });
    };
    
    // Если доступен requestIdleCallback, используем его для отображения
    if ('requestIdleCallback' in window) {
        requestIdleCallback(loadAndDisplay, { timeout: 1000 });
    } else {
        // Иначе загружаем сразу
        setTimeout(loadAndDisplay, 100);
    }
});

