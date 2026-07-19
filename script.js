const container = document.querySelector('.cards-toys');
let allToysData = [];

function renderToys(toys) {
    if (!container) return;
    container.innerHTML = '';
    
    if (toys.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:white; font-family:\'Sniglet\', cursive; font-size:24px; width:100%; margin-top: 40px;">Нічого не знайдено 😢</p>';
        return;
    }

    toys.forEach(toy => {
        const cardElement = document.createElement('div');
        cardElement.className = 'card';
        
        // Calculate bonus: ~50% of price, min 20, max 1000
        const bonus = Math.min(1000, Math.max(20, Math.round(toy.price * 0.5)));
        
        cardElement.innerHTML = `
            <img src="${toy.image}" alt="${toy.title}">
            <h3>${toy.title}</h3>
            <p>${toy.description}</p>
            <p><strong>Ціна:</strong> ${toy.price} грн</p>
            <p class="bonus-tag">🎁 +${bonus} бонусів</p>
            <button class="buy-btn" data-id="${toy.id}" data-title="${toy.title.replace(/"/g, '&quot;')}" data-price="${toy.price}" data-image="${toy.image}" data-bonus="${bonus}">Купити</button>
        `;
        
        container.appendChild(cardElement);
    });
}

if (container) {
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

            allToysData = toys;
            renderToys(allToysData);
        })
        .catch(error => {
            container.innerHTML = `\n<h2 style="color:red;">Помилка підключення: ${error.message}</h2>\n<p>Перевір, чи правильно названо файл toys.json та чи він лежить у тій самій папці.</p>\n`;
        });
}

// ================= ПОШУК (SEARCH LOGIC) =================
const searchInput = document.getElementById('searchInput');
if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        const filteredToys = allToysData.filter(toy => 
            toy.title.toLowerCase().includes(query) || 
            toy.description.toLowerCase().includes(query)
        );
        renderToys(filteredToys);
    });
}

// ================= КОШИК (CART LOGIC) =================
let cart = JSON.parse(localStorage.getItem('cart')) || [];

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function updateCartUI() {
    const cartBadge = document.getElementById('cartBadge');
    if (cartBadge) {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartBadge.textContent = totalItems;
        if (totalItems > 0) {
            cartBadge.classList.add('show');
        } else {
            cartBadge.classList.remove('show');
        }
    }

    const cartItemsContainer = document.getElementById('cartItemsContainer');
    const cartTotalPrice = document.getElementById('cartTotalPrice');
    const cartTotalBonus = document.getElementById('cartTotalBonus');
    
    if (cartItemsContainer) {
        cartItemsContainer.innerHTML = '';
        let total = 0;
        let totalBonuses = 0;

        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p class="empty-cart" style="text-align: center; margin: 20px 0; font-family: \'Sniglet\', cursive;">Ваш кошик порожній</p>';
            if (cartTotalBonus) cartTotalBonus.parentElement.style.display = 'none';
        } else {
            cart.forEach(item => {
                total += item.price * item.quantity;
                totalBonuses += item.bonus * item.quantity;
                const cartItem = document.createElement('div');
                cartItem.className = 'cart-item';
                cartItem.innerHTML = `
                    <img src="${item.image}" alt="${item.title}" class="cart-item-img">
                    <div class="cart-item-info">
                        <h4>${item.title}</h4>
                        <p>${item.price} грн <span style="color:#ff9f43; font-size: 12px; margin-left:5px;">(🎁 +${item.bonus})</span></p>
                        <div class="cart-item-controls">
                            <button class="qty-btn minus" data-id="${item.id}">-</button>
                            <span>${item.quantity}</span>
                            <button class="qty-btn plus" data-id="${item.id}">+</button>
                        </div>
                    </div>
                    <button class="remove-btn" data-id="${item.id}">🗑️</button>
                `;
                cartItemsContainer.appendChild(cartItem);
            });
            if (cartTotalBonus) {
                cartTotalBonus.textContent = totalBonuses;
                cartTotalBonus.parentElement.style.display = 'block';
            }
        }
        
        if (cartTotalPrice) {
            cartTotalPrice.textContent = total;
        }
    }
}

