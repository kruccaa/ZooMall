const container = document.querySelector('.cards-toys');

fetch('toys.json')
    .then(response => {
        if (!response.ok) {
            throw new Error(`Файл не знайдено (Статус: ${response.status})`);
        }
        return response.json();
    })
    .then(toys => {
        if (!Array.isArray(toys)) {
            container.innerHTML = `\n<h2 style="color:red;">Помилка: JSON завантажився, але це не масив!</h2>\n<p>Ось що побачив браузер: ${JSON.stringify(toys)}</p>\n`;
            return;
        }

        // Якщо все добре, малюємо картки
        toys.forEach(toy => {
            const cardElement = document.createElement('div');
            cardElement.className = 'card';
            
            cardElement.innerHTML = `\n<img src="${toy.image}" alt="${toy.title}">\n<h3>${toy.title}</h3>\n<p>${toy.description}</p>\n<p><strong>Ціна:</strong> ${toy.price} грн</p>\n<button class="buy-btn">Купити</button>\n`;
            
            container.appendChild(cardElement);
        });
    })
    .catch(error => {
        container.innerHTML = `\n<h2 style="color:red;">Помилка підключення: ${error.message}</h2>\n<p>Перевір, чи правильно названо файл card.json та чи він лежить у тій самій папці.</p>\n`;
    });