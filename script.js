// Ждём загрузки страницы
document.addEventListener('DOMContentLoaded', function() {
    
    // Добавляем поле поиска в шапку
    const header = document.querySelector('header');
    const searchDiv = document.createElement('div');
    searchDiv.style.marginTop = '20px';
    searchDiv.innerHTML = `
        <input type="text" id="searchTools" placeholder="🔍 Поиск инструментов..." 
               style="padding: 10px; width: 300px; border-radius: 5px; border: none; background: #16213e; color: white; border: 1px solid #e94560;">
    `;
    header.appendChild(searchDiv);
    
    // Функция поиска
    const searchInput = document.getElementById('searchTools');
    const cards = document.querySelectorAll('.tool-card');
    
    searchInput.addEventListener('keyup', function() {
        const searchText = this.value.toLowerCase();
        
        cards.forEach(card => {
            const title = card.querySelector('h3').textContent.toLowerCase();
            const description = card.querySelector('p').textContent.toLowerCase();
            
            if (title.includes(searchText) || description.includes(searchText)) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    });
    
    // Добавляем возможность копировать ссылки по клику на кнопку
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            // Не блокируем переход, просто показываем уведомление
            const link = this.href;
            console.log('Переход по ссылке:', link);
        });
    });
});