function addToCart(id, title, price, image, bonus) {
    const existingItem = cart.find(item => item.id == id);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ id, title, price, image, quantity: 1, bonus: parseInt(bonus) });
    }
    saveCart();
    updateCartUI();
    
    // Show toast (works on both pages)
    let toast = document.getElementById('toastNotification');
    if (!toast) {
        const toastHTML = `
            <div class="toast-notification" id="toastNotification">
                <div class="toast-icon">✨</div>
                <div class="toast-message" id="toastMessage"></div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', toastHTML);
        toast = document.getElementById('toastNotification');
    }
    const toastMsg = document.getElementById('toastMessage');
    toastMsg.textContent = 'Товар додано до кошика!';
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

function changeQuantity(id, change) {
    const item = cart.find(item => item.id == id);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            cart = cart.filter(i => i.id != id);
        }
        saveCart();
        updateCartUI();
    }
}

function removeFromCart(id) {
    cart = cart.filter(item => item.id != id);
    saveCart();
    updateCartUI();
}

function checkout() {
    if (cart.length === 0) return;
    
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) {
        alert("Будь ласка, увійдіть або зареєструйтесь для оформлення замовлення!");
        document.getElementById('cartOverlay').classList.remove('active');
        const authOverlay = document.getElementById('authOverlay');
        if (authOverlay) authOverlay.classList.add('active');
        return;
    }
    
    let totalBonusesEarned = 0;
    cart.forEach(item => {
        totalBonusesEarned += item.bonus * item.quantity;
        user.orders.push({
            id: item.id,
            title: item.title,
            image: item.image,
            price: item.price,
            date: new Date().toLocaleDateString()
        });
    });
    
    user.bonuses += totalBonusesEarned;
    // Calculate new discount based on total bonuses (e.g., 1% per 100 bonuses, max 15%)
    user.discount = Math.min(15, Math.floor(user.bonuses / 100));
    
    localStorage.setItem('currentUser', JSON.stringify(user));
    
    cart = [];
    saveCart();
    updateCartUI();
    
    document.getElementById('cartOverlay').classList.remove('active');
    
    let toast = document.getElementById('toastNotification');
    if (toast) {
        const toastMsg = document.getElementById('toastMessage');
        toastMsg.textContent = `Замовлення оформлено! Нараховано ${totalBonusesEarned} бонусів 🎁`;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 4000);
    } else {
        alert(`Замовлення оформлено! Нараховано ${totalBonusesEarned} бонусів 🎁`);
    }
}

// Add Cart Modal to DOM
const cartModalHTML = `
    <div class="auth-overlay" id="cartOverlay">
        <div class="auth-modal cart-modal-custom">
            <div id="closeCartBtn" class="close-btn-auth"></div>
            <h2>Кошик</h2>
            <div class="cart-items" id="cartItemsContainer"></div>
            <div class="cart-total" style="text-align: right; margin-top: 20px; font-size: 18px; font-family: 'Montserrat', sans-serif;">
                <strong>Разом: <span id="cartTotalPrice">0</span> грн</strong>
                <p style="color: #ff9f43; font-size: 14px; margin-top: 5px;">Нарахується бонусів: <span id="cartTotalBonus">0</span> 🎁</p>
            </div>
            <button class="auth-submit-btn" id="checkoutBtn" style="width: 100%; margin-top: 15px;">Оформити замовлення</button>
        </div>
    </div>
`;
document.body.insertAdjacentHTML('beforeend', cartModalHTML);

// Add Profile Modal to DOM
const profileModalHTML = `
    <div class="auth-overlay" id="profileOverlay">
        <div class="auth-modal profile-modal">
            <div id="closeProfileBtn" class="close-btn-auth"></div>
            <h2>Картка Клієнта</h2>
            <div class="profile-header">
                <h3 id="profileName" style="font-family: 'Montserrat', sans-serif; color: #bd3c9e;">Ім'я</h3>
            </div>
            <div class="profile-stats">
                <div class="stat-box">
                    <h4>Мої бонуси</h4>
                    <p>🎁 <span id="profileBonuses">0</span></p>
                </div>
                <div class="stat-box">
                    <h4>Моя знижка</h4>
                    <p>🔥 <span id="profileDiscount">0</span>%</p>
                </div>
            </div>
            <h3 style="font-family: 'Sniglet', cursive; color: #8f36a8; margin-bottom: 10px;">Історія замовлень</h3>
            <div class="order-history" id="orderHistoryContainer">
                <!-- Order items go here -->
            </div>
            <button class="auth-submit-btn logout-btn" id="logoutBtn" style="width: 100%;">Вийти з акаунту</button>
        </div>
    </div>
`;
document.body.insertAdjacentHTML('beforeend', profileModalHTML);

function openProfileModal() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) return;
    
    document.getElementById('profileName').textContent = user.name;
    document.getElementById('profileBonuses').textContent = user.bonuses;
    document.getElementById('profileDiscount').textContent = user.discount;
    
    const ordersContainer = document.getElementById('orderHistoryContainer');
    ordersContainer.innerHTML = '';
    
    if (user.orders.length === 0) {
        ordersContainer.innerHTML = '<p style="text-align:center; color:#999; font-family:\'Montserrat\', sans-serif;">Ви ще нічого не замовляли</p>';
    } else {
        // Reverse array to show newest first
        const sortedOrders = [...user.orders].reverse();
        sortedOrders.forEach(order => {
            const el = document.createElement('div');
            el.className = 'order-item';
            el.innerHTML = `
                <img src="${order.image}" alt="${order.title}">
                <div style="flex-grow: 1;">
                    <div style="font-family: 'Montserrat', sans-serif; font-size: 14px; color: #333; font-weight: bold;">${order.title}</div>
                    <div style="font-size: 12px; color: #888;">${order.date}</div>
                </div>
                <div style="font-family: 'Montserrat', sans-serif; font-weight: bold; color: #bd3c9e;">${order.price} грн</div>
            `;
            ordersContainer.appendChild(el);
        });
    }
    
    document.getElementById('profileOverlay').classList.add('active');
}

// Event listeners for cart & profile actions
document.body.addEventListener('click', (e) => {
    // Open Cart
    if (e.target.closest('#cartIconBtn')) {
        document.getElementById('cartOverlay').classList.add('active');
        updateCartUI();
    }
    
    // Close Cart
    if (e.target.closest('#closeCartBtn') || e.target.id === 'cartOverlay') {
        document.getElementById('cartOverlay').classList.remove('active');
    }
    
    // Close Profile
    if (e.target.closest('#closeProfileBtn') || e.target.id === 'profileOverlay') {
        document.getElementById('profileOverlay').classList.remove('active');
    }
    
    // Logout
    if (e.target.id === 'logoutBtn') {
        localStorage.removeItem('currentUser');
        document.getElementById('profileOverlay').classList.remove('active');
        const userIcon = document.getElementById('userIconBtn');
        if (userIcon) userIcon.classList.remove('logged-in');
        
        let toast = document.getElementById('toastNotification');
        if (toast) {
            const toastMsg = document.getElementById('toastMessage');
            toastMsg.textContent = 'Ви вийшли з акаунту';
            toast.classList.add('show');
            setTimeout(() => toast.classList.remove('show'), 3000);
        }
    }
    
    // Checkout
    if (e.target.id === 'checkoutBtn') {
        checkout();
    }
    
    // Add to cart from catalog
    if (e.target.classList.contains('buy-btn')) {
        const id = e.target.dataset.id;
        const title = e.target.dataset.title;
        const price = parseInt(e.target.dataset.price);
        const image = e.target.dataset.image;
        const bonus = e.target.dataset.bonus;
        addToCart(id, title, price, image, bonus);
    }
    
    // Cart quantities
    if (e.target.classList.contains('qty-btn')) {
        const id = e.target.dataset.id;
        if (e.target.classList.contains('minus')) {
            changeQuantity(id, -1);
        } else if (e.target.classList.contains('plus')) {
            changeQuantity(id, 1);
        }
    }
    
    // Remove from cart
    if (e.target.classList.contains('remove-btn')) {
        const id = e.target.dataset.id;
        removeFromCart(id);
    }
});

// Initial UI update
document.addEventListener('DOMContentLoaded', updateCartUI);
// Також оновлюємо одразу на випадок, якщо DOMContentLoaded вже спрацював
updateCartUI();
