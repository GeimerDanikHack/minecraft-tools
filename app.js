const express = require('express');
const path = require('path');
const fs = require('fs');
const session = require('express-session');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Настройка сессий
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-this',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false, // для локальной разработки
        maxAge: 1000 * 60 * 60 * 24 // 24 часа
    }
}));

// Путь к файлу с данными
const dataPath = path.join(__dirname, 'data', 'tools.json');

// Вспомогательная функция для чтения данных
function readData() {
    return JSON.parse(fs.readFileSync(dataPath, 'utf8'));
}

// Вспомогательная функция для записи данных
function writeData(data) {
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf8');
}

// Middleware для проверки авторизации
const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.isAdmin) {
        return next();
    }
    res.redirect('/login');
};

// ========== ПУБЛИЧНЫЕ МАРШРУТЫ ==========

// Главная страница
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// Страница входа
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

// Обработка входа
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD;
    
    if (username === adminUsername && password === adminPassword) {
        req.session.isAdmin = true;
        res.json({ success: true });
    } else {
        res.status(401).json({ error: 'Неверные учетные данные' });
    }
});

// Выход
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

// API: получить все инструменты (публичный)
app.get('/api/tools', (req, res) => {
    const data = readData();
    res.json(data);
});

// API: поиск инструментов (публичный)
app.get('/api/tools/search', (req, res) => {
    const query = req.query.q?.toLowerCase() || '';
    const data = readData();
    
    if (!query) {
        return res.json(data);
    }
    
    const filteredCategories = data.categories.map(category => {
        const filteredTools = category.tools.filter(tool => 
            tool.name.toLowerCase().includes(query) || 
            tool.description.toLowerCase().includes(query)
        );
        return {
            ...category,
            tools: filteredTools
        };
    }).filter(category => category.tools.length > 0);
    
    res.json({ categories: filteredCategories });
});

// API: статистика (публичный)
app.get('/api/stats', (req, res) => {
    const data = readData();
    const totalTools = data.categories.reduce((acc, cat) => acc + cat.tools.length, 0);
    res.json({
        totalTools,
        totalCategories: data.categories.length,
        lastUpdated: new Date().toISOString()
    });
});

// API: получить все категории (публичный)
app.get('/api/categories', (req, res) => {
    const data = readData();
    res.json(data.categories.map(c => c.name));
});

// ========== ЗАЩИЩЁННЫЕ МАРШРУТЫ АДМИНКИ ==========

// Страница админ-панели (только для авторизованных)
app.get('/admin', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'admin.html'));
});

// API: добавить новую категорию (только для админа)
app.post('/api/admin/category', isAuthenticated, (req, res) => {
    try {
        const { name, icon } = req.body;
        const data = readData();
        
        const newCategory = {
            name: name,
            icon: icon || '📌',
            tools: []
        };
        
        data.categories.push(newCategory);
        writeData(data);
        
        res.json({ success: true, category: newCategory });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// API: добавить новый инструмент (только для админа)
app.post('/api/admin/tool', isAuthenticated, (req, res) => {
    try {
        const { categoryName, name, description, url } = req.body;
        const data = readData();
        
        const category = data.categories.find(c => c.name === categoryName);
        if (!category) {
            return res.status(404).json({ success: false, error: 'Категория не найдена' });
        }
        
        const newTool = {
            name: name,
            description: description,
            url: url
        };
        
        category.tools.push(newTool);
        writeData(data);
        
        res.json({ success: true, tool: newTool });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// API: удалить инструмент (только для админа)
app.delete('/api/admin/tool', isAuthenticated, (req, res) => {
    try {
        const { categoryName, toolName } = req.body;
        const data = readData();
        
        const category = data.categories.find(c => c.name === categoryName);
        if (!category) {
            return res.status(404).json({ success: false, error: 'Категория не найдена' });
        }
        
        category.tools = category.tools.filter(t => t.name !== toolName);
        writeData(data);
        
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 404
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'views', '404.html'));
});

app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 Сервер запущен на http://localhost:${port}`);
    console.log(`📊 API: http://localhost:${port}/api/tools`);
    console.log(`🔐 Админ-панель: http://localhost:${port}/admin`);
    console.log(`👤 Логин: ${process.env.ADMIN_USERNAME || 'admin'}`);
});
const { getServerStatus } = require('./api/server-status');

app.get('/api/server-status', async (req, res) => {
    const serverIp = req.query.ip || 'localhost'; // IP вашего сервера
    const status = await getServerStatus(serverIp, 25565);
    res.json(status);
});





