// ============================================
// МОДУЛЬ БЕЗОПАСНОСТИ
// Защита от XSS, CSRF, инъекций и других атак
// ============================================

// Генерация CSRF токена
function generateCSRFToken() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Получение или создание CSRF токена для сессии
function getCSRFToken() {
    let token = sessionStorage.getItem('csrfToken');
    if (!token) {
        token = generateCSRFToken();
        sessionStorage.setItem('csrfToken', token);
        sessionStorage.setItem('csrfTokenTime', Date.now().toString());
    }
    return token;
}

// Проверка CSRF токена
function validateCSRFToken(token) {
    const storedToken = sessionStorage.getItem('csrfToken');
    const tokenTime = sessionStorage.getItem('csrfTokenTime');
    
    if (!storedToken || !tokenTime) return false;
    
    // Токен действителен 1 час
    const tokenAge = Date.now() - parseInt(tokenTime);
    if (tokenAge > 60 * 60 * 1000) {
        // Токен истек, генерируем новый
        const newToken = generateCSRFToken();
        sessionStorage.setItem('csrfToken', newToken);
        sessionStorage.setItem('csrfTokenTime', Date.now().toString());
        return false;
    }
    
    return token === storedToken;
}

// Санитизация HTML (защита от XSS)
function sanitizeHTML(str) {
    if (typeof str !== 'string') return '';
    
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// Безопасное создание HTML элемента с текстом
function createSafeElement(tag, text, attributes = {}) {
    const element = document.createElement(tag);
    element.textContent = text; // Используем textContent вместо innerHTML
    
    // Безопасно добавляем атрибуты
    Object.keys(attributes).forEach(key => {
        if (key === 'class') {
            element.className = sanitizeHTML(attributes[key]);
        } else if (key === 'id') {
            element.id = sanitizeHTML(attributes[key]);
        } else if (key.startsWith('data-')) {
            element.setAttribute(key, sanitizeHTML(attributes[key]));
        } else if (key === 'onclick' || key.startsWith('on')) {
            // Блокируем обработчики событий для безопасности
            console.warn('Блокирована попытка добавить обработчик события:', key);
        } else {
            element.setAttribute(key, sanitizeHTML(attributes[key]));
        }
    });
    
    return element;
}

// Безопасное вставка HTML (только для доверенного контента)
function safeSetHTML(element, content) {
    if (!element) return;
    
    // Очищаем элемент
    element.textContent = '';
    
    // Если это строка, используем textContent
    if (typeof content === 'string') {
        element.textContent = content;
    } else if (content instanceof Node) {
        element.appendChild(content);
    } else if (Array.isArray(content)) {
        content.forEach(item => {
            if (item instanceof Node) {
                element.appendChild(item);
            } else {
                const textNode = document.createTextNode(String(item));
                element.appendChild(textNode);
            }
        });
    }
}

// Валидация email
function validateEmail(email) {
    if (!email) return true; // Email не обязателен
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
}

// Валидация телефона
function validatePhone(phone) {
    if (!phone) return false;
    // Разрешаем формат: +7 (XXX) XXX-XX-XX или +7XXXXXXXXXX
    const phoneRegex = /^\+?7[\s\-\(]?[0-9]{3}[\s\-\)]?[0-9]{3}[\s\-]?[0-9]{2}[\s\-]?[0-9]{2}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
}

// Валидация имени (только буквы, пробелы, дефисы)
function validateName(name) {
    if (!name) return false;
    const nameRegex = /^[а-яА-ЯёЁa-zA-Z\s\-']{2,50}$/;
    return nameRegex.test(name.trim());
}

// Валидация возраста
function validateAge(age) {
    const ageNum = parseFloat(age);
    return !isNaN(ageNum) && ageNum >= 0.5 && ageNum <= 7;
}

// Валидация текста (защита от инъекций)
function validateText(text, maxLength = 1000) {
    if (!text) return true; // Текст не обязателен
    if (typeof text !== 'string') return false;
    if (text.length > maxLength) return false;
    
    // Проверяем на опасные паттерны
    const dangerousPatterns = [
        /<script/i,
        /javascript:/i,
        /on\w+\s*=/i,
        /<iframe/i,
        /<object/i,
        /<embed/i,
        /data:text\/html/i
    ];
    
    return !dangerousPatterns.some(pattern => pattern.test(text));
}

// Очистка пользовательского ввода
function sanitizeInput(input) {
    if (typeof input !== 'string') return '';
    
    // Удаляем опасные символы и паттерны
    return input
        .replace(/[<>]/g, '') // Удаляем угловые скобки
        .replace(/javascript:/gi, '') // Удаляем javascript:
        .replace(/on\w+\s*=/gi, '') // Удаляем обработчики событий
        .trim()
        .substring(0, 1000); // Ограничиваем длину
}

// Валидация всех данных формы заявки
function validateApplicationForm(formData) {
    const errors = [];
    
    const childName = formData.get('child-name') || '';
    const childSurname = formData.get('child-surname') || '';
    const childAge = formData.get('child-age') || '';
    const parentName = formData.get('parent-name') || '';
    const parentPhone = formData.get('parent-phone') || '';
    const parentEmail = formData.get('parent-email') || '';
    const comments = formData.get('comments') || '';
    
    if (!validateName(childName)) {
        errors.push('Имя ребенка должно содержать только буквы (2-50 символов)');
    }
    
    if (!validateName(childSurname)) {
        errors.push('Фамилия ребенка должна содержать только буквы (2-50 символов)');
    }
    
    if (!validateAge(childAge)) {
        errors.push('Возраст ребенка должен быть от 0.5 до 7 лет');
    }
    
    if (!validateName(parentName)) {
        errors.push('ФИО родителя должно содержать только буквы (2-50 символов)');
    }
    
    if (!validatePhone(parentPhone)) {
        errors.push('Телефон должен быть в формате +7 (XXX) XXX-XX-XX');
    }
    
    if (parentEmail && !validateEmail(parentEmail)) {
        errors.push('Email имеет неверный формат');
    }
    
    if (comments && !validateText(comments, 500)) {
        errors.push('Комментарий содержит недопустимые символы или слишком длинный');
    }
    
    return {
        valid: errors.length === 0,
        errors: errors
    };
}

// Безопасное сохранение данных в localStorage
function safeSetLocalStorage(key, value) {
    try {
        // Валидируем ключ
        if (!/^[a-zA-Z0-9_-]+$/.test(key)) {
            console.error('Небезопасный ключ localStorage:', key);
            return false;
        }
        
        // Проверяем размер данных (максимум 5MB)
        const dataString = JSON.stringify(value);
        if (dataString.length > 5 * 1024 * 1024) {
            console.error('Данные слишком большие для localStorage');
            return false;
        }
        
        localStorage.setItem(key, dataString);
        return true;
    } catch (e) {
        console.error('Ошибка сохранения в localStorage:', e);
        return false;
    }
}

// Безопасное чтение из localStorage
function safeGetLocalStorage(key) {
    try {
        // Валидируем ключ
        if (!/^[a-zA-Z0-9_-]+$/.test(key)) {
            console.error('Небезопасный ключ localStorage:', key);
            return null;
        }
        
        const data = localStorage.getItem(key);
        if (!data) return null;
        
        return JSON.parse(data);
    } catch (e) {
        console.error('Ошибка чтения из localStorage:', e);
        return null;
    }
}

// Защита от кликджекинга (X-Frame-Options)
function preventClickjacking() {
    // X-Frame-Options не может быть установлен через meta тег, только через HTTP заголовки
    // Используем только JavaScript проверку
    if (window.top !== window.self) {
        // Страница загружена во фрейме - перенаправляем на саму себя
        try {
            window.top.location = window.self.location;
        } catch (e) {
            // Если доступ к window.top заблокирован, это означает, что страница во фрейме
            // В этом случае можно показать предупреждение или заблокировать контент
            console.warn('Страница загружена во фрейме, что может быть попыткой кликджекинга');
            document.body.innerHTML = '<div style="padding: 20px; text-align: center;"><h2>⚠️ Безопасность</h2><p>Эта страница не может быть загружена во фрейме.</p></div>';
        }
    }
}

// Инициализация защиты при загрузке страницы
function initSecurity() {
    // Защита от кликджекинга
    preventClickjacking();
    
    // Генерируем CSRF токен если его нет
    getCSRFToken();
    
    // Защита от открытия в iframe
    if (window.self !== window.top) {
        window.top.location = window.self.location;
    }
}

// Проверка безопасности перед выполнением действия
function requireSecurityCheck(action) {
    // Для простых действий (переключение секций) не требуем строгой проверки
    const simpleActions = ['showAdminSection', 'loadApplications', 'loadGroupsAdmin', 'loadScheduleAdmin', 'loadEventsAdmin', 'loadAwardsAdmin'];
    if (simpleActions.includes(action)) {
        // Для простых действий только проверяем наличие сессии
        const loggedIn = sessionStorage.getItem('adminLoggedIn');
        return loggedIn === 'true';
    }
    
    // Для критичных действий проверяем сессию полностью
    if (typeof validateSession === 'function' && !validateSession()) {
        console.warn('Попытка выполнить действие без валидной сессии');
        return false;
    }
    
    // Проверяем CSRF токен для критичных действий
    const token = getCSRFToken();
    if (!token) {
        console.warn('CSRF токен не найден');
        // Для простых действий не блокируем, если токена нет
        if (simpleActions.includes(action)) {
            return true;
        }
        return false;
    }
    
    return true;
}

// Экспорт функций для использования в других файлах
if (typeof window !== 'undefined') {
    window.SecurityModule = {
        sanitizeHTML,
        sanitizeInput,
        createSafeElement,
        safeSetHTML,
        validateEmail,
        validatePhone,
        validateName,
        validateAge,
        validateText,
        validateApplicationForm,
        safeSetLocalStorage,
        safeGetLocalStorage,
        generateCSRFToken,
        getCSRFToken,
        validateCSRFToken,
        preventClickjacking,
        initSecurity,
        requireSecurityCheck
    };
}

// Автоматическая инициализация при загрузке
// Откладываем инициализацию, чтобы не блокировать загрузку данных
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        // Инициализируем безопасность после небольшой задержки, чтобы не блокировать загрузку данных
        setTimeout(initSecurity, 100);
    });
} else {
    setTimeout(initSecurity, 100);
}

