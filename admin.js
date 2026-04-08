// Проверка таймаута сессии (30 минут неактивности)
function checkSessionTimeout() {
    const lastActivity = sessionStorage.getItem('adminLastActivity');
    if (!lastActivity) return false;
    
    const inactiveTime = Date.now() - parseInt(lastActivity);
    const timeout = 30 * 60 * 1000; // 30 минут в миллисекундах
    
    if (inactiveTime > timeout) {
        // Сессия истекла
        logout();
        alert('Сессия истекла из-за неактивности. Пожалуйста, войдите снова.');
        return true;
    }
    return false;
}

// Обновление времени последней активности
function updateLastActivity() {
    sessionStorage.setItem('adminLastActivity', Date.now().toString());
}

// Проверка целостности сессии
function validateSession() {
    const loggedIn = sessionStorage.getItem('adminLoggedIn');
    const username = sessionStorage.getItem('adminUsername');
    const loginTime = sessionStorage.getItem('adminLoginTime');
    
    // Проверяем наличие всех необходимых данных сессии
    if (loggedIn !== 'true' || !username || !loginTime) {
        return false;
    }
    
    // Проверяем таймаут
    if (checkSessionTimeout()) {
        return false;
    }
    
    return true;
}

// Проверка авторизации
document.addEventListener('DOMContentLoaded', function() {
    // Инициализируем модуль безопасности
    if (typeof window !== 'undefined' && window.SecurityModule) {
        window.SecurityModule.initSecurity();
    }
    
    // Проверяем целостность сессии
    if (!validateSession()) {
        window.location.href = 'admin.html';
        return;
    }
    
    // Генерируем CSRF токен для сессии
    if (typeof window !== 'undefined' && window.SecurityModule) {
        window.SecurityModule.getCSRFToken();
    }
    
    const username = sessionStorage.getItem('adminUsername');
    const usernameElement = document.getElementById('admin-username');
    if (usernameElement) {
        // Безопасное отображение имени пользователя
        if (window.SecurityModule) {
            usernameElement.textContent = `👤 ${window.SecurityModule.sanitizeHTML(username || 'admin')}`;
        } else {
            usernameElement.textContent = `👤 ${username || 'admin'}`;
        }
    }
    
    // Обновляем активность при загрузке
    updateLastActivity();
    
    // Обновляем активность при любом действии пользователя
    ['click', 'keypress', 'scroll', 'mousemove'].forEach(event => {
        document.addEventListener(event, updateLastActivity, { passive: true });
    });
    
    // Периодическая проверка сессии каждые 5 минут
    setInterval(function() {
        if (!validateSession()) {
            window.location.href = 'admin.html';
        }
    }, 5 * 60 * 1000); // 5 минут
    
    // Инициализируем формы
    initForms();
    
    // Загружаем заявки
    loadApplications();
    
    // Обновляем статистику
    updateStatistics();
    
    // Обновляем статистику каждую минуту
    setInterval(updateStatistics, 60000);
    
    // Убеждаемся, что функции доступны глобально
    if (typeof window !== 'undefined') {
        window.showAdminSection = showAdminSection;
        window.logout = logout;
        window.loadApplications = loadApplications;
        window.loadKindergartenInfo = loadKindergartenInfo;
        window.loadGroupsAdmin = loadGroupsAdmin;
        window.loadScheduleAdmin = loadScheduleAdmin;
        window.loadEventsAdmin = loadEventsAdmin;
        window.loadAwardsAdmin = loadAwardsAdmin;
    }
    
    console.log('Админ-панель инициализирована, функции доступны');
});

// Выход из системы
function logout() {
    // Логируем выход
    const username = sessionStorage.getItem('adminUsername');
    const loginLog = JSON.parse(localStorage.getItem('adminLoginLog') || '[]');
    loginLog.push({
        username: username || 'unknown',
        time: new Date().toISOString(),
        action: 'logout',
        ip: 'local'
    });
    if (loginLog.length > 50) loginLog.shift();
    localStorage.setItem('adminLoginLog', JSON.stringify(loginLog));
    
    // Очищаем сессию
    sessionStorage.removeItem('adminLoggedIn');
    sessionStorage.removeItem('adminUsername');
    sessionStorage.removeItem('adminLoginTime');
    sessionStorage.removeItem('adminLastActivity');
    
    window.location.href = 'admin.html';
}

