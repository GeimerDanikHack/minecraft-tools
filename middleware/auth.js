// middleware/auth.js
const bcrypt = require('bcryptjs');

// Middleware для проверки, авторизован ли пользователь
const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.isAdmin) {
        return next(); // Пользователь авторизован — пропускаем
    }
    // Не авторизован — перенаправляем на страницу входа
    res.redirect('/login');
};

// Middleware для проверки credentials при входе
const authenticate = async (req, res, next) => {
    const { username, password } = req.body;
    
    // Получаем данные из переменных окружения
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;
    
    // Проверяем имя пользователя
    if (username !== adminUsername) {
        return res.status(401).json({ error: 'Неверные учетные данные' });
    }
    
    // Если пароль ещё не захэширован в .env, используем прямое сравнение
    // (временно, пока не сгенерируем хэш)
    if (!adminPasswordHash) {
        if (password === process.env.ADMIN_PASSWORD) {
            req.session.isAdmin = true;
            return next();
        }
    } else {
        // Сравниваем с хэшем
        const isValid = await bcrypt.compare(password, adminPasswordHash);
        if (isValid) {
            req.session.isAdmin = true;
            return next();
        }
    }
    
    res.status(401).json({ error: 'Неверные учетные данные' });
};

module.exports = { isAuthenticated, authenticate };