// Переключение секций
function showAdminSection(sectionId, eventElement) {
    console.log('showAdminSection вызвана:', sectionId);
    
    try {
    // Скрыть все секции
    document.querySelectorAll('.admin-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Показать выбранную секцию
        const targetSection = document.getElementById(`admin-${sectionId}`);
        if (!targetSection) {
            console.error('Секция не найдена:', `admin-${sectionId}`);
            return;
        }
        targetSection.classList.add('active');
        console.log('Секция активирована:', `admin-${sectionId}`);
    
    // Обновить активную кнопку
    document.querySelectorAll('.admin-nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
        
        // Найти и активировать кнопку
        if (eventElement) {
            eventElement.classList.add('active');
        } else {
            // Найти кнопку по sectionId через onclick атрибут
            const buttons = document.querySelectorAll('.admin-nav-btn');
            buttons.forEach(btn => {
                const onclickAttr = btn.getAttribute('onclick');
                if (onclickAttr && onclickAttr.includes(`'${sectionId}'`)) {
                    btn.classList.add('active');
                }
            });
        }
    
    // Загрузить данные для секции
        console.log('Загрузка данных для секции:', sectionId);
    if (sectionId === 'applications') {
            if (typeof loadApplications === 'function') {
        loadApplications();
            } else {
                console.error('Функция loadApplications не найдена');
            }
    } else if (sectionId === 'kindergarten') {
            if (typeof loadKindergartenInfo === 'function') {
        loadKindergartenInfo();
            } else {
                console.error('Функция loadKindergartenInfo не найдена');
            }
    } else if (sectionId === 'groups') {
            if (typeof loadGroupsAdmin === 'function') {
        loadGroupsAdmin();
            } else {
                console.error('Функция loadGroupsAdmin не найдена');
            }
    } else if (sectionId === 'schedule') {
            if (typeof loadScheduleAdmin === 'function') {
        loadScheduleAdmin();
            } else {
                console.error('Функция loadScheduleAdmin не найдена');
            }
    } else if (sectionId === 'events') {
            if (typeof loadEventsAdmin === 'function') {
        loadEventsAdmin();
            } else {
                console.error('Функция loadEventsAdmin не найдена');
            }
    } else if (sectionId === 'awards') {
            if (typeof loadAwardsAdmin === 'function') {
        loadAwardsAdmin();
            } else {
                console.error('Функция loadAwardsAdmin не найдена');
            }
        } else if (sectionId === 'settings') {
            // Настройки не требуют загрузки данных
            console.log('Секция настроек активирована');
        }
    } catch (e) {
        console.error('Ошибка в showAdminSection:', e);
        alert('Ошибка при переключении секции: ' + e.message);
    }
}

// Загрузка заявок
function loadApplications() {
    let applications = [];
    
    // Безопасное чтение из localStorage
    if (typeof window !== 'undefined' && window.SecurityModule) {
        applications = window.SecurityModule.safeGetLocalStorage('applications') || [];
    } else {
        try {
            applications = JSON.parse(localStorage.getItem('applications') || '[]');
        } catch (e) {
            applications = [];
        }
    }
    
    const container = document.getElementById('applications-list');
    if (!container) return;
    
    if (applications.length === 0) {
        container.textContent = '';
        const emptyMsg = document.createElement('p');
        emptyMsg.className = 'empty-message';
        emptyMsg.textContent = 'Заявок пока нет';
        container.appendChild(emptyMsg);
        return;
    }
    
    // Безопасное создание таблицы
    const sanitize = window.SecurityModule ? window.SecurityModule.sanitizeHTML : (str) => str;
    const createSafeElement = window.SecurityModule ? window.SecurityModule.createSafeElement : null;
    
    const tableDiv = document.createElement('div');
    tableDiv.className = 'applications-table';
    
    const table = document.createElement('table');
    const thead = document.createElement('thead');
    const tbody = document.createElement('tbody');
    
    // Создаем заголовок таблицы
    const headerRow = document.createElement('tr');
    ['№', 'Дата', 'Ребенок', 'Возраст', 'Родитель', 'Телефон', 'Группа', 'Файл', 'Действия'].forEach(text => {
        const th = document.createElement('th');
        th.textContent = text;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    
    // Создаем строки с данными
    applications.forEach((app, index) => {
        const row = document.createElement('tr');
        
        // №
        const td1 = document.createElement('td');
        td1.textContent = `#${index + 1}`;
        row.appendChild(td1);
        
        // Дата
        const td2 = document.createElement('td');
        td2.textContent = sanitize(app.date || '');
        row.appendChild(td2);
        
        // Ребенок
        const td3 = document.createElement('td');
        td3.textContent = `${sanitize(app.childName || '')} ${sanitize(app.childSurname || '')}`;
        row.appendChild(td3);
        
        // Возраст
        const td4 = document.createElement('td');
        td4.textContent = `${app.childAge || 0} лет`;
        row.appendChild(td4);
        
        // Родитель
        const td5 = document.createElement('td');
        td5.textContent = sanitize(app.parentName || '');
        row.appendChild(td5);
        
        // Телефон
        const td6 = document.createElement('td');
        td6.textContent = sanitize(app.parentPhone || '');
        row.appendChild(td6);
        
        // Группа
        const td7 = document.createElement('td');
        td7.textContent = sanitize(getGroupName(app.preferredGroup));
        row.appendChild(td7);

        // Файл
        const tdFile = document.createElement('td');
        tdFile.textContent = app.attachment && app.attachment.name ? '📎 Есть' : '—';
        row.appendChild(tdFile);
        
        // Действия
        const td8 = document.createElement('td');
        const viewBtn = document.createElement('button');
        viewBtn.className = 'btn-small btn-info';
        viewBtn.textContent = '👁️';
        viewBtn.onclick = () => viewApplication(index);
        viewBtn.title = 'Просмотр';
        
        const acceptBtn = document.createElement('button');
        acceptBtn.className = 'btn-small btn-success';
        acceptBtn.textContent = '✓';
        acceptBtn.onclick = () => acceptApplication(index);
        acceptBtn.title = 'Принять заявку';
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn-small btn-danger';
        deleteBtn.textContent = '🗑️';
        deleteBtn.onclick = () => deleteApplication(index);
        deleteBtn.title = 'Удалить';
        
        td8.appendChild(viewBtn);
        td8.appendChild(acceptBtn);
        td8.appendChild(deleteBtn);
        row.appendChild(td8);
        
        tbody.appendChild(row);
    });
    
    table.appendChild(thead);
    table.appendChild(tbody);
    tableDiv.appendChild(table);
    
    container.textContent = '';
    container.appendChild(tableDiv);
}

// Просмотр заявки
function viewApplication(index) {
    // Проверка безопасности
    if (typeof window !== 'undefined' && window.SecurityModule && !window.SecurityModule.requireSecurityCheck('viewApplication')) {
        alert('Ошибка безопасности. Пожалуйста, войдите снова.');
        logout();
        return;
    }
    
    let applications = [];
    if (window.SecurityModule) {
        applications = window.SecurityModule.safeGetLocalStorage('applications') || [];
    } else {
        try {
            applications = JSON.parse(localStorage.getItem('applications') || '[]');
        } catch (e) {
            applications = [];
        }
    }
    
    const app = applications[index];
    if (!app) return;
    
    const modalBody = document.getElementById('modal-body');
    const modalTitle = document.getElementById('modal-title');
    if (!modalBody || !modalTitle) return;
    
    // Безопасное создание содержимого модального окна
    const sanitize = window.SecurityModule ? window.SecurityModule.sanitizeHTML : (str) => str;
    const createSafeElement = window.SecurityModule ? window.SecurityModule.createSafeElement : null;
    
    modalBody.textContent = ''; // Очищаем
    
    const detailsDiv = document.createElement('div');
    detailsDiv.className = 'application-details';
    
    // Создаем элементы безопасным способом
    const fields = [
        { label: 'Номер заявки:', value: `#${index + 1}` },
        { label: 'Дата подачи:', value: sanitize(app.date || '') },
        { label: 'Имя ребенка:', value: sanitize(app.childName || '') },
        { label: 'Фамилия ребенка:', value: sanitize(app.childSurname || '') },
        { label: 'Возраст:', value: `${app.childAge || 0} лет` },
        { label: 'ФИО родителя:', value: sanitize(app.parentName || '') },
        { label: 'Телефон:', value: sanitize(app.parentPhone || ''), isPhone: true },
        { label: 'Email:', value: sanitize(app.parentEmail || 'Не указан') },
        { label: 'Предпочтительная группа:', value: sanitize(getGroupName(app.preferredGroup)) },
        { label: 'Дополнительная информация:', value: sanitize(app.comments || 'Нет'), isMultiline: true }
    ];
    
    fields.forEach(field => {
        const row = document.createElement('div');
        row.className = 'detail-row';
        
        const strong = document.createElement('strong');
        strong.textContent = field.label + ' ';
        row.appendChild(strong);
        
        if (field.isPhone && field.value) {
            const link = document.createElement('a');
            link.href = `tel:${field.value}`;
            link.textContent = field.value;
            row.appendChild(link);
        } else if (field.isMultiline) {
            const br = document.createElement('br');
            row.appendChild(br);
            const text = document.createTextNode(field.value);
            row.appendChild(text);
        } else {
            const text = document.createTextNode(field.value);
            row.appendChild(text);
        }
        
        detailsDiv.appendChild(row);
    });

    // Прикрепленный файл (если есть)
    if (app.attachment && app.attachment.name && app.attachment.dataUrl) {
        const fileRow = document.createElement('div');
        fileRow.className = 'detail-row';
        const strong = document.createElement('strong');
        strong.textContent = 'Прикрепленный файл: ';
        fileRow.appendChild(strong);

        const link = document.createElement('a');
        link.href = app.attachment.dataUrl;
        link.download = app.attachment.name;
        link.textContent = app.attachment.name;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        fileRow.appendChild(link);

        detailsDiv.appendChild(fileRow);
    }
    
    modalBody.appendChild(detailsDiv);
    modalTitle.textContent = 'Детали заявки';
    
    const modalOverlay = document.getElementById('modal-overlay');
    if (modalOverlay) {
        modalOverlay.style.display = 'flex';
    }
}

// Принятие заявки и добавление ребенка в группу
function acceptApplication(index) {
    // Проверка безопасности
    if (typeof window !== 'undefined' && window.SecurityModule && !window.SecurityModule.requireSecurityCheck('acceptApplication')) {
        alert('Ошибка безопасности. Пожалуйста, войдите снова.');
        logout();
        return;
    }
    
    let applications = [];
    if (window.SecurityModule) {
        applications = window.SecurityModule.safeGetLocalStorage('applications') || [];
    } else {
        try {
            applications = JSON.parse(localStorage.getItem('applications') || '[]');
        } catch (e) {
            applications = [];
        }
    }
    
    if (index < 0 || index >= applications.length) {
        alert('Заявка не найдена');
        return;
    }
    
    const application = applications[index];
    
    // Проверяем, что указана группа
    if (!application.preferredGroup) {
        alert('В заявке не указана группа. Пожалуйста, укажите группу перед принятием.');
        return;
    }
    
    // Подтверждение
    if (!confirm(`Принять заявку и добавить ${application.childName} ${application.childSurname} в группу?`)) {
        return;
    }
    
    // Получаем данные о группах
    let groups = [];
    if (window.SecurityModule) {
        groups = window.SecurityModule.safeGetLocalStorage('adminGroups') || [];
    } else {
        try {
            groups = JSON.parse(localStorage.getItem('adminGroups') || '[]');
        } catch (e) {
            groups = [];
        }
    }
    
    // Находим группу
    const groupId = application.preferredGroup;
    let targetGroup = groups.find(g => g.id === groupId);
    
    if (!targetGroup) {
        // Если группа не найдена в adminGroups, пытаемся загрузить из XML
        alert('Группа не найдена. Пожалуйста, убедитесь, что группа существует.');
        return;
    }
    
    // Получаем существующих детей из localStorage (принятые ранее)
    let acceptedChildren = [];
    if (window.SecurityModule) {
        acceptedChildren = window.SecurityModule.safeGetLocalStorage('acceptedChildren') || [];
    } else {
        try {
            acceptedChildren = JSON.parse(localStorage.getItem('acceptedChildren') || '[]');
        } catch (e) {
            acceptedChildren = [];
        }
    }
    
    // Создаем запись о ребенке
    const childData = {
        id: `child-${Date.now()}-${index}`, // Уникальный ID
        groupId: groupId,
        firstName: application.childName,
        lastName: application.childSurname,
        age: application.childAge,
        parent: application.parentName,
        phone: application.parentPhone,
        email: application.parentEmail || '',
        notes: application.comments || '',
        acceptedDate: new Date().toISOString(),
        applicationIndex: index
    };
    
    // Добавляем ребенка в список принятых
    acceptedChildren.push(childData);
    
    // Сохраняем обновленный список
    if (window.SecurityModule) {
        window.SecurityModule.safeSetLocalStorage('acceptedChildren', acceptedChildren);
    } else {
        localStorage.setItem('acceptedChildren', JSON.stringify(acceptedChildren));
    }
    
    // Обновляем количество детей в группе
    const currentCount = parseInt(targetGroup.count || '0');
    targetGroup.count = (currentCount + 1).toString();
    
    // Обновляем группы в localStorage
    const groupIndex = groups.findIndex(g => g.id === groupId);
    if (groupIndex !== -1) {
        groups[groupIndex] = targetGroup;
        if (window.SecurityModule) {
            window.SecurityModule.safeSetLocalStorage('adminGroups', groups);
        } else {
            localStorage.setItem('adminGroups', JSON.stringify(groups));
        }
    }
    
    // Удаляем заявку
    applications.splice(index, 1);
    if (window.SecurityModule) {
        window.SecurityModule.safeSetLocalStorage('applications', applications);
    } else {
        localStorage.setItem('applications', JSON.stringify(applications));
    }
    
    // Обновляем отображение
    loadApplications();
    loadGroupsAdmin();
    updateStatistics();
    
    alert(`Заявка принята! ${application.childName} ${application.childSurname} добавлен(а) в группу "${targetGroup.name}".`);
}

// Удаление заявки
function deleteApplication(index) {
    // Проверка безопасности
    if (typeof window !== 'undefined' && window.SecurityModule && !window.SecurityModule.requireSecurityCheck('deleteApplication')) {
        alert('Ошибка безопасности. Пожалуйста, войдите снова.');
        logout();
        return;
    }
    
    if (!confirm('Вы уверены, что хотите удалить эту заявку?')) return;
    
    let applications = [];
    if (window.SecurityModule) {
        applications = window.SecurityModule.safeGetLocalStorage('applications') || [];
    } else {
        try {
            applications = JSON.parse(localStorage.getItem('applications') || '[]');
        } catch (e) {
            applications = [];
        }
    }
    
    if (index >= 0 && index < applications.length) {
    applications.splice(index, 1);
        
        if (window.SecurityModule) {
            window.SecurityModule.safeSetLocalStorage('applications', applications);
        } else {
    localStorage.setItem('applications', JSON.stringify(applications));
        }
    }
    
    loadApplications();
    updateStatistics();
}

// Экспорт заявок в CSV
function exportApplications() {
    const applications = JSON.parse(localStorage.getItem('applications') || '[]');
    
    if (applications.length === 0) {
        alert('Нет заявок для экспорта');
        return;
    }
    
    let csv = '№,Дата,Имя ребенка,Фамилия ребенка,Возраст,Родитель,Телефон,Email,Группа,Комментарии\n';
    
    applications.forEach((app, index) => {
        csv += `${index + 1},"${app.date}","${app.childName}","${app.childSurname}",${app.childAge},"${app.parentName}","${app.parentPhone}","${app.parentEmail || ''}","${getGroupName(app.preferredGroup)}","${(app.comments || '').replace(/"/g, '""')}"\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `applications_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
}

// Очистка всех заявок
function clearApplications() {
    if (!confirm('Вы уверены, что хотите удалить ВСЕ заявки? Это действие нельзя отменить!')) return;
    
    localStorage.setItem('applications', '[]');
    loadApplications();
    updateStatistics();
}

// Загрузка информации о детском саде
function loadKindergartenInfo() {
    // Загружаем XML
    loadXMLData().then(xmlDoc => {
        const kindergarten = xmlDoc.querySelector('детский_сад');
        
        if (kindergarten) {
            document.getElementById('kg-name').value = kindergarten.querySelector('название')?.textContent || '';
            document.getElementById('kg-address').value = kindergarten.querySelector('адрес')?.textContent || '';
            document.getElementById('kg-phone').value = kindergarten.querySelector('телефон')?.textContent || '';
            document.getElementById('kg-email').value = kindergarten.querySelector('email')?.textContent || '';
            document.getElementById('kg-description').value = kindergarten.querySelector('описание')?.textContent || '';
        }
    });
}

// Сохранение информации о детском саде
function initForms() {
    // Форма информации о саде
    document.getElementById('kindergarten-form').addEventListener('submit', function(e) {
        e.preventDefault();
        saveKindergartenInfo();
    });
    
    // Форма изменения пароля
    document.getElementById('password-form').addEventListener('submit', function(e) {
        e.preventDefault();
        changePassword();
    });
}

function saveKindergartenInfo() {
    // Проверка безопасности
    if (typeof window !== 'undefined' && window.SecurityModule && !window.SecurityModule.requireSecurityCheck('saveKindergartenInfo')) {
        alert('Ошибка безопасности. Пожалуйста, войдите снова.');
        logout();
        return;
    }
    
    // Валидация и санитизация данных
    const sanitize = window.SecurityModule ? window.SecurityModule.sanitizeInput : (str) => str;
    const validateText = window.SecurityModule ? window.SecurityModule.validateText : () => true;
    const validateEmail = window.SecurityModule ? window.SecurityModule.validateEmail : () => true;
    
    const name = sanitize(document.getElementById('kg-name').value);
    const address = sanitize(document.getElementById('kg-address').value);
    const phone = sanitize(document.getElementById('kg-phone').value);
    const email = sanitize(document.getElementById('kg-email').value);
    const description = sanitize(document.getElementById('kg-description').value);
    
    // Валидация
    if (!validateText(name, 100) || !validateText(address, 200) || !validateText(phone, 20)) {
        alert('Ошибка: недопустимые символы в данных');
        return;
    }
    
    if (email && !validateEmail(email)) {
        alert('Ошибка: неверный формат email');
        return;
    }
    
    if (!validateText(description, 500)) {
        alert('Ошибка: описание содержит недопустимые символы');
        return;
    }
    
    // В реальном приложении здесь был бы запрос к серверу
    // Для демонстрации сохраняем в localStorage
    const data = {
        name: name,
        address: address,
        phone: phone,
        email: email,
        description: description
    };
    
    if (window.SecurityModule) {
        window.SecurityModule.safeSetLocalStorage('kindergartenInfo', data);
    } else {
    localStorage.setItem('kindergartenInfo', JSON.stringify(data));
    }
    
    alert('Информация сохранена! (В реальном приложении это обновит XML файл)');
}

// Загрузка групп для администрирования
function loadGroupsAdmin() {
    const container = document.getElementById('groups-admin-list');
    
    if (!container) {
        console.error('Контейнер groups-admin-list не найден');
        return;
    }
    
    // Показываем индикатор загрузки
    safeSetEmptyMessage(container, 'Загрузка групп...');
    
    // Функция для обработки XML документа
    function processXMLData(xmlDoc) {
        if (!xmlDoc) {
            safeSetEmptyMessage(container, 'Ошибка: XML документ не загружен');
                return;
            }
            
        const kindergarten = xmlDoc.querySelector('детский_сад');
        if (!kindergarten) {
            safeSetEmptyMessage(container, 'Ошибка: структура XML неверна');
            return;
        }
        
        const xmlGroups = kindergarten.querySelectorAll('группа');
        
        if (xmlGroups.length === 0) {
            safeSetEmptyMessage(container, 'Групп не найдено');
            return;
        }
        
        console.log('Найдено групп:', xmlGroups.length);
        
        // Преобразуем XML группы в объекты с детьми
        const groups = Array.from(xmlGroups).map((group, index) => {
            const groupId = group.getAttribute('id') || String(index + 1);
                const nannies = Array.from(group.querySelectorAll('няни няня')).map(n => n.textContent);
            
            // Получаем детей
            const children = Array.from(group.querySelectorAll('ребенок')).map(child => ({
                firstName: child.querySelector('имя')?.textContent || '',
                lastName: child.querySelector('фамилия')?.textContent || '',
                age: child.querySelector('возраст')?.textContent || '',
                parent: child.querySelector('родитель')?.textContent || '',
                phone: child.querySelector('телефон')?.textContent || '',
                notes: child.querySelector('примечания')?.textContent || ''
            }));
            
                return {
                id: groupId,
                    name: group.querySelector('название')?.textContent || '',
                    age: group.querySelector('возраст')?.textContent || '',
                    teacher: group.querySelector('воспитатель')?.textContent || '',
                    nannies: nannies,
                count: group.querySelector('количество_детей')?.textContent || '0',
                children: children
                };
            });
            
        console.log('Загружено групп:', groups.length);
        groups.forEach(g => console.log(`Группа ${g.id}: ${g.name}, детей: ${g.children.length}`));
        
        // Загружаем существующие группы из localStorage (добавленные через админ-панель)
        let existingGroups = [];
        if (window.SecurityModule) {
            existingGroups = window.SecurityModule.safeGetLocalStorage('adminGroups') || [];
        } else {
            try {
                existingGroups = JSON.parse(localStorage.getItem('adminGroups') || '[]');
            } catch (e) {
                existingGroups = [];
            }
        }
        
        console.log('Существующие группы из localStorage:', existingGroups.length);
        
        // Создаем Map для объединения групп (приоритет у существующих групп из localStorage)
        const groupsMap = new Map();
        
        // Сначала добавляем группы из XML
        groups.forEach(g => {
            groupsMap.set(g.id, g);
        });
        
        // Затем добавляем/перезаписываем группы из localStorage (которые были добавлены через админ-панель)
        existingGroups.forEach(g => {
            // Добавляем детей из XML, если группа существует в XML
            const xmlGroup = groupsMap.get(g.id);
            if (xmlGroup) {
                // Объединяем данные: берем данные из localStorage, но сохраняем детей из XML
                groupsMap.set(g.id, {
                    ...g,
                    children: xmlGroup.children
                });
            } else {
                // Новая группа, добавленная через админ-панель (без детей из XML)
                groupsMap.set(g.id, {
                    ...g,
                    children: []
                });
            }
        });
        
        // Преобразуем Map обратно в массив
        const allGroups = Array.from(groupsMap.values());
        
        // Сохраняем все группы в localStorage (без детей для экономии места)
        const groupsForStorage = allGroups.map(g => ({
            id: g.id,
            name: g.name,
            age: g.age,
            teacher: g.teacher,
            nannies: g.nannies,
            count: g.count
        }));
        
        if (window.SecurityModule) {
            window.SecurityModule.safeSetLocalStorage('adminGroups', groupsForStorage);
        } else {
            localStorage.setItem('adminGroups', JSON.stringify(groupsForStorage));
        }
        
        console.log('Всего групп после объединения:', allGroups.length);
            
        renderGroups(allGroups);
    }
    
    // Пытаемся загрузить XML несколькими способами
    let xmlLoaded = false;
    
    // Способ 1: Используем кэш, если он есть
    if (typeof window !== 'undefined' && window.xmlDataCache) {
        console.log('Используем кэшированные XML данные');
        processXMLData(window.xmlDataCache);
        return;
    }
    
    // Способ 2: Используем функцию loadXMLData из loadXML.js (она должна быть загружена)
    const loadFunction = (typeof window !== 'undefined' && typeof window.loadXMLData === 'function') 
        ? window.loadXMLData 
        : (typeof loadXMLData === 'function' ? loadXMLData : null);
    
    if (loadFunction) {
        console.log('Используем loadXMLData');
        const timeout = setTimeout(() => {
            if (!xmlLoaded) {
                console.log('Таймаут загрузки XML, пробуем встроенные данные');
                tryLoadEmbeddedData();
            }
        }, 2000);
        
        loadFunction().then(xmlDoc => {
            clearTimeout(timeout);
            xmlLoaded = true;
            if (xmlDoc && typeof window !== 'undefined') {
                window.xmlDataCache = xmlDoc;
            }
            processXMLData(xmlDoc);
        }).catch(error => {
            clearTimeout(timeout);
            console.error('Ошибка loadXMLData:', error);
            tryLoadEmbeddedData();
        });
        return;
    }
    
    // Способ 3: Используем встроенные данные
    tryLoadEmbeddedData();
    
    function tryLoadXMLDirectly() {
        console.log('Прямая загрузка XML через XMLHttpRequest');
        const xhr = new XMLHttpRequest();
        xhr.open('GET', 'data.xml', true);
        xhr.timeout = 5000;
        
        xhr.onload = function() {
            if (xhr.status === 200 || xhr.status === 0) {
                let xmlDoc = xhr.responseXML;
                if (!xmlDoc || xmlDoc.documentElement.nodeName === 'parsererror') {
                    const parser = new DOMParser();
                    xmlDoc = parser.parseFromString(xhr.responseText, 'text/xml');
                }
                if (xmlDoc && xmlDoc.documentElement.nodeName !== 'parsererror') {
                    if (typeof window !== 'undefined') {
                        window.xmlDataCache = xmlDoc;
                    }
                    processXMLData(xmlDoc);
    } else {
                    container.innerHTML = '<p class="empty-message">Ошибка парсинга XML</p>';
                }
            } else {
                container.innerHTML = '<p class="empty-message">Ошибка загрузки XML (статус: ' + xhr.status + ')</p>';
            }
        };
        
        xhr.onerror = function() {
            console.log('Ошибка сети, используем встроенные данные');
            tryLoadEmbeddedData();
        };
        
        xhr.ontimeout = function() {
            console.log('Таймаут, используем встроенные данные');
            tryLoadEmbeddedData();
        };
        
        try {
            xhr.send();
        } catch (e) {
            console.log('Ошибка отправки запроса, используем встроенные данные:', e);
            tryLoadEmbeddedData();
        }
    }
    
    function tryLoadEmbeddedData() {
        console.log('Попытка загрузить встроенные XML данные');
        
        // Пытаемся использовать функцию loadEmbeddedData из loadXML.js
        const embeddedFunction = (typeof window !== 'undefined' && typeof window.loadEmbeddedData === 'function') 
            ? window.loadEmbeddedData 
            : (typeof loadEmbeddedData === 'function' ? loadEmbeddedData : null);
        
        if (embeddedFunction) {
            embeddedFunction().then(xmlDoc => {
                if (xmlDoc && typeof window !== 'undefined') {
                    window.xmlDataCache = xmlDoc;
                }
                processXMLData(xmlDoc);
            }).catch(error => {
                console.error('Ошибка загрузки встроенных данных:', error);
                // Пробуем загрузить напрямую из data.xml через синхронный запрос
                loadXMLSync();
            });
            return;
        }
        
        // Если функция недоступна, пробуем синхронную загрузку
        loadXMLSync();
    }
    
    function loadXMLSync() {
        console.log('Синхронная загрузка XML');
        const xhr = new XMLHttpRequest();
        xhr.open('GET', 'data.xml', false); // синхронный запрос
        try {
            xhr.send(null);
            if (xhr.status === 200 || xhr.status === 0) {
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(xhr.responseText, 'text/xml');
                if (xmlDoc.documentElement.nodeName !== 'parsererror') {
                    if (typeof window !== 'undefined') {
                        window.xmlDataCache = xmlDoc;
                    }
                    processXMLData(xmlDoc);
                } else {
                    container.innerHTML = '<p class="empty-message">Ошибка парсинга XML. Проверьте файл data.xml</p>';
                }
            } else {
                container.innerHTML = '<p class="empty-message">Ошибка загрузки XML (статус: ' + xhr.status + '). Проверьте файл data.xml</p>';
            }
        } catch (e) {
            console.error('Ошибка синхронной загрузки:', e);
            container.innerHTML = '<p class="empty-message">Ошибка: не удалось загрузить данные о группах. Убедитесь, что файл data.xml существует в той же папке.</p>';
        }
    }
}

function renderGroups(groups) {
    const container = document.getElementById('groups-admin-list');
    
    if (!container) {
        console.error('Контейнер groups-admin-list не найден при рендеринге');
        return;
    }
    
    if (!groups || groups.length === 0) {
        safeSetEmptyMessage(container, 'Групп не найдено');
        return;
    }
    
    console.log('Рендеринг групп:', groups.length);
    
    let html = '';
    groups.forEach((group) => {
        const groupId = group.id;
        const nanniesText = group.nannies && group.nannies.length > 0 ? group.nannies.join(', ') : 'Не указаны';
        const children = group.children || [];
        
        html += `
            <div class="group-card" data-group-id="${groupId}">
                <div class="group-header" onclick="toggleGroupAdmin('${groupId}')">
                    <h3>${group.name}</h3>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span class="toggle-icon" id="toggle-admin-${groupId}">▼</span>
                        <button onclick="event.stopPropagation(); editGroup('${groupId}')" class="btn-small btn-primary">✏️</button>
                        <button onclick="event.stopPropagation(); deleteGroup('${groupId}')" class="btn-small btn-danger">🗑️</button>
                    </div>
                </div>
                <div class="group-info">
                    <p><strong>Возраст:</strong> ${group.age}</p>
                    <p><strong>Воспитатель:</strong> ${group.teacher}</p>
                    <p><strong>Няни:</strong> ${nanniesText}</p>
                    <p><strong>Количество детей:</strong> ${group.count}</p>
                </div>
                <div class="children-list" id="children-admin-${groupId}" style="display: none;">
                    <h4>Дети в группе:</h4>
                    <div class="children-grid">
        `;
        
        // Добавляем карточки детей из XML
        children.forEach((child, childIndex) => {
            const childId = `${groupId}-xml-${childIndex}`;
            const sanitize = window.SecurityModule ? window.SecurityModule.sanitizeHTML : (str) => str;
            const initials = (child.firstName.charAt(0) || '') + (child.lastName.charAt(0) || '');
            
            html += `
                <div class="child-card">
                    <div class="child-avatar">${initials}</div>
                    <div class="child-name">${sanitize(child.firstName)} ${sanitize(child.lastName)}</div>
                    <div class="child-age">${sanitize(child.age)} лет</div>
                </div>
            `;
        });
        
        // Получаем принятых детей из localStorage для этой группы
        let acceptedChildren = [];
        if (window.SecurityModule) {
            acceptedChildren = window.SecurityModule.safeGetLocalStorage('acceptedChildren') || [];
        } else {
            try {
                acceptedChildren = JSON.parse(localStorage.getItem('acceptedChildren') || '[]');
            } catch (e) {
                acceptedChildren = [];
            }
        }
        
        // Фильтруем детей для этой группы и запоминаем индекс в общем списке
        const groupAcceptedChildren = acceptedChildren
            .map((child, idx) => ({ ...child, _idx: idx }))
            .filter(child => child.groupId === groupId);
        
        // Добавляем принятых детей
        groupAcceptedChildren.forEach((child) => {
            const sanitize = window.SecurityModule ? window.SecurityModule.sanitizeHTML : (str) => str;
            const initials = (child.firstName.charAt(0) || '') + (child.lastName.charAt(0) || '');
            
            html += `
                <div class="child-card" style="border-left: 3px solid #4CAF50;">
                    <div class="child-avatar">${initials}</div>
                    <div class="child-name">${sanitize(child.firstName)} ${sanitize(child.lastName)}</div>
                    <div class="child-age">${sanitize(child.age)} лет</div>
                    <div style="color: #4CAF50; font-size: 0.9em; margin-top: 5px;">✓ Принят(а)</div>
                    <button onclick="event.stopPropagation(); removeAcceptedChild('${child.id}', '${groupId}', ${child._idx})" class="btn-small btn-danger" style="margin-top: 8px;">Удалить</button>
                </div>
            `;
        });
        
        // Используем уже объявленные acceptedChildren и groupAcceptedChildren (объявлены выше)
        // Обновляем количество детей с учетом принятых
        const totalChildren = children.length + groupAcceptedChildren.length;
        html = html.replace(
            `<p><strong>Количество детей:</strong> ${group.count}</p>`,
            `<p><strong>Количество детей:</strong> ${totalChildren} (в XML: ${children.length}, принято: ${groupAcceptedChildren.length})</p>`
        );
        
        html += `
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Функция для переключения видимости списка детей в админ-панели
function toggleGroupAdmin(groupId) {
    const childrenList = document.getElementById(`children-admin-${groupId}`);
    const toggleIcon = document.getElementById(`toggle-admin-${groupId}`);
    
    if (childrenList) {
        if (childrenList.style.display === 'none') {
            childrenList.style.display = 'block';
            toggleIcon.textContent = '▲';
        } else {
            childrenList.style.display = 'none';
            toggleIcon.textContent = '▼';
        }
    }
}

// Удаление принятого ребенка из группы (acceptedChildren)
function removeAcceptedChild(childId, groupId, globalIndex) {
    let acceptedChildren = [];
    if (window.SecurityModule) {
        acceptedChildren = window.SecurityModule.safeGetLocalStorage('acceptedChildren') || [];
    } else {
        try {
            acceptedChildren = JSON.parse(localStorage.getItem('acceptedChildren') || '[]');
        } catch (e) {
            acceptedChildren = [];
        }
    }
    
    if (!acceptedChildren || acceptedChildren.length === 0) {
        alert('Список принятых детей пуст.');
        return;
    }
    
    // Находим по id или по индексу (если id не задан)
    let index = -1;
    if (childId) {
        index = acceptedChildren.findIndex(c => c && c.id === childId);
    }
    if (index === -1 && typeof globalIndex === 'number') {
        index = globalIndex;
    }
    if (index < 0 || index >= acceptedChildren.length) {
        alert('Ребёнок не найден в списке принятых.');
        return;
    }
    
    const child = acceptedChildren[index];
    const targetGroupId = groupId || (child && child.groupId);
    
    if (!confirm(`Удалить ${child.firstName || ''} ${child.lastName || ''} из группы?`)) {
        return;
    }
    
    // Удаляем ребёнка из acceptedChildren
    acceptedChildren.splice(index, 1);
    if (window.SecurityModule) {
        window.SecurityModule.safeSetLocalStorage('acceptedChildren', acceptedChildren);
    } else {
        localStorage.setItem('acceptedChildren', JSON.stringify(acceptedChildren));
    }
    
    // Обновляем счётчик детей в группе, если возможно
    if (targetGroupId) {
        let groups = [];
        if (window.SecurityModule) {
            groups = window.SecurityModule.safeGetLocalStorage('adminGroups') || [];
        } else {
            try {
                groups = JSON.parse(localStorage.getItem('adminGroups') || '[]');
            } catch (e) {
                groups = [];
            }
        }
        
        const idx = groups.findIndex(g => g && g.id === targetGroupId);
        if (idx !== -1) {
            const currentCount = parseInt(groups[idx].count || '0');
            groups[idx].count = Math.max(0, currentCount - 1).toString();
            if (window.SecurityModule) {
                window.SecurityModule.safeSetLocalStorage('adminGroups', groups);
            } else {
                localStorage.setItem('adminGroups', JSON.stringify(groups));
            }
        }
    }
    
    // Перерисовываем группы и статистику
    loadGroupsAdmin();
    updateStatistics();
}

// Загрузка расписания для администрирования
function loadScheduleAdmin() {
    // Сначала проверяем сохраненные данные в localStorage
    let scheduleItems = JSON.parse(localStorage.getItem('adminSchedule') || '[]');
    const container = document.getElementById('schedule-admin-list');
    
    // Загружаем группы для выпадающего списка
    loadGroupsForSelect();
    
    // Если нет сохраненных данных, загружаем из XML
    if (scheduleItems.length === 0) {
        loadXMLData().then(xmlDoc => {
            const xmlScheduleItems = xmlDoc.querySelectorAll('расписание день');
            
            // Преобразуем XML расписание в объекты
            scheduleItems = Array.from(xmlScheduleItems).map(item => ({
                group: item.getAttribute('группа') || item.getAttribute('group') || 'all',
                day: item.getAttribute('день_недели') || '',
                time: item.querySelector('время')?.textContent || '',
                activity: item.querySelector('активность')?.textContent || ''
            }));
            
            // Сохраняем в localStorage для дальнейшего использования
            if (scheduleItems.length > 0) {
                localStorage.setItem('adminSchedule', JSON.stringify(scheduleItems));
            }
            
            setupScheduleControls(scheduleItems);
        }).catch(error => {
            console.error('Ошибка загрузки расписания:', error);
            setupScheduleControls(scheduleItems);
        });
    } else {
        setupScheduleControls(scheduleItems);
    }
}

function loadGroupsForSelect() {
    const groupSelect = document.getElementById('schedule-group-select-admin');
    if (!groupSelect) return;
    
    // Загружаем группы из localStorage или XML
    let groups = JSON.parse(localStorage.getItem('adminGroups') || '[]');
    
    if (groups.length === 0) {
        loadXMLData().then(xmlDoc => {
            const xmlGroups = xmlDoc.querySelectorAll('группа');
            groups = Array.from(xmlGroups).map(group => ({
                id: group.getAttribute('id') || '',
                name: group.querySelector('название')?.textContent || ''
            }));
            populateGroupSelect(groups);
        });
    } else {
        populateGroupSelect(groups);
    }
}

function populateGroupSelect(groups) {
    const groupSelect = document.getElementById('schedule-group-select-admin');
    if (!groupSelect) return;
    
    groupSelect.innerHTML = '<option value="all">Все группы</option>';
    groups.forEach(group => {
        if (group.id) {
            const option = document.createElement('option');
            option.value = group.id;
            option.textContent = group.name || `Группа ${group.id}`;
            groupSelect.appendChild(option);
        }
    });
}

function setupScheduleControls(scheduleItems) {
    const groupSelect = document.getElementById('schedule-group-select-admin');
    
    // Удаляем старый обработчик и добавляем новый
    const newSelect = groupSelect.cloneNode(true);
    groupSelect.parentNode.replaceChild(newSelect, groupSelect);
    
    newSelect.addEventListener('change', function() {
        renderScheduleAdmin(this.value, scheduleItems);
    });
    
    renderScheduleAdmin(newSelect.value || 'all', scheduleItems);
}

function renderScheduleAdmin(groupId, scheduleItems) {
    const container = document.getElementById('schedule-admin-list');
    if (!container) return;
    
    let html = '<table><thead><tr><th>Группа</th><th>День недели</th><th>Время</th><th>Активность</th><th>Действия</th></tr></thead><tbody>';
    
    scheduleItems.forEach((item, index) => {
        const itemGroup = item.group || 'all';
        if (groupId !== 'all' && itemGroup !== groupId) return;
        
        const groupName = getGroupName(itemGroup);
        
        html += `
            <tr>
                <td>${groupName}</td>
                <td>${item.day || 'Не указан'}</td>
                <td>${item.time}</td>
                <td>${item.activity}</td>
                <td>
                    <button onclick="editScheduleItem(${index})" class="btn-small btn-primary">✏️</button>
                    <button onclick="deleteScheduleItem(${index})" class="btn-small btn-danger">🗑️</button>
                </td>
            </tr>
        `;
    });
    
    html += '</tbody></table>';
    container.innerHTML = html;
}

// Загрузка мероприятий для администрирования
function loadEventsAdmin() {
    // Сначала проверяем сохраненные данные в localStorage
    let events = JSON.parse(localStorage.getItem('adminEvents') || '[]');
    const container = document.getElementById('events-admin-list');
    
    // Если нет сохраненных данных, загружаем из XML
    if (events.length === 0) {
        loadXMLData().then(xmlDoc => {
            const xmlEvents = xmlDoc.querySelectorAll('мероприятие');
            
            if (xmlEvents.length === 0 && events.length === 0) {
                container.innerHTML = '<p class="empty-message">Мероприятий не найдено</p>';
                return;
            }
            
            // Преобразуем XML события в объекты
            events = Array.from(xmlEvents).map(event => ({
                name: event.querySelector('название')?.textContent || '',
                date: event.querySelector('дата')?.textContent || '',
                description: event.querySelector('описание')?.textContent || ''
            }));
            
            // Сохраняем в localStorage для дальнейшего использования
            if (events.length > 0) {
                localStorage.setItem('adminEvents', JSON.stringify(events));
            }
            
            renderEvents(events);
        }).catch(error => {
            console.error('Ошибка загрузки мероприятий:', error);
            renderEvents(events);
        });
    } else {
        renderEvents(events);
    }
}

function renderEvents(events) {
    const container = document.getElementById('events-admin-list');
    
    if (events.length === 0) {
        container.innerHTML = '<p class="empty-message">Мероприятий не найдено</p>';
        return;
    }
    
    let html = '';
    events.forEach((event, index) => {
        html += `
            <div class="admin-card">
                <div class="admin-card-header">
                    <h3>${event.name}</h3>
                    <div>
                        <button onclick="editEvent(${index})" class="btn-small btn-primary">✏️</button>
                        <button onclick="deleteEvent(${index})" class="btn-small btn-danger">🗑️</button>
                    </div>
                </div>
                <div class="admin-card-body">
                    <p><strong>Дата:</strong> ${event.date}</p>
                    <p><strong>Описание:</strong> ${event.description}</p>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Загрузка наград для администрирования
function loadAwardsAdmin() {
    // Награды хранятся в HTML, поэтому загружаем из localStorage или используем дефолтные
    const awards = JSON.parse(localStorage.getItem('awards') || '[]');
    const container = document.getElementById('awards-admin-list');
    
    if (awards.length === 0) {
        const defaultAwards = [
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
        localStorage.setItem('awards', JSON.stringify(defaultAwards));
        loadAwardsAdmin();
        return;
    }
    
    let html = '';
    awards.forEach((award, index) => {
        html += `
            <div class="admin-card">
                <div class="admin-card-header">
                    <h3>${award.title}</h3>
                    <div>
                        <button onclick="editAward(${index})" class="btn-small btn-primary">✏️</button>
                        <button onclick="deleteAward(${index})" class="btn-small btn-danger">🗑️</button>
                    </div>
                </div>
                <div class="admin-card-body">
                    <p><strong>Год:</strong> ${award.year}</p>
                    <p><strong>Тип:</strong> ${award.type}</p>
                    <p><strong>Описание:</strong> ${award.desc}</p>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Вспомогательные функции
function getGroupName(groupId) {
    if (!groupId || groupId === 'all') {
        return 'Все группы';
    }
    
    // Сначала проверяем группы из localStorage
    const groups = JSON.parse(localStorage.getItem('adminGroups') || '[]');
    const group = groups.find(g => g.id === groupId);
    
    if (group) {
        return group.name;
    }
    
    // Если не найдено, используем дефолтные значения
    const defaultGroups = {
        '1': 'Младшая группа "Солнышко" (2-3 года)',
        '2': 'Средняя группа "Радуга" (3-4 года)',
        '3': 'Старшая группа "Звездочки" (4-5 лет)',
        '4': 'Подготовительная группа "Умники" (5-6 лет)'
    };
    
    return defaultGroups[groupId] || `Группа ${groupId}`;
}

// Используем глобальный кэш XML из loadXML.js, если доступен
function loadXMLData() {
    // Если есть глобальный кэш из loadXML.js, используем его
    if (typeof window !== 'undefined' && window.xmlDataCache) {
        return Promise.resolve(window.xmlDataCache);
    }
    
    // Если есть глобальная функция loadXMLData из loadXML.js, используем её
    if (typeof window !== 'undefined' && typeof window.loadXMLData === 'function') {
        return window.loadXMLData();
    }
    
    // Иначе загружаем заново
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', 'data.xml', true);
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                if (xhr.status === 200 || xhr.status === 0) {
                    let xmlDoc = xhr.responseXML;
                    if (!xmlDoc || xmlDoc.documentElement.nodeName === 'parsererror') {
                        const parser = new DOMParser();
                        xmlDoc = parser.parseFromString(xhr.responseText, 'text/xml');
                    }
                    // Кэшируем результат
                    if (typeof window !== 'undefined') {
                        window.xmlDataCache = xmlDoc;
                    }
                    resolve(xmlDoc);
                } else {
                    reject(new Error('Ошибка загрузки XML'));
                }
            }
        };
        xhr.onerror = function() {
            reject(new Error('Ошибка сети при загрузке XML'));
        };
        xhr.send();
    });
}

// Модальные окна
function closeModal() {
    document.getElementById('modal-overlay').style.display = 'none';
}

// Обновление статистики
function updateStatistics() {
    const applications = JSON.parse(localStorage.getItem('applications') || '[]');
    document.getElementById('total-applications').textContent = applications.length;
    document.getElementById('last-update').textContent = new Date().toLocaleString('ru-RU');
    
    // Обновляем информацию о сессии
    const loginTime = sessionStorage.getItem('adminLoginTime');
    const lastActivity = sessionStorage.getItem('adminLastActivity');
    
    if (loginTime) {
        const loginDate = new Date(parseInt(loginTime));
        document.getElementById('login-time').textContent = loginDate.toLocaleString('ru-RU');
    }
    
    if (lastActivity) {
        const activityDate = new Date(parseInt(lastActivity));
        const inactiveMinutes = Math.floor((Date.now() - parseInt(lastActivity)) / 60000);
        document.getElementById('last-activity').textContent = 
            `${activityDate.toLocaleString('ru-RU')} (${inactiveMinutes} мин назад)`;
    }
}

// Просмотр логов безопасности
function viewSecurityLogs() {
    const container = document.getElementById('security-logs-container');
    const logs = JSON.parse(localStorage.getItem('adminLoginLog') || '[]');
    
    if (logs.length === 0) {
        safeSetEmptyMessage(container, 'Логи отсутствуют');
        return;
    }
    
    // Сортируем логи по времени (новые первыми)
    logs.sort((a, b) => new Date(b.time) - new Date(a.time));
    
    let html = '<div style="max-height: 400px; overflow-y: auto;"><table style="width: 100%; border-collapse: collapse;"><thead><tr>';
    html += '<th style="padding: 10px; background: #f0f0f0; text-align: left;">Время</th>';
    html += '<th style="padding: 10px; background: #f0f0f0; text-align: left;">Пользователь</th>';
    html += '<th style="padding: 10px; background: #f0f0f0; text-align: left;">Действие</th>';
    html += '<th style="padding: 10px; background: #f0f0f0; text-align: left;">Результат</th>';
    html += '</tr></thead><tbody>';
    
    logs.forEach(log => {
        const time = new Date(log.time).toLocaleString('ru-RU');
        const result = log.success ? 
            '<span style="color: green;">✓ Успешно</span>' : 
            '<span style="color: red;">✗ Неудачно</span>';
        const action = log.action || (log.success ? 'Вход' : 'Попытка входа');
        
        html += `<tr style="border-bottom: 1px solid #eee;">`;
        html += `<td style="padding: 8px;">${time}</td>`;
        html += `<td style="padding: 8px;">${log.username || 'unknown'}</td>`;
        html += `<td style="padding: 8px;">${action}</td>`;
        html += `<td style="padding: 8px;">${result}</td>`;
        html += `</tr>`;
    });
    
    html += '</tbody></table></div>';
    container.innerHTML = html;
}

// Очистка логов безопасности
function clearSecurityLogs() {
    if (!confirm('Вы уверены, что хотите очистить все логи безопасности?')) return;
    
    localStorage.removeItem('adminLoginLog');
    const logsContainer = document.getElementById('security-logs-container');
    if (logsContainer) {
        safeSetEmptyMessage(logsContainer, 'Логи очищены');
    }
    alert('Логи безопасности очищены');
}

// Функции для работы с группами
function addGroup() {
    showGroupModal();
}

function editGroup(id) {
    const groups = JSON.parse(localStorage.getItem('adminGroups') || '[]');
    const group = groups.find(g => g.id === id);
    if (group) {
        showGroupModal(group);
    }
}

function showGroupModal(group = null) {
    const modalBody = document.getElementById('modal-body');
    const isEdit = group !== null;
    
    const nanniesValue = group?.nannies ? group.nannies.join(', ') : '';
    
    modalBody.innerHTML = `
        <form id="group-form" class="admin-form">
            <div class="form-group">
                <label for="group-id">ID группы</label>
                <input type="text" id="group-id" name="id" value="${group?.id || ''}" ${isEdit ? 'readonly' : ''} required>
            </div>
            <div class="form-group">
                <label for="group-name">Название группы</label>
                <input type="text" id="group-name" name="name" value="${group?.name || ''}" required>
            </div>
            <div class="form-group">
                <label for="group-age">Возраст</label>
                <input type="text" id="group-age" name="age" value="${group?.age || ''}" placeholder="2-3 года" required>
            </div>
            <div class="form-group">
                <label for="group-teacher">Воспитатель</label>
                <input type="text" id="group-teacher" name="teacher" value="${group?.teacher || ''}" required>
            </div>
            <div class="form-group">
                <label for="group-nannies">Няни (через запятую)</label>
                <input type="text" id="group-nannies" name="nannies" value="${nanniesValue}" placeholder="Иванова А.П., Петрова Б.В.">
            </div>
            <div class="form-group">
                <label for="group-count">Количество детей</label>
                <input type="number" id="group-count" name="count" value="${group?.count || '0'}" min="0" required>
            </div>
            <div style="display: flex; gap: 10px;">
                <button type="submit" class="btn-primary">💾 ${isEdit ? 'Сохранить' : 'Добавить'}</button>
                <button type="button" onclick="closeModal()" class="btn-secondary">Отмена</button>
            </div>
        </form>
    `;
    
    document.getElementById('modal-title').textContent = isEdit ? 'Редактировать группу' : 'Добавить группу';
    document.getElementById('modal-overlay').style.display = 'flex';
    
    // Обработчик формы
    const form = document.getElementById('group-form');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        saveGroup(group);
    });
}

function saveGroup(oldGroup) {
    // Проверка безопасности
    if (typeof window !== 'undefined' && window.SecurityModule && !window.SecurityModule.requireSecurityCheck('saveGroup')) {
        alert('Ошибка безопасности. Пожалуйста, войдите снова.');
        logout();
        return;
    }
    
    const form = document.getElementById('group-form');
    if (!form) return;
    
    const formData = new FormData(form);
    const sanitize = window.SecurityModule ? window.SecurityModule.sanitizeInput : (str) => str;
    const validateText = window.SecurityModule ? window.SecurityModule.validateText : () => true;
    const validateName = window.SecurityModule ? window.SecurityModule.validateName : () => true;
    
    const id = sanitize(formData.get('id') || '');
    const name = sanitize(formData.get('name') || '');
    const age = sanitize(formData.get('age') || '');
    const teacher = sanitize(formData.get('teacher') || '');
    const nanniesText = sanitize(formData.get('nannies') || '');
    const count = parseInt(formData.get('count') || '0');
    
    // Валидация
    if (!id || !/^[a-zA-Z0-9_-]+$/.test(id)) {
        alert('Ошибка: ID группы должен содержать только буквы, цифры, дефисы и подчеркивания');
        return;
    }
    
    if (!validateName(name) || !validateText(name, 100)) {
        alert('Ошибка: неверный формат названия группы');
        return;
    }
    
    if (!validateText(teacher, 100) || !validateName(teacher)) {
        alert('Ошибка: неверный формат имени воспитателя');
        return;
    }
    
    if (isNaN(count) || count < 0 || count > 100) {
        alert('Ошибка: количество детей должно быть от 0 до 100');
        return;
    }
    
    const nannies = nanniesText.split(',').map(n => {
        const sanitized = sanitize(n.trim());
        return validateName(sanitized) ? sanitized : null;
    }).filter(n => n !== null);
    
    const group = {
        id: id,
        name: name,
        age: age,
        teacher: teacher,
        nannies: nannies,
        count: count.toString()
    };
    
    let groups = [];
    if (window.SecurityModule) {
        groups = window.SecurityModule.safeGetLocalStorage('adminGroups') || [];
    } else {
        try {
            groups = JSON.parse(localStorage.getItem('adminGroups') || '[]');
        } catch (e) {
            groups = [];
        }
    }
    
    console.log('Текущие группы в localStorage:', groups.length);
    console.log('Сохраняем группу:', group.id, group.name);
    
    if (oldGroup) {
        const index = groups.findIndex(g => g.id === oldGroup.id);
        if (index !== -1) {
            groups[index] = group;
            console.log('Группа обновлена:', group.id);
        } else {
            console.warn('Группа для обновления не найдена:', oldGroup.id);
            groups.push(group);
        }
    } else {
        if (groups.find(g => g.id === group.id)) {
            alert('Группа с таким ID уже существует!');
            return;
        }
        groups.push(group);
        console.log('Новая группа добавлена:', group.id);
    }
    
    console.log('Всего групп после сохранения:', groups.length);
    
    if (window.SecurityModule) {
        window.SecurityModule.safeSetLocalStorage('adminGroups', groups);
    } else {
        localStorage.setItem('adminGroups', JSON.stringify(groups));
    }
    
    // Проверяем, что группа действительно сохранилась
    const savedGroups = JSON.parse(localStorage.getItem('adminGroups') || '[]');
    console.log('Проверка сохранения - групп в localStorage:', savedGroups.length);
    const savedGroup = savedGroups.find(g => g.id === group.id);
    if (savedGroup) {
        console.log('Группа успешно сохранена:', savedGroup);
    } else {
        console.error('ОШИБКА: Группа не найдена после сохранения!');
    }
    
    closeModal();
    loadGroupsAdmin();
    alert('Группа сохранена!');
}

function deleteGroup(id) {
    if (confirm('Вы уверены, что хотите удалить эту группу?')) {
        let groups = JSON.parse(localStorage.getItem('adminGroups') || '[]');
        groups = groups.filter(g => g.id !== id);
        localStorage.setItem('adminGroups', JSON.stringify(groups));
        loadGroupsAdmin();
        alert('Группа удалена!');
    }
}

// Функции для работы с расписанием
function addScheduleItem() {
    showScheduleModal();
}

function editScheduleItem(index) {
    const scheduleItems = JSON.parse(localStorage.getItem('adminSchedule') || '[]');
    const item = scheduleItems[index];
    if (item) {
        showScheduleModal(item, index);
    }
}

function showScheduleModal(item = null, index = null) {
    const modalBody = document.getElementById('modal-body');
    const isEdit = item !== null;
    
    // Загружаем группы для выпадающего списка
    let groups = JSON.parse(localStorage.getItem('adminGroups') || '[]');
    let groupsOptions = '<option value="all">Все группы</option>';
    
    if (groups.length === 0) {
        // Если групп нет в localStorage, загружаем из XML
        loadXMLData().then(xmlDoc => {
            const xmlGroups = xmlDoc.querySelectorAll('группа');
            groups = Array.from(xmlGroups).map(group => ({
                id: group.getAttribute('id') || '',
                name: group.querySelector('название')?.textContent || ''
            }));
            populateScheduleModal(groups, item, index, isEdit);
        });
        return;
    } else {
        groups.forEach(group => {
            if (group.id) {
                const selected = item?.group === group.id ? 'selected' : '';
                groupsOptions += `<option value="${group.id}" ${selected}>${group.name}</option>`;
            }
        });
    }
    
    populateScheduleModal(groups, item, index, isEdit, groupsOptions);
}

function populateScheduleModal(groups, item, index, isEdit, groupsOptions = '') {
    const modalBody = document.getElementById('modal-body');
    
    if (!groupsOptions) {
        groupsOptions = '<option value="all">Все группы</option>';
        groups.forEach(group => {
            if (group.id) {
                const selected = item?.group === group.id ? 'selected' : '';
                groupsOptions += `<option value="${group.id}" ${selected}>${group.name}</option>`;
            }
        });
    }
    
    modalBody.innerHTML = `
        <form id="schedule-form" class="admin-form">
            <div class="form-group">
                <label for="schedule-group">Группа</label>
                <select id="schedule-group" name="group" required>
                    ${groupsOptions}
                </select>
            </div>
            <div class="form-group">
                <label for="schedule-day">День недели</label>
                <select id="schedule-day" name="day" required>
                    <option value="Понедельник" ${item?.day === 'Понедельник' ? 'selected' : ''}>Понедельник</option>
                    <option value="Вторник" ${item?.day === 'Вторник' ? 'selected' : ''}>Вторник</option>
                    <option value="Среда" ${item?.day === 'Среда' ? 'selected' : ''}>Среда</option>
                    <option value="Четверг" ${item?.day === 'Четверг' ? 'selected' : ''}>Четверг</option>
                    <option value="Пятница" ${item?.day === 'Пятница' ? 'selected' : ''}>Пятница</option>
                    <option value="Суббота" ${item?.day === 'Суббота' ? 'selected' : ''}>Суббота</option>
                    <option value="Воскресенье" ${item?.day === 'Воскресенье' ? 'selected' : ''}>Воскресенье</option>
                </select>
            </div>
            <div class="form-group">
                <label for="schedule-time">Время</label>
                <input type="text" id="schedule-time" name="time" value="${item?.time || ''}" placeholder="08:00-09:00" required>
            </div>
            <div class="form-group">
                <label for="schedule-activity">Активность</label>
                <textarea id="schedule-activity" name="activity" rows="3" required>${item?.activity || ''}</textarea>
            </div>
            <div style="display: flex; gap: 10px;">
                <button type="submit" class="btn-primary">💾 ${isEdit ? 'Сохранить' : 'Добавить'}</button>
                <button type="button" onclick="closeModal()" class="btn-secondary">Отмена</button>
            </div>
        </form>
    `;
    
    document.getElementById('modal-title').textContent = isEdit ? 'Редактировать расписание' : 'Добавить пункт расписания';
    document.getElementById('modal-overlay').style.display = 'flex';
    
    // Обработчик формы
    const form = document.getElementById('schedule-form');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        saveScheduleItem(item, index);
    });
}

function saveScheduleItem(oldItem, oldIndex) {
    // Проверка безопасности
    if (typeof window !== 'undefined' && window.SecurityModule && !window.SecurityModule.requireSecurityCheck('saveScheduleItem')) {
        alert('Ошибка безопасности. Пожалуйста, войдите снова.');
        logout();
        return;
    }
    
    const form = document.getElementById('schedule-form');
    if (!form) return;
    
    const formData = new FormData(form);
    const sanitize = window.SecurityModule ? window.SecurityModule.sanitizeInput : (str) => str;
    const validateText = window.SecurityModule ? window.SecurityModule.validateText : () => true;
    
    const group = sanitize(formData.get('group') || '');
    const day = sanitize(formData.get('day') || '');
    const time = sanitize(formData.get('time') || '');
    const activity = sanitize(formData.get('activity') || '');
    
    // Валидация
    const validDays = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];
    if (!validDays.includes(day)) {
        alert('Ошибка: неверный день недели');
        return;
    }
    
    if (!validateText(time, 20) || !/^[0-9]{2}:[0-9]{2}-[0-9]{2}:[0-9]{2}$/.test(time)) {
        alert('Ошибка: время должно быть в формате HH:MM-HH:MM');
        return;
    }
    
    if (!validateText(activity, 200)) {
        alert('Ошибка: описание активности содержит недопустимые символы');
        return;
    }
    
    const item = {
        group: group,
        day: day,
        time: time,
        activity: activity
    };
    
    let scheduleItems = [];
    if (window.SecurityModule) {
        scheduleItems = window.SecurityModule.safeGetLocalStorage('adminSchedule') || [];
    } else {
        try {
            scheduleItems = JSON.parse(localStorage.getItem('adminSchedule') || '[]');
        } catch (e) {
            scheduleItems = [];
        }
    }
    
    if (oldItem && oldIndex !== null && oldIndex < scheduleItems.length) {
        scheduleItems[oldIndex] = item;
    } else {
        scheduleItems.push(item);
    }
    
    if (window.SecurityModule) {
        window.SecurityModule.safeSetLocalStorage('adminSchedule', scheduleItems);
    } else {
    localStorage.setItem('adminSchedule', JSON.stringify(scheduleItems));
    }
    
    closeModal();
    loadScheduleAdmin();
    alert('Расписание сохранено!');
}

function deleteScheduleItem(index) {
    if (confirm('Вы уверены, что хотите удалить этот пункт расписания?')) {
        let scheduleItems = JSON.parse(localStorage.getItem('adminSchedule') || '[]');
        scheduleItems.splice(index, 1);
        localStorage.setItem('adminSchedule', JSON.stringify(scheduleItems));
        loadScheduleAdmin();
        alert('Пункт расписания удален!');
    }
}

function addEvent() {
    showEventModal();
}

function editEvent(index) {
    const events = JSON.parse(localStorage.getItem('adminEvents') || '[]');
    const event = events[index];
    if (event) {
        showEventModal(event, index);
    }
}

function showEventModal(event = null, index = null) {
    const modalBody = document.getElementById('modal-body');
    const isEdit = event !== null;
    
    modalBody.innerHTML = `
        <form id="event-form" class="admin-form">
            <div class="form-group">
                <label for="event-name">Название мероприятия</label>
                <input type="text" id="event-name" name="name" value="${event?.name || ''}" required>
            </div>
            <div class="form-group">
                <label for="event-date">Дата</label>
                <input type="date" id="event-date" name="date" value="${event?.date || ''}" required>
            </div>
            <div class="form-group">
                <label for="event-description">Описание</label>
                <textarea id="event-description" name="description" rows="4" required>${event?.description || ''}</textarea>
            </div>
            <div style="display: flex; gap: 10px;">
                <button type="submit" class="btn-primary">💾 ${isEdit ? 'Сохранить' : 'Добавить'}</button>
                <button type="button" onclick="closeModal()" class="btn-secondary">Отмена</button>
            </div>
        </form>
    `;
    
    document.getElementById('modal-title').textContent = isEdit ? 'Редактировать мероприятие' : 'Добавить мероприятие';
    document.getElementById('modal-overlay').style.display = 'flex';
    
    // Обработчик формы
    const form = document.getElementById('event-form');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        saveEvent(event, index);
    });
}

function saveEvent(oldEvent, oldIndex) {
    // Проверка безопасности
    if (typeof window !== 'undefined' && window.SecurityModule && !window.SecurityModule.requireSecurityCheck('saveEvent')) {
        alert('Ошибка безопасности. Пожалуйста, войдите снова.');
        logout();
        return;
    }
    
    const form = document.getElementById('event-form');
    if (!form) return;
    
    const formData = new FormData(form);
    const sanitize = window.SecurityModule ? window.SecurityModule.sanitizeInput : (str) => str;
    const validateText = window.SecurityModule ? window.SecurityModule.validateText : () => true;
    
    const name = sanitize(formData.get('name') || '');
    const date = formData.get('date') || '';
    const description = sanitize(formData.get('description') || '');
    
    // Валидация
    if (!validateText(name, 100)) {
        alert('Ошибка: название мероприятия содержит недопустимые символы');
        return;
    }
    
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        alert('Ошибка: неверный формат даты');
        return;
    }
    
    if (!validateText(description, 500)) {
        alert('Ошибка: описание содержит недопустимые символы');
        return;
    }
    
    const event = {
        name: name,
        date: date,
        description: description
    };
    
    let events = [];
    if (window.SecurityModule) {
        events = window.SecurityModule.safeGetLocalStorage('adminEvents') || [];
    } else {
        try {
            events = JSON.parse(localStorage.getItem('adminEvents') || '[]');
        } catch (e) {
            events = [];
        }
    }
    
    if (oldEvent && oldIndex !== null && oldIndex < events.length) {
        events[oldIndex] = event;
    } else {
        events.push(event);
    }
    
    if (window.SecurityModule) {
        window.SecurityModule.safeSetLocalStorage('adminEvents', events);
    } else {
    localStorage.setItem('adminEvents', JSON.stringify(events));
    }
    
    closeModal();
    loadEventsAdmin();
    alert('Мероприятие сохранено!');
}

function deleteEvent(index) {
    if (confirm('Вы уверены, что хотите удалить это мероприятие?')) {
        let events = JSON.parse(localStorage.getItem('adminEvents') || '[]');
        events.splice(index, 1);
        localStorage.setItem('adminEvents', JSON.stringify(events));
        loadEventsAdmin();
        alert('Мероприятие удалено!');
    }
}

function addAward() {
    showAwardModal();
}

function editAward(index) {
    const awards = JSON.parse(localStorage.getItem('awards') || '[]');
    const award = awards[index];
    if (award) {
        showAwardModal(award, index);
    }
}

function showAwardModal(award = null, index = null) {
    const modalBody = document.getElementById('modal-body');
    const isEdit = award !== null;
    
    modalBody.innerHTML = `
        <form id="award-form" class="admin-form">
            <div class="form-group">
                <label for="award-title">Название награды</label>
                <input type="text" id="award-title" name="title" value="${award?.title || ''}" required>
            </div>
            <div class="form-group">
                <label for="award-year">Год</label>
                <input type="text" id="award-year" name="year" value="${award?.year || ''}" placeholder="2024" required>
            </div>
            <div class="form-group">
                <label for="award-type">Тип награды</label>
                <select id="award-type" name="type" required>
                    <option value="gold" ${award?.type === 'gold' ? 'selected' : ''}>Золотая</option>
                    <option value="silver" ${award?.type === 'silver' ? 'selected' : ''}>Серебряная</option>
                    <option value="bronze" ${award?.type === 'bronze' ? 'selected' : ''}>Бронзовая</option>
                </select>
            </div>
            <div class="form-group">
                <label for="award-desc">Описание</label>
                <textarea id="award-desc" name="desc" rows="4" required>${award?.desc || ''}</textarea>
            </div>
            <div style="display: flex; gap: 10px;">
                <button type="submit" class="btn-primary">💾 ${isEdit ? 'Сохранить' : 'Добавить'}</button>
                <button type="button" onclick="closeModal()" class="btn-secondary">Отмена</button>
            </div>
        </form>
    `;
    
    document.getElementById('modal-title').textContent = isEdit ? 'Редактировать награду' : 'Добавить награду';
    document.getElementById('modal-overlay').style.display = 'flex';
    
    // Обработчик формы
    const form = document.getElementById('award-form');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        saveAward(award, index);
    });
}

function saveAward(oldAward, oldIndex) {
    // Проверка безопасности
    if (typeof window !== 'undefined' && window.SecurityModule && !window.SecurityModule.requireSecurityCheck('saveAward')) {
        alert('Ошибка безопасности. Пожалуйста, войдите снова.');
        logout();
        return;
    }
    
    const form = document.getElementById('award-form');
    if (!form) return;
    
    const formData = new FormData(form);
    const sanitize = window.SecurityModule ? window.SecurityModule.sanitizeInput : (str) => str;
    const validateText = window.SecurityModule ? window.SecurityModule.validateText : () => true;
    
    const title = sanitize(formData.get('title') || '');
    const year = sanitize(formData.get('year') || '');
    const type = formData.get('type') || '';
    const desc = sanitize(formData.get('desc') || '');
    
    // Валидация
    if (!validateText(title, 200)) {
        alert('Ошибка: название награды содержит недопустимые символы');
        return;
    }
    
    if (!year || !/^\d{4}$/.test(year) || parseInt(year) < 2000 || parseInt(year) > 2100) {
        alert('Ошибка: год должен быть от 2000 до 2100');
        return;
    }
    
    const validTypes = ['gold', 'silver', 'bronze'];
    if (!validTypes.includes(type)) {
        alert('Ошибка: неверный тип награды');
        return;
    }
    
    if (!validateText(desc, 500)) {
        alert('Ошибка: описание содержит недопустимые символы');
        return;
    }
    
    const award = {
        title: title,
        year: year,
        type: type,
        desc: desc
    };
    
    let awards = [];
    if (window.SecurityModule) {
        awards = window.SecurityModule.safeGetLocalStorage('awards') || [];
    } else {
        try {
            awards = JSON.parse(localStorage.getItem('awards') || '[]');
        } catch (e) {
        awards = [];
        }
    }
    
    if (oldAward && oldIndex !== null && oldIndex < awards.length) {
        awards[oldIndex] = award;
    } else {
        awards.push(award);
    }
    
    if (window.SecurityModule) {
        window.SecurityModule.safeSetLocalStorage('awards', awards);
    } else {
    localStorage.setItem('awards', JSON.stringify(awards));
    }
    
    closeModal();
    loadAwardsAdmin();
    alert('Награда сохранена!');
}

function deleteAward(index) {
    if (confirm('Вы уверены, что хотите удалить эту награду?')) {
        const awards = JSON.parse(localStorage.getItem('awards') || '[]');
        awards.splice(index, 1);
        localStorage.setItem('awards', JSON.stringify(awards));
        loadAwardsAdmin();
        alert('Награда удалена!');
    }
}

// Вспомогательные функции безопасности
function safeSetText(element, text) {
    if (!element) return;
    if (window.SecurityModule) {
        element.textContent = window.SecurityModule.sanitizeHTML(text || '');
    } else {
        element.textContent = text || '';
    }
}

function safeSetEmptyMessage(container, message) {
    if (!container) return;
    container.textContent = '';
    const p = document.createElement('p');
    p.className = 'empty-message';
    p.textContent = message;
    container.appendChild(p);
}

// Простая функция хеширования пароля (SHA-256)
async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Изменение пароля
async function changePassword() {
    const oldPassword = document.getElementById('old-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    
    const credentials = JSON.parse(localStorage.getItem('adminCredentials'));
    
    // Проверяем старый пароль (поддерживаем оба формата для совместимости)
    const oldPasswordHash = await hashPassword(oldPassword);
    const isOldPasswordCorrect = credentials.passwordHash ? 
        oldPasswordHash === credentials.passwordHash : 
        oldPassword === credentials.password;
    
    if (!isOldPasswordCorrect) {
        alert('Неверный текущий пароль');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        alert('Новые пароли не совпадают');
        return;
    }
    
    if (newPassword.length < 6) {
        alert('Пароль должен содержать минимум 6 символов');
        return;
    }
    
    // Хешируем новый пароль
    const newPasswordHash = await hashPassword(newPassword);
    credentials.passwordHash = newPasswordHash;
    // Удаляем старый пароль в открытом виде, если он есть
    if (credentials.password) {
        delete credentials.password;
    }
    localStorage.setItem('adminCredentials', JSON.stringify(credentials));
    
    // Логируем смену пароля
    const loginLog = JSON.parse(localStorage.getItem('adminLoginLog') || '[]');
    loginLog.push({
        username: sessionStorage.getItem('adminUsername'),
        time: new Date().toISOString(),
        action: 'password_change',
        ip: 'local'
    });
    if (loginLog.length > 50) loginLog.shift();
    localStorage.setItem('adminLoginLog', JSON.stringify(loginLog));
    
    alert('Пароль успешно изменен!');
    document.getElementById('password-form').reset();
}

// Экспорт всех данных
function exportAllData() {
    const data = {
        applications: JSON.parse(localStorage.getItem('applications') || '[]'),
        kindergartenInfo: JSON.parse(localStorage.getItem('kindergartenInfo') || '{}'),
        awards: JSON.parse(localStorage.getItem('awards') || '[]'),
        events: JSON.parse(localStorage.getItem('adminEvents') || '[]'),
        groups: JSON.parse(localStorage.getItem('adminGroups') || '[]'),
        schedule: JSON.parse(localStorage.getItem('adminSchedule') || '[]'),
        exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
}

// Импорт данных
function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            if (data.applications) localStorage.setItem('applications', JSON.stringify(data.applications));
            if (data.kindergartenInfo) localStorage.setItem('kindergartenInfo', JSON.stringify(data.kindergartenInfo));
            if (data.awards) localStorage.setItem('awards', JSON.stringify(data.awards));
            if (data.events) localStorage.setItem('adminEvents', JSON.stringify(data.events));
            if (data.groups) localStorage.setItem('adminGroups', JSON.stringify(data.groups));
            if (data.schedule) localStorage.setItem('adminSchedule', JSON.stringify(data.schedule));
            
            alert('Данные успешно импортированы!');
            loadApplications();
            updateStatistics();
            
            // Перезагружаем текущую секцию
            const activeSection = document.querySelector('.admin-section.active');
            if (activeSection) {
                const sectionId = activeSection.id.replace('admin-', '');
                if (sectionId === 'events') {
                    loadEventsAdmin();
                } else if (sectionId === 'awards') {
                    loadAwardsAdmin();
                } else if (sectionId === 'groups') {
                    loadGroupsAdmin();
                } else if (sectionId === 'schedule') {
                    loadScheduleAdmin();
                }
            }
        } catch (error) {
            alert('Ошибка при импорте данных: ' + error.message);
        }
    };
    reader.readAsText(file);
}

