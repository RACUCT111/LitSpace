/**
 * ============================================
 * ЭЛЕКТРОННАЯ БИБЛИОТЕКА - ФРОНТЕНД
 * С ИНТЕГРАЦИЕЙ GOOGLE BOOKS API
 * ============================================
 */

// ========== АВТОРИЗАЦИЯ (МОДАЛЬНОЕ ОКНО) ==========
let currentUser = JSON.parse(localStorage.getItem("currentUser"));
let users = JSON.parse(localStorage.getItem("users")) || [];
let selectedAvatar = "https://i.pravatar.cc/150?img=1";

if (users.length === 0) {
    users.push({
        id: "1",
        username: "reader",
        email: "reader@mail.com",
        password: "123",
        avatar: "https://i.pravatar.cc/150?img=1",
        readingProgress: {},
        favorites: []
    });
    localStorage.setItem("users", JSON.stringify(users));
}

function updateAuthUI() {
    const authButtons = document.getElementById("authButtons");
    const userInfo = document.getElementById("userInfo");
    const userName = document.getElementById("userName");
    const userAvatar = document.getElementById("userAvatar");

    if (currentUser) {
        if (authButtons) authButtons.style.display = "none";
        if (userInfo) userInfo.style.display = "flex";
        if (userName) userName.textContent = currentUser.username;
        if (userAvatar) userAvatar.src = currentUser.avatar || "https://i.pravatar.cc/150?img=1";
    } else {
        if (authButtons) authButtons.style.display = "flex";
        if (userInfo) userInfo.style.display = "none";
    }
}

function showAuthModal() {
    document.getElementById("authModal").classList.add("active");
    loadAvatars();
}

function hideAuthModal() {
    document.getElementById("authModal").classList.remove("active");
}

function loadAvatars() {
    const grid = document.getElementById("avatarsGrid");
    if (!grid) return;
    grid.innerHTML = "";
    for (let i = 1; i <= 9; i++) {
        const img = document.createElement("img");
        img.src = `https://i.pravatar.cc/150?img=${i}`;
        img.className = "avatar-option";
        img.onclick = function() {
            document.querySelectorAll(".avatar-option").forEach(a => a.classList.remove("selected"));
            this.classList.add("selected");
            selectedAvatar = this.src;
        };
        grid.appendChild(img);
    }
    document.querySelector(".avatar-option")?.classList.add("selected");
}

document.getElementById("showLoginBtn")?.addEventListener("click", () => {
    document.querySelector('.auth-tab[data-tab="login"]').click();
    showAuthModal();
});
document.getElementById("showRegisterBtn")?.addEventListener("click", () => {
    document.querySelector('.auth-tab[data-tab="register"]').click();
    showAuthModal();
});
document.getElementById("closeAuthModal")?.addEventListener("click", hideAuthModal);
document.getElementById("authModal")?.addEventListener("click", (e) => {
    if (e.target === document.getElementById("authModal")) hideAuthModal();
});

document.querySelectorAll(".auth-tab").forEach(tab => {
    tab.addEventListener("click", () => {
        document.querySelectorAll(".auth-tab").forEach(t => t.classList.remove("active"));
        tab.classList.add("active");
        document.getElementById("loginForm").classList.toggle("active", tab.dataset.tab === "login");
        document.getElementById("registerForm").classList.toggle("active", tab.dataset.tab === "register");
    });
});

document.getElementById("doLoginBtn")?.addEventListener("click", () => {
    const username = document.getElementById("loginUsername").value;
    const password = document.getElementById("loginPassword").value;
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
        currentUser = { id: user.id, username: user.username, avatar: user.avatar };
        localStorage.setItem("currentUser", JSON.stringify(currentUser));
        updateAuthUI();
        hideAuthModal();
        location.reload();
    } else {
        alert("Неверное имя или пароль");
    }
});

document.getElementById("doRegisterBtn")?.addEventListener("click", () => {
    const username = document.getElementById("regUsername").value;
    const email = document.getElementById("regEmail").value;
    const password = document.getElementById("regPassword").value;
    const confirm = document.getElementById("regConfirmPassword").value;

    if (!username || !email || !password) return alert("Заполните все поля");
    if (password !== confirm) return alert("Пароли не совпадают");
    if (users.find(u => u.username === username)) return alert("Пользователь уже существует");

  const newUser = {
    id: Date.now().toString(),
    username, email, password,
    avatar: selectedAvatar,
    readingProgress: {},
    favorites: [],
    regDate: new Date().toLocaleDateString(),  // ← ДОБАВЬ ЭТУ СТРОКУ
    bio: "",  // ← ДОБАВЬ ЭТУ СТРОКУ
    favoriteGenres: []  // ← ДОБАВЬ ЭТУ СТРОКУ
};
    users.push(newUser);
    localStorage.setItem("users", JSON.stringify(users));
    currentUser = { id: newUser.id, username: newUser.username, avatar: newUser.avatar };
    localStorage.setItem("currentUser", JSON.stringify(currentUser));
    updateAuthUI();
    hideAuthModal();
    location.reload();
});

document.getElementById("logoutBtn")?.addEventListener("click", () => {
    localStorage.removeItem("currentUser");
    location.reload();
});

updateAuthUI();

const API_BASE_URL = 'https://www.googleapis.com/books/v1';
const API_KEY = 'AIzaSyAezvbSFgYKSbHmcs0_p5sZP2VUxJyTHxg';

// Глобальные переменные
let allBooks = [];
let filteredBooks = [];
let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
let recent = JSON.parse(localStorage.getItem("recent")) || [];
let isLoading = false;
let currentGenre = "Все книги";

// DOM элементы
const sliderTrack = document.getElementById("sliderTrack");
const booksGrid = document.getElementById("booksGrid");
const recentList = document.getElementById("recentList");
const favoritesList = document.getElementById("favoritesList");
const searchInput = document.getElementById("searchInput");
const clearSearchBtn = document.getElementById("clearSearch");
const readCountSpan = document.getElementById("readCount");

// ========== ПЕРЕВОДЫ ЖАНРОВ И ЗАПРОСОВ ==========
const genreTranslations = {
    ky: {
        "Все книги": "Бардык китептер",
        "Классика": "Классика",
        "Роман": "Роман",
        "Детектив": "Детектив",
        "Фантастика": "Фантастика",
        "Фэнтези": "Фэнтези",
        "Триллер": "Триллер",
        "Ужасы": "Коркунучтуу",
        "История": "Тарых",
        "Биография": "Өмүр баян",
        "Поэзия": "Поэзия",
        "Драма": "Драма",
        "Комедия": "Комедия",
        "Приключения": "Приключения",
        "Детские": "Балдар китептери",
        "Наука": "Илим",
        "Психология": "Психология",
        "Философия": "Философия",
        "Бизнес": "Бизнес",
        "Саморазвитие": "Өзүн-өзү өнүктүрүү",
        "Путешествия": "Саякат",
        "Кулинария": "Ашкана",
        "Искусство": "Искусство",
        "Музыка": "Музыка",
        "Спорт": "Спорт",
        "Мистика": "Мистика",
        "Постапокалипсис": "Постапокалипсис",
        "Киберпанк": "Киберпанк",
        "Стимпанк": "Стимпанк",
        "Любовный роман": "Сүйүү романы",
        "Документальная": "Документалдуу",
        "Новелла": "Новелла",
        "Сказки": "Жомоктор",
        "Мифы и легенды": "Мифтер жана уламыштар",
        "Комиксы": "Комикстер"
    },
    ru: {
        "Все книги": "Все книги",
        "Классика": "Классика",
        "Роман": "Роман",
        "Детектив": "Детектив",
        "Фантастика": "Фантастика",
        "Фэнтези": "Фэнтези",
        "Триллер": "Триллер",
        "Ужасы": "Ужасы",
        "История": "История",
        "Биография": "Биография",
        "Поэзия": "Поэзия",
        "Драма": "Драма",
        "Комедия": "Комедия",
        "Приключения": "Приключения",
        "Детские": "Детские",
        "Наука": "Наука",
        "Психология": "Психология",
        "Философия": "Философия",
        "Бизнес": "Бизнес",
        "Саморазвитие": "Саморазвитие",
        "Путешествия": "Путешествия",
        "Кулинария": "Кулинария",
        "Искусство": "Искусство",
        "Музыка": "Музыка",
        "Спорт": "Спорт",
        "Мистика": "Мистика",
        "Постапокалипсис": "Постапокалипсис",
        "Киберпанк": "Киберпанк",
        "Стимпанк": "Стимпанк",
        "Любовный роман": "Любовный роман",
        "Документальная": "Документальная",
        "Новелла": "Новелла",
        "Сказки": "Сказки",
        "Мифы и легенды": "Мифы и легенды",
        "Комиксы": "Комиксы"
    },
    en: {
        "Все книги": "All Books",
        "Классика": "Classics",
        "Роман": "Romance",
        "Детектив": "Detective",
        "Фантастика": "Sci-Fi",
        "Фэнтези": "Fantasy",
        "Триллер": "Thriller",
        "Ужасы": "Horror",
        "История": "History",
        "Биография": "Biography",
        "Поэзия": "Poetry",
        "Драма": "Drama",
        "Комедия": "Comedy",
        "Приключения": "Adventure",
        "Детские": "Children's",
        "Наука": "Science",
        "Психология": "Psychology",
        "Философия": "Philosophy",
        "Бизнес": "Business",
        "Саморазвитие": "Self Help",
        "Путешествия": "Travel",
        "Кулинария": "Cooking",
        "Искусство": "Art",
        "Музыка": "Music",
        "Спорт": "Sports",
        "Мистика": "Mystery",
        "Постапокалипсис": "Post Apocalyptic",
        "Киберпанк": "Cyberpunk",
        "Стимпанк": "Steampunk",
        "Любовный роман": "Love Story",
        "Документальная": "Documentary",
        "Новелла": "Novella",
        "Сказки": "Fairy Tales",
        "Мифы и легенды": "Myths & Legends",
        "Комиксы": "Comics"
    }
};

const genreQueries = {
    "Классика": "classic literature",
    "Роман": "romance novel",
    "Детектив": "detective",
    "Фантастика": "science fiction",
    "Фэнтези": "fantasy",
    "Триллер": "thriller",
    "Ужасы": "horror",
    "История": "history",
    "Биография": "biography",
    "Поэзия": "poetry",
    "Драма": "drama",
    "Комедия": "comedy",
    "Приключения": "adventure",
    "Детские": "children books",
    "Наука": "science",
    "Психология": "psychology",
    "Философия": "philosophy",
    "Бизнес": "business",
    "Саморазвитие": "self help",
    "Путешествия": "travel",
    "Кулинария": "cooking",
    "Искусство": "art",
    "Музыка": "music",
    "Спорт": "sports",
    "Мистика": "mystery",
    "Постапокалипсис": "post apocalyptic",
    "Киберпанк": "cyberpunk",
    "Стимпанк": "steampunk",
    "Любовный роман": "love story",
    "Документальная": "documentary",
    "Новелла": "novella",
    "Сказки": "fairy tales",
    "Мифы и легенды": "mythology",
    "Комиксы": "comics"
};

const genreIcons = {
    "Все книги": "fas fa-book",
    "Классика": "fas fa-landmark",
    "Роман": "fas fa-heart",
    "Детектив": "fas fa-search",
    "Фантастика": "fas fa-rocket",
    "Фэнтези": "fas fa-dragon",
    "Триллер": "fas fa-skull",
    "Ужасы": "fas fa-ghost",
    "История": "fas fa-clock",
    "Биография": "fas fa-user",
    "Поэзия": "fas fa-feather-alt",
    "Драма": "fas fa-mask",
    "Комедия": "fas fa-laugh",
    "Приключения": "fas fa-compass",
    "Детские": "fas fa-child",
    "Наука": "fas fa-flask",
    "Психология": "fas fa-brain",
    "Философия": "fas fa-gem",
    "Бизнес": "fas fa-chart-line",
    "Саморазвитие": "fas fa-seedling",
    "Путешествия": "fas fa-plane",
    "Кулинария": "fas fa-utensils",
    "Искусство": "fas fa-palette",
    "Музыка": "fas fa-music",
    "Спорт": "fas fa-futbol",
    "Мистика": "fas fa-moon",
    "Постапокалипсис": "fas fa-radiation",
    "Киберпанк": "fas fa-microchip",
    "Стимпанк": "fas fa-cogs",
    "Любовный роман": "fas fa-gift",
    "Документальная": "fas fa-video",
    "Новелла": "fas fa-file-alt",
    "Сказки": "fas fa-star",
    "Мифы и легенды": "fas fa-scroll",
    "Комиксы": "fas fa-comic"
};

const genreList = [
    "Все книги", "Классика", "Роман", "Детектив", "Фантастика", "Фэнтези",
    "Триллер", "Ужасы", "История", "Биография", "Поэзия", "Драма", "Комедия",
    "Приключения", "Детские", "Наука", "Психология", "Философия", "Бизнес",
    "Саморазвитие", "Путешествия", "Кулинария", "Искусство", "Музыка", "Спорт",
    "Мистика", "Постапокалипсис", "Киберпанк", "Стимпанк", "Любовный роман",
    "Документальная", "Новелла", "Сказки", "Мифы и легенды", "Комиксы"
];

let currentLang = localStorage.getItem("language") || "ru";

// ========== ПЕРЕВОДЫ ДЛЯ СТРАНИЦЫ "О НАС" ==========
const aboutTranslations = {
   // Для КЫРГЫЗСКОГО (ky)
about_desc1: "<strong>LitSpace</strong> — бул заманбап электрондук китепкана, окуганды жакшы көргөндөр үчүн түзүлгөн. Бул жерде миңдеген китептерди таба аласыз: классикалык адабияттан баштап заманбап бестселлерлерге чейин, фантастикадан детективдерге чейин. Баары <strong style='color: #75C9C8;'>бекер</strong> жана каттоосуз.",
about_desc2: "Биз дүйнүнүн бардык чыгармаларын чогулттук, ошондуктан сиз каалаган убакта жана каалаган жерде кызыктуу окуяларга сүңгүй аласыз. Китептерди <strong>сакталган</strong> бөлүмүнө кошуңуз, <strong>тарых</strong> бөлүмүнөн окууну улантыңыз жана күн сайын жаңы авторлорду ачыңыз.",
about_desc3: "Биздин команда каталогду дайыма жаңыртып, жаңы жанрларды кошуп, издөөнүн ыңгайлуулугун жакшыртып турат. Биз окууну андан да жеткиликтүү жана жагымдуу кылгыбыз келет. LitSpace — бул жөн гана китепкана эмес, бул сиздин шыктандыруу жана жаңы ачылыштар үчүн жеке мейкиндигиңиз.",
about_desc4: "Биздин окурмандар коомчулугуна кошулуңуз! Таасирлериңиз менен бөлүшүңүз, досторуңузга китептерди сунуштаңыз жана LitSpace менен бирге адабият дүйнөсүн ачыңыз.",

// Для РУССКОГО (ru)
about_desc1: "<strong>LitSpace</strong> — это современная электронная библиотека, созданная для тех, кто любит читать. Здесь ты найдёшь тысячи книг: от классической литературы до современных бестселлеров, от фантастики до детективов. И всё это абсолютно <strong style='color: #75C9C8;'>бесплатно</strong> и без регистрации.",
about_desc2: "Мы собрали произведения со всего мира, чтобы ты мог погружаться в увлекательные истории в любое время и в любом месте. Добавляй книги в <strong>избранное</strong>, продолжай чтение из <strong>истории</strong> и открывай новых авторов каждый день.",
about_desc3: "Наша команда постоянно обновляет каталог, добавляет новые жанры и улучшает удобство поиска. Мы хотим, чтобы чтение стало ещё доступнее и приятнее. LitSpace — это не просто библиотека, это твоё личное пространство для вдохновения и новых открытий.",
about_desc4: "Присоединяйся к нашему сообществу читателей! Делитесь впечатлениями, рекомендуйте книги друзьям и открывайте для себя мир литературы вместе с LitSpace.",

// Для АНГЛИЙСКОГО (en)
about_desc1: "<strong>LitSpace</strong> is a modern digital library created for those who love to read. Here you'll find thousands of books: from classic literature to modern bestsellers, from science fiction to detective stories. All absolutely <strong style='color: #75C9C8;'>free</strong> and without registration.",
about_desc2: "We have collected works from around the world so you can immerse yourself in fascinating stories anytime, anywhere. Add books to <strong>favorites</strong>, continue reading from <strong>history</strong>, and discover new authors every day.",
about_desc3: "Our team constantly updates the catalog, adds new genres, and improves search convenience. We want reading to become even more accessible and enjoyable. LitSpace is not just a library, it's your personal space for inspiration and new discoveries.",
about_desc4: "Join our community of readers! Share your impressions, recommend books to friends, and discover the world of literature together with LitSpace.",
};

// ========== ФУНКЦИЯ ДЛЯ ОБНОВЛЕНИЯ СТРАНИЦЫ "О НАС" ==========
function updateAboutPage() {
    const aboutData = aboutTranslations[currentLang];
    if (!aboutData) return;

    const aboutTitle = document.querySelector('#page-about [data-key="about_title"]');
    const aboutDesc1 = document.querySelector('#page-about [data-key="about_desc1"]');
    const aboutDesc2 = document.querySelector('#page-about [data-key="about_desc2"]');
    const aboutQuote = document.querySelector('#page-about [data-key="about_quote"]');
    const aboutQuoteAuthor = document.querySelector('#page-about [data-key="about_quote_author"]');
    const contactTitle = document.querySelector('#page-about [data-key="contact_title"]');
    const contactNote = document.querySelector('#page-about [data-key="contact_note"]');

    if (aboutTitle) aboutTitle.innerHTML = aboutData.about_title;
    if (aboutDesc1) aboutDesc1.innerHTML = aboutData.about_desc1;
    if (aboutDesc2) aboutDesc2.innerHTML = aboutData.about_desc2;
    if (aboutQuote) aboutQuote.innerHTML = aboutData.about_quote;
    if (aboutQuoteAuthor) aboutQuoteAuthor.innerHTML = aboutData.about_quote_author;
    if (contactTitle) contactTitle.innerHTML = aboutData.contact_title;
    if (contactNote) contactNote.innerHTML = aboutData.contact_note;
}

// ========== ОТРИСОВКА ЖАНРОВ ==========
function renderGenres() {
    const genresGrid = document.getElementById("genresGrid");
    if (!genresGrid) return;

    genresGrid.innerHTML = "";

    genreList.forEach(genreKey => {
        const translatedName = genreTranslations[currentLang]?.[genreKey] || genreKey;
        const icon = genreIcons[genreKey] || "fas fa-tag";

        const genreCard = document.createElement("div");
        genreCard.className = `genre-card ${currentGenre === genreKey ? "active" : ""}`;
        genreCard.setAttribute("data-genre-key", genreKey);
        genreCard.innerHTML = `
            <i class="${icon}"></i>
            <span>${translatedName}</span>
        `;

        genreCard.addEventListener("click", () => {
            document.querySelectorAll(".genre-card").forEach(card => {
                card.classList.remove("active");
            });
            genreCard.classList.add("active");
            loadBooksByGenre(genreKey);
        });

        genresGrid.appendChild(genreCard);
    });
}

async function loadBooksByGenre(genreKey) {
    currentGenre = genreKey;

    const translatedName = genreTranslations[currentLang]?.[genreKey] || genreKey;
    const activeGenreTitle = document.getElementById("activeGenreTitle");
    if (activeGenreTitle) {
        const icon = genreIcons[genreKey] || "fas fa-book";
        activeGenreTitle.innerHTML = `<i class="${icon}"></i> ${translatedName}`;
    }

    if (genreKey === "Все книги") {
        await loadPopularBooks();
        return;
    }

    const query = genreQueries[genreKey];
    if (!query) {
        await loadPopularBooks();
        return;
    }

    showLoading(booksGrid, `Загрузка книг жанра "${translatedName}"...`);

    try {
        let searchQuery = query;

        if (currentLang === 'ru') {
            searchQuery = `${query}+lang:ru`;
        } else if (currentLang === 'ky') {
            searchQuery = `${query}+lang:ru`;
        } else {
            searchQuery = `${query}+lang:en`;
        }

        const response = await fetch(
            `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(searchQuery)}&maxResults=30&key=${API_KEY}`
        );
        const data = await response.json();

        if (data.items && data.items.length > 0) {
            allBooks = data.items.map(item => ({
                id: item.id,
                title: item.volumeInfo.title || 'Без названия',
                authors: item.volumeInfo.authors || ['Автор неизвестен'],
                description: item.volumeInfo.description || '',
                coverImage: item.volumeInfo.imageLinks?.thumbnail || null,
                publishedDate: item.volumeInfo.publishedDate || '',
                pageCount: item.volumeInfo.pageCount || 0,
                previewLink: item.volumeInfo.previewLink || null,
                language: item.volumeInfo.language || 'ru'
            }));
            filteredBooks = [...allBooks];
            renderBooksGrid(filteredBooks);
        } else {
            booksGrid.innerHTML = `<div class="loading-spinner">😔 Книги жанра "${translatedName}" не найдены</div>`;
        }
    } catch (error) {
        console.error("Ошибка загрузки книг по жанру:", error);
        booksGrid.innerHTML = '<div class="loading-spinner">❌ Ошибка загрузки. Попробуйте позже.</div>';
    }
}

// ========== СБРОС ФИЛЬТРА ЖАНРОВ ==========
function clearGenresFilter() {
    currentGenre = "Все книги";
    renderGenres();
    loadPopularBooks();

    const translatedName = genreTranslations[currentLang]?.["Все книги"] || "Все книги";
    const activeGenreTitle = document.getElementById("activeGenreTitle");
    if (activeGenreTitle) {
        activeGenreTitle.innerHTML = `<i class="fas fa-book"></i> ${translatedName}`;
    }
}

async function loadPopularBooks() {
    showLoading(sliderTrack, "Загрузка...");
    try {
        let searchQuery;

        if (currentLang === 'ru') {
            searchQuery = "книги бестселлеры+lang:ru";
        } else if (currentLang === 'ky') {
            searchQuery = "китептер+lang:ru";
        } else {
            const defaultQueries = ["bestsellers", "fiction", "popular+books"];
            searchQuery = defaultQueries[Math.floor(Math.random() * defaultQueries.length)] + "+lang:en";
        }

        const response = await fetch(
            `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(searchQuery)}&maxResults=24&key=${API_KEY}`
        );
        const data = await response.json();

        if (data.items && data.items.length > 0) {
            allBooks = data.items.map(item => ({
                id: item.id,
                title: item.volumeInfo.title || 'Без названия',
                authors: item.volumeInfo.authors || ['Автор неизвестен'],
                description: item.volumeInfo.description || '',
                coverImage: item.volumeInfo.imageLinks?.thumbnail || null,
                publishedDate: item.volumeInfo.publishedDate || '',
                pageCount: item.volumeInfo.pageCount || 0,
                previewLink: item.volumeInfo.previewLink || null,
                language: item.volumeInfo.language || 'ru'
            }));
            filteredBooks = [...allBooks];
            renderSlider(filteredBooks.slice(0, 12));
            renderBooksGrid(filteredBooks);
        } else {
            showError();
        }
    } catch (error) {
        console.error("Ошибка загрузки книг:", error);
        showError();
    }
}

async function searchBooks(query) {
    if (!query || query.trim().length === 0) {
        filteredBooks = [...allBooks];
        renderSlider(filteredBooks.slice(0, 12));
        renderBooksGrid(filteredBooks);
        return;
    }

    showLoading(booksGrid, "Поиск книг...");
    showLoading(sliderTrack, "Поиск...");

    try {
        let searchQuery = query;

        if (currentLang === 'ru') {
            searchQuery = `${query}+lang:ru`;
        } else if (currentLang === 'ky') {
            searchQuery = `${query}+lang:ru`;
        } else {
            searchQuery = `${query}+lang:en`;
        }

        const response = await fetch(
            `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(searchQuery)}&maxResults=30&key=${API_KEY}`
        );
        const data = await response.json();

        if (data.items && data.items.length > 0) {
            filteredBooks = data.items.map(item => ({
                id: item.id,
                title: item.volumeInfo.title || 'Без названия',
                authors: item.volumeInfo.authors || ['Автор неизвестен'],
                description: item.volumeInfo.description || '',
                coverImage: item.volumeInfo.imageLinks?.thumbnail || null,
                publishedDate: item.volumeInfo.publishedDate || '',
                pageCount: item.volumeInfo.pageCount || 0,
                previewLink: item.volumeInfo.previewLink || null,
                language: item.volumeInfo.language || 'ru'
            }));
            renderSlider(filteredBooks.slice(0, 12));
            renderBooksGrid(filteredBooks);
        } else {
            booksGrid.innerHTML = '<div class="loading-spinner">😔 Книги не найдены</div>';
        }
    } catch (error) {
        booksGrid.innerHTML = '<div class="loading-spinner">❌ Ошибка загрузки</div>';
    }
}

// ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========
function showLoading(container, message) {
    if (container) {
        container.innerHTML = `<div class="loading-spinner">⏳ ${message}</div>`;
    }
}

function showError() {
    const errorMessage = `
        <div class="loading-spinner" style="text-align: center; padding: 40px;">
            <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: #D62828;"></i>
            <p>Не удалось загрузить книги. Проверьте подключение к серверу.</p>
            <button onclick="location.reload()" style="margin-top: 15px; padding: 8px 20px; background: #75C9C8; color: white; border: none; border-radius: 20px; cursor: pointer;">🔄 Обновить</button>
        </div>
    `;
    if (sliderTrack) sliderTrack.innerHTML = errorMessage;
    if (booksGrid) booksGrid.innerHTML = errorMessage;
}

// ========== СОЗДАНИЕ КАРТОЧКИ КНИГИ ==========
function createBookCard(book) {
    const card = document.createElement("div");
    card.className = "book-card";
    const isFav = favorites.some(f => f.id === book.id);

    const coverUrl = book.coverImage || 'https://via.placeholder.com/220x280/DED9E2/80A1D4?text=📖';

    card.innerHTML = `
        <img src="${coverUrl}" alt="${book.title}" 
             onerror="this.src='https://via.placeholder.com/220x280/DED9E2/80A1D4?text=📖'">
        <button class="fav-star ${isFav ? 'active' : ''}" data-id="${book.id}">${isFav ? "★" : "☆"}</button>
        <h4>${book.title?.substring(0, 40) || 'Без названия'}</h4>
        <span>${book.authors?.[0]?.substring(0, 30) || 'Автор неизвестен'}</span>
    `;

    card.addEventListener("click", (e) => {
        if (e.target.classList.contains("fav-star")) return;
        openBookModal(book);
        addToRecent(book);
    });

    const starBtn = card.querySelector(".fav-star");
    starBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleFavorite(book);
        const isNowFav = favorites.some(f => f.id === book.id);
        starBtn.innerHTML = isNowFav ? "★" : "☆";
        starBtn.classList.toggle("active", isNowFav);
        renderFavorites();
        renderBooksGrid(filteredBooks);
    });

    return card;
}

// ========== ОТОБРАЗИТЬ СЛАЙДЕР ==========
function renderSlider(booksArray) {
    if (!sliderTrack) return;
    sliderTrack.innerHTML = "";

    if (!booksArray || booksArray.length === 0) {
        sliderTrack.innerHTML = '<div class="loading-spinner">Нет книг для отображения</div>';
        return;
    }

    booksArray.slice(0, 12).forEach(book => {
        sliderTrack.appendChild(createBookCard(book));
    });
}

// ========== ОТОБРАЗИТЬ ВСЕ КНИГИ ==========
function renderBooksGrid(booksArray) {
    if (!booksGrid) return;
    booksGrid.innerHTML = "";

    if (!booksArray || booksArray.length === 0) {
        booksGrid.innerHTML = '<div class="loading-spinner">🔍 Начните поиск книг</div>';
        return;
    }

    booksArray.forEach(book => {
        booksGrid.appendChild(createBookCard(book));
    });
}

// ========== ДОБАВИТЬ В ИСТОРИЮ ==========
function addToRecent(book) {
    recent = [book, ...recent.filter(b => b.id !== book.id)].slice(0, 10);
    localStorage.setItem("recent", JSON.stringify(recent));
    renderRecent();
    updateCounter();
}

// ========== ПЕРЕКЛЮЧИТЬ ИЗБРАННОЕ ==========
function toggleFavorite(book) {
    if (favorites.some(f => f.id === book.id)) {
        favorites = favorites.filter(f => f.id !== book.id);
    } else {
        favorites.push(book);
    }
    localStorage.setItem("favorites", JSON.stringify(favorites));
    renderFavorites();
    updateCounter();
}

// ========== ОТОБРАЗИТЬ ИСТОРИЮ ==========
function renderRecent() {
    if (!recentList) return;
    const emptyDiv = document.getElementById("emptyRecent");

    if (recent.length === 0) {
        recentList.innerHTML = "";
        if (emptyDiv) emptyDiv.style.display = "block";
        return;
    }

    if (emptyDiv) emptyDiv.style.display = "none";
    recentList.innerHTML = "";

    recent.forEach(book => {
        const coverUrl = book.coverImage || 'https://via.placeholder.com/60x80/DED9E2/80A1D4?text=📖';
        const div = document.createElement("div");
        div.className = "history-item";

        div.innerHTML = `
            <img src="${coverUrl}" alt="${book.title}" onerror="this.src='https://via.placeholder.com/60x80/DED9E2/80A1D4?text=📖'">
            <div style="flex:1">
                <h4>${book.title?.substring(0, 50) || 'Без названия'}</h4>
                <small style="color:#888">${book.authors?.[0] || 'Автор неизвестен'}</small>
                ${currentUser ? `<div style="font-size: 11px; color: #75C9C8; margin-top: 5px;">📖 Страница ${getSavedPage(book.id)}</div>` : ''}
            </div>
            <button class="continue-reading-btn" data-id="${book.id}">📖 Продолжить</button>
            <button class="remove-btn" data-id="${book.id}">🗑 Удалить</button>
        `;

        div.querySelector(".continue-reading-btn")?.addEventListener("click", (e) => {
            e.stopPropagation();
            window.open(`https://books.google.com/books?id=${book.id}&pg=PA${getSavedPage(book.id)}`, '_blank');
        });

        div.querySelector(".remove-btn")?.addEventListener("click", (e) => {
            e.stopPropagation();
            recent = recent.filter(b => b.id !== book.id);
            localStorage.setItem("recent", JSON.stringify(recent));
            renderRecent();
            updateCounter();
        });

        recentList.appendChild(div);
    });
}

// ========== ОТОБРАЗИТЬ ИЗБРАННОЕ ==========
function renderFavorites() {
    if (!favoritesList) return;
    const emptyDiv = document.getElementById("emptyFavorites");

    if (favorites.length === 0) {
        favoritesList.innerHTML = "";
        if (emptyDiv) emptyDiv.style.display = "block";
        return;
    }

    if (emptyDiv) emptyDiv.style.display = "none";
    favoritesList.innerHTML = "";

    favorites.forEach(book => {
        const coverUrl = book.coverImage || 'https://via.placeholder.com/60x80/DED9E2/80A1D4?text=📖';
        const div = document.createElement("div");
        div.className = "favorite-item";
        div.innerHTML = `
            <img src="${coverUrl}" alt="${book.title}" onerror="this.src='https://via.placeholder.com/60x80/DED9E2/80A1D4?text=📖'">
            <div style="flex:1">
                <h4>${book.title?.substring(0, 50) || 'Без названия'}</h4>
                <small style="color:#888">${book.authors?.[0] || 'Автор неизвестен'}</small>
            </div>
            <button class="remove-btn" data-id="${book.id}">🗑 Удалить</button>
        `;

        div.querySelector(".remove-btn").addEventListener("click", () => {
            favorites = favorites.filter(b => b.id !== book.id);
            localStorage.setItem("favorites", JSON.stringify(favorites));
            renderFavorites();
            renderSlider(filteredBooks);
            renderBooksGrid(filteredBooks);
            updateCounter();
        });

        favoritesList.appendChild(div);
    });
}

// ========== МОДАЛЬНОЕ ОКНО ==========
function openBookModal(book) {
    const modal = document.getElementById("bookModal");
    const modalBody = document.getElementById("modalBody");
    const isFav = favorites.some(f => f.id === book.id);

    const description = book.description ?
        (book.description.length > 300 ? book.description.substring(0, 300) + "..." : book.description) :
        "Описание отсутствует";

    const coverUrl = book.coverImage || 'https://via.placeholder.com/160x220/DED9E2/80A1D4?text=📖';

    if (!modalBody) return;

    if (!document.getElementById('modalStyles')) {
        const style = document.createElement('style');
        style.id = 'modalStyles';
        style.textContent = `
            .modal {
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                backdrop-filter: blur(5px);
                z-index: 1000;
                justify-content: center;
                align-items: center;
            }
            .modal.active {
                display: flex !important;
            }
            .modal-content {
                position: relative;
                max-width: 550px;
                width: 90%;
                max-height: 85vh;
                overflow-y: auto;
                background: transparent;
                border-radius: 28px;
                animation: modalFadeIn 0.3s ease;
            }
            @keyframes modalFadeIn {
                from {
                    opacity: 0;
                    transform: scale(0.9);
                }
                to {
                    opacity: 1;
                    transform: scale(1);
                }
            }
            .modal-content::-webkit-scrollbar {
                width: 6px;
            }
            .modal-content::-webkit-scrollbar-track {
                background: rgba(255,255,255,0.1);
                border-radius: 10px;
            }
            .modal-content::-webkit-scrollbar-thumb {
                background: #75C9C8;
                border-radius: 10px;
            }
            .modal-close {
                position: absolute;
                top: 15px;
                right: 20px;
                font-size: 32px;
                cursor: pointer;
                color: white;
                z-index: 10;
                background: rgba(0,0,0,0.3);
                width: 36px;
                height: 36px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: 0.3s;
            }
            .modal-close:hover {
                background: rgba(0,0,0,0.5);
                transform: rotate(90deg);
            }
            .modal-btn {
                transition: 0.3s;
            }
            .modal-btn:hover {
                transform: translateY(-2px);
                filter: brightness(1.05);
            }
        `;
        document.head.appendChild(style);
    }

    modalBody.innerHTML = `
        <div style="background: linear-gradient(135deg, #80A1D4 0%, #C0B9DD 50%, #DED9E2 100%); border-radius: 28px; padding: 30px 25px 35px 25px; color: white; position: relative;">
            <div style="display: flex; justify-content: center; margin-bottom: 15px;">
                <img src="${coverUrl}" alt="${book.title}" style="width: 160px; height: 220px; object-fit: cover; border-radius: 16px; box-shadow: 0 20px 30px rgba(0,0,0,0.3); border: 3px solid rgba(255,255,255,0.4);" onerror="this.src='https://via.placeholder.com/160x220/DED9E2/80A1D4?text=📖'">
            </div>
            <h2 style="font-size: 24px; margin: 0 0 5px; color: #003049; font-weight: 700; text-align: center;">${book.title || "Без названия"}</h2>
            <p style="font-size: 14px; color: #003049; margin-bottom: 15px; font-weight: 500; text-align: center;">${book.authors?.join(", ") || "Автор неизвестен"}</p>
            
            <div style="background: rgba(255,255,255,0.2); border-radius: 16px; padding: 12px 15px; margin: 12px 0; text-align: left;">
                <p style="font-size: 13px; line-height: 1.5; color: white; margin: 0;"><strong>📖 О книге:</strong><br>${description}</p>
            </div>
            
            <div style="display: flex; justify-content: space-around; margin: 15px 0 20px 0; flex-wrap: wrap; gap: 10px;">
                <div style="text-align: center; background: rgba(255,255,255,0.15); padding: 8px 12px; border-radius: 12px;">
                    <div style="font-size: 18px;">📅</div>
                    <div style="font-size: 10px; opacity: 0.8;">Год</div>
                    <div style="font-size: 12px; font-weight: 600;">${book.publishedDate?.split('-')[0] || "—"}</div>
                </div>
                <div style="text-align: center; background: rgba(255,255,255,0.15); padding: 8px 12px; border-radius: 12px;">
                    <div style="font-size: 18px;">📄</div>
                    <div style="font-size: 10px; opacity: 0.8;">Страниц</div>
                    <div style="font-size: 12px; font-weight: 600;">${book.pageCount || "—"}</div>
                </div>
                <div style="text-align: center; background: rgba(255,255,255,0.15); padding: 8px 12px; border-radius: 12px;">
                    <div style="font-size: 18px;">🌐</div>
                    <div style="font-size: 10px; opacity: 0.8;">Язык</div>
                    <div style="font-size: 12px; font-weight: 600;">${book.language === 'ru' ? 'Русский' : book.language === 'en' ? 'English' : book.language || "Рус"}</div>
                </div>
            </div>
            
            <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
                <button class="modal-btn read" id="modalReadBtn" style="padding: 12px 28px; border: none; border-radius: 40px; cursor: pointer; background: #75C9C8; color: white; font-weight: 600; font-size: 14px; box-shadow: 0 4px 10px rgba(0,0,0,0.2);">
                    📖 Читать книгу
                </button>
                <button class="modal-btn fav" id="modalFavBtn" style="padding: 12px 28px; border: none; border-radius: 40px; cursor: pointer; background: rgba(255,255,255,0.25); color: white; font-weight: 600; font-size: 14px; backdrop-filter: blur(5px);">
                    ${isFav ? "★ В избранном" : "☆ В избранное"}
                </button>
                <button class="modal-btn close" id="modalCloseBtn" style="padding: 12px 28px; border: none; border-radius: 40px; cursor: pointer; background: rgba(0,0,0,0.3); color: white; font-weight: 600; font-size: 14px;">
                    ✖ Закрыть
                </button>
            </div>
        </div>
    `;

    modal.classList.add("active");
    document.body.style.overflow = "hidden";

    document.getElementById("modalReadBtn")?.addEventListener("click", () => {
        addToRecent(book);
        modal.classList.remove("active");
        document.body.style.overflow = "";
        if (book.previewLink) {
            window.open(book.previewLink, '_blank');
        } else {
            window.open(`https://books.google.com/books?q=${encodeURIComponent(book.title)}+${encodeURIComponent(book.authors?.[0] || '')}`, '_blank');
        }
    });

    document.getElementById("modalFavBtn")?.addEventListener("click", () => {
        toggleFavorite(book);
        modal.classList.remove("active");
        document.body.style.overflow = "";
        openBookModal(book);
    });

    document.getElementById("modalCloseBtn")?.addEventListener("click", () => {
        modal.classList.remove("active");
        document.body.style.overflow = "";
    });
}

// ========== СЧЁТЧИК ==========
function updateCounter() {
    if (readCountSpan) {
        readCountSpan.textContent = recent.length;
    }
}

// ========== НАВИГАЦИЯ ==========
document.querySelectorAll(".nav-link").forEach(link => {
    link.addEventListener("click", (e) => {
        e.preventDefault();
        const pageName = link.getAttribute("data-page");

        document.querySelectorAll(".nav-link").forEach(l => l.classList.remove("active"));
        link.classList.add("active");

        document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
        const targetPage = document.getElementById(`page-${pageName}`);
        if (targetPage) targetPage.classList.add("active");

        if (pageName === "books") {
            renderBooksGrid(filteredBooks);
            renderGenres();
        }
        if (pageName === "recent") renderRecent();
        if (pageName === "favorites") renderFavorites();
        if (pageName === "profile") loadProfile(); // ← вот эта строка

        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
});

// ========== ПОИСК ==========
let searchTimeout;
if (searchInput) {
    searchInput.addEventListener("input", (e) => {
        clearTimeout(searchTimeout);
        const query = e.target.value.trim();

        if (clearSearchBtn) {
            clearSearchBtn.style.display = query.length > 0 ? "block" : "none";
        }

        searchTimeout = setTimeout(() => {
            searchBooks(query);
        }, 500);
    });
}

if (clearSearchBtn) {
    clearSearchBtn.addEventListener("click", () => {
        if (searchInput) searchInput.value = "";
        clearSearchBtn.style.display = "none";
        loadPopularBooks();
    });
}

// ========== СЛАЙДЕР ==========
document.getElementById("sliderLeft")?.addEventListener("click", () => {
    if (sliderTrack) sliderTrack.scrollBy({ left: -250, behavior: "smooth" });
});
document.getElementById("sliderRight")?.addEventListener("click", () => {
    if (sliderTrack) sliderTrack.scrollBy({ left: 250, behavior: "smooth" });
});

// ========== КНОПКИ ==========
document.getElementById("viewAllBtn")?.addEventListener("click", () => {
    document.querySelector('[data-page="books"]')?.click();
});

document.getElementById("continueBtn")?.addEventListener("click", () => {
    if (recent.length > 0) {
        openBookModal(recent[0]);
    } else {
        alert("📖 Сначала выберите книгу для чтения");
    }
});

document.getElementById("goToBooksBtn")?.addEventListener("click", () => {
    document.querySelector('[data-page="books"]')?.click();
});

document.getElementById("goToBooksFavBtn")?.addEventListener("click", () => {
    document.querySelector('[data-page="books"]')?.click();
});

document.getElementById("clearGenresBtn")?.addEventListener("click", () => {
    clearGenresFilter();
});

// ========== КНОПКИ СТРАНИЦЫ ЧТЕНИЯ ==========
document.getElementById("readerBackBtn")?.addEventListener("click", () => {
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
    const homePage = document.getElementById("page-home");
    if (homePage) homePage.classList.add("active");

    document.querySelectorAll(".nav-link").forEach(l => l.classList.remove("active"));
    const homeLink = document.querySelector('[data-page="home"]');
    if (homeLink) homeLink.classList.add("active");
});

// ========== ЗАКРЫТЬ МОДАЛЬНОЕ ОКНО ==========
document.querySelector(".modal-close")?.addEventListener("click", () => {
    const modal = document.getElementById("bookModal");
    if (modal) {
        modal.classList.remove("active");
        document.body.style.overflow = "";
    }
});

document.getElementById("bookModal")?.addEventListener("click", (e) => {
    if (e.target === document.getElementById("bookModal")) {
        document.getElementById("bookModal").classList.remove("active");
        document.body.style.overflow = "";
    }
});

// ========== ПЕРЕКЛЮЧЕНИЕ ЯЗЫКОВ ==========
const mainTranslations = {
    ky: {
        nav_profile: "Профиль",  // для ru
// для ky: nav_profile: "Профиль",
// для en: nav_profile: "Profile",
        nav_home: "Башкы",
        nav_books: "Китептер",
        nav_history: "Тарых",
        nav_favorites: "Сакталган",
        nav_collection: "Коллекция",
        nav_about: "Биз жонундо",
        hero_title: "Окуяны улант...",
        hero_desc: "Акыркы китебиңизди окууну улантып, адабият дүйнөсүнө сүңгүңүз.",
        hero_btn: "📖 Окууну улантуу",
        hero_quote_title: "Классикалык адабият",
        hero_quote_sub: "түбөлүк чыгармалар",
        hero_quote: '"Китеп — бул бизди толтурган, бирок эч качан бошобой турган идиш."',
        popular_title: "⭐ Популярдуу китептер",
        view_all: "Баарын көрүү →",
        loading: "Китептер жүктөлүүдө...",
        counter_text: "/ окулган",
        counter_year: "китеп бул жылы",
        books_title: "📚 Бардык китептер",
        history_title: "📖 Окуу тарыхы",
        favorites_title: "❤️ Сакталган китептер",
        empty_history: "Сиздин окуу тарыхыңыз жок",
        empty_favorites: "Сакталган китептериңиз жок",
        browse_books: "Китептерди көрүү"
    },
    ru: {
        nav_profile: "Профиль",  // для ru
// для ky: nav_profile: "Профиль",
// для en: nav_profile: "Profile",
        nav_home: "Главная",
        nav_books: "Книги",
        nav_history: "История",
        nav_favorites: "Избранное",
        nav_collection: "Коллекция",
        nav_about: "О нас",
        hero_title: "Продолжите<br>рассказ..",
        hero_desc: "Продолжите чтение вашей последней книги.",
        hero_btn: "📖 Продолжить чтение",
        hero_quote_title: "Классическая литература",
        hero_quote_sub: "вечные произведения",
        hero_quote: '"Книга — это сосуд, который нас наполняет."',
        popular_title: "⭐ Популярные книги",
        view_all: "Смотреть все →",
        loading: "Загрузка книг...",
        counter_text: "/ прочитано",
        counter_year: "книг в этом году",
        books_title: "📚 Все книги",
        history_title: "📖 История чтения",
        favorites_title: "❤️ Избранные книги",
        empty_history: "У вас пока нет истории чтения",
        empty_favorites: "У вас пока нет избранных книг",
        browse_books: "Посмотреть книги"
    },
    en: {
        nav_profile: "Профиль",  // для ru
// для ky: nav_profile: "Профиль",
// для en: nav_profile: "Profile",
        nav_home: "HOME",
        nav_books: "BOOKS",
        nav_history: "HISTORY",
        nav_favorites: "FAVORITES",
        nav_collection: "COLLECTION",
        nav_about: "ABOUT US",
        hero_title: "KEEP THE STORY<br>GOING..",
        hero_desc: "Continue reading your last book.",
        hero_btn: "📖 CONTINUE READING",
        hero_quote_title: "CLASSIC LITERATURE",
        hero_quote_sub: "ETERNAL MASTERPIECES",
        hero_quote: '"A book is a vessel that fills us."',
        popular_title: "⭐ POPULAR BOOKS",
        view_all: "VIEW ALL →",
        loading: "LOADING BOOKS...",
        counter_text: "/ READ",
        counter_year: "BOOKS THIS YEAR",
        books_title: "📚 ALL BOOKS",
        history_title: "📖 READING HISTORY",
        favorites_title: "❤️ FAVORITE BOOKS",
        empty_history: "NO READING HISTORY YET",
        empty_favorites: "NO FAVORITE BOOKS YET",
        browse_books: "BROWSE BOOKS"
    }
};

function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem("language", lang);

    document.querySelectorAll(".lang-btn").forEach(btn => {
        btn.classList.remove("active");
        if (btn.getAttribute("data-lang") === lang) {
            btn.classList.add("active");
        }
    });

    document.querySelectorAll("[data-key]").forEach(element => {
        const key = element.getAttribute("data-key");
        if (mainTranslations[lang] && mainTranslations[lang][key]) {
            if (element.tagName === "INPUT" || element.tagName === "TEXTAREA") {
                element.placeholder = mainTranslations[lang][key];
            } else {
                element.innerHTML = mainTranslations[lang][key];
            }
        }
    });

    const searchInputEl = document.getElementById("searchInput");
    if (searchInputEl) {
        if (lang === "ky") searchInputEl.placeholder = "Китеп, автор изде...";
        else if (lang === "ru") searchInputEl.placeholder = "Поиск книги, автора...";
        else searchInputEl.placeholder = "SEARCH BOOK, AUTHOR...";
    }

    renderGenres();
    updateAboutPage();

    if (currentGenre) {
        const translatedName = genreTranslations[lang]?.[currentGenre] || currentGenre;
        const icon = genreIcons[currentGenre] || "fas fa-book";
        const activeGenreTitle = document.getElementById("activeGenreTitle");
        if (activeGenreTitle) {
            activeGenreTitle.innerHTML = `<i class="${icon}"></i> ${translatedName}`;
        }
    }

    loadPopularBooks();
}

document.querySelectorAll(".lang-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        const lang = btn.getAttribute("data-lang");
        setLanguage(lang);
    });
});

// ========== КАРУСЕЛЬ ДЛЯ СТРАНИЦЫ "КОЛЛЕКЦИЯ" ==========

const collectionTrack1 = document.getElementById("collectionMarqueeTrack1");
const collectionTrack2 = document.getElementById("collectionMarqueeTrack2");

const collectionBooksData = [
    {
        id: "col1",
        title: "Мастер и Маргарита",
        author: "Михаил Булгаков",
        genre: "Роман",
        tag: "Бестселлер",
        desc: "Дьявол приходит в советскую Москву, сея хаос. Любовь, сатира и вечные вопросы добра и зла.",
        cover: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ8iGSE65Ry-F9_eQs3fRShwf3yjWMYWhQ33w&s"
    },
    {
        id: "col2",
        title: "1984",
        author: "Джордж Оруэлл",
        genre: "Антиутопия",
        tag: "",
        desc: "Мир тотального контроля, где мысль — преступление, а история переписывается каждый день.",
        cover: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTwJuxDhUxqF3CDtnGi17JRZFoY4Uz9Liuwhg&s"
    },
    {
        id: "col3",
        title: "Преступление и наказание",
        author: "Фёдор Достоевский",
        genre: "Роман",
        tag: "Классика",
        desc: "Студент убивает старуху-процентщицу и не может спастись от собственной совести.",
        cover: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcScpqUJMM3PU3vqDFy3gEI9lhNZ6823K0cc3w&s"
    },
    {
        id: "col4",
        title: "Дюна",
        author: "Фрэнк Герберт",
        genre: "Фантастика",
        tag: "",
        desc: "Пустынная планета, пряность и империи. Эпическая сага о власти, религии и выживании.",
        cover: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ-OCDfMuollecu9LS9K-cQSa4QOy5PNHA14A&s"
    },
    {
        id: "col5",
        title: "Исчезнувшая",
        author: "Гиллиан Флинн",
        genre: "Детектив",
        tag: "Новинка",
        desc: "Жена пропадает в день годовщины свадьбы. Но всё ли так просто?",
        cover: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSHMSv_Yj4wyrlFTCYsZp1XYRRL9Jc_1IAWFg&s"
    },
    {
        id: "col6",
        title: "Маленький принц",
        author: "Антуан де Сент-Экзюпери",
        genre: "Фэнтези",
        tag: "Популярное",
        desc: "Принц с далёкой планеты путешествует по вселенной в поисках смысла дружбы и любви.",
        cover: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQyeWmkgtQztaXEfk2Dq-HvxcNTLHobhYBUaw&s"
    }
];

function createCollectionCard(book) {
    const card = document.createElement("div");
    card.className = "marquee-book-card";

    const tagHtml = book.tag ? `<div class="marquee-book-card__tag">${book.tag}</div>` : '';

    card.innerHTML = `
        ${tagHtml}
        <img class="marquee-book-card__cover" src="${book.cover}" alt="${book.title}" 
             onerror="this.src='https://via.placeholder.com/60x60/DED9E2/80A1D4?text=📖'">
        <div class="marquee-book-card__info">
            <div class="marquee-book-card__genre">${book.genre}</div>
            <h3 class="marquee-book-card__name">${book.title}</h3>
            <div class="marquee-book-card__author">${book.author}</div>
            <div class="marquee-book-card__desc">${book.desc}</div>
        </div>
    `;

    card.addEventListener("click", () => {
        const foundBook = allBooks.find(b => b.title?.toLowerCase().includes(book.title.toLowerCase()));
        if (foundBook) {
            openBookModal(foundBook);
            addToRecent(foundBook);
        } else {
            const tempBook = {
                id: book.id,
                title: book.title,
                authors: [book.author],
                description: book.desc,
                coverImage: book.cover,
                publishedDate: "",
                pageCount: 0,
                previewLink: null
            };
            openBookModal(tempBook);
            addToRecent(tempBook);
        }
    });

    return card;
}

function renderCollectionMarquee() {
    if (!collectionTrack1 || !collectionTrack2) return;

    collectionTrack1.innerHTML = "";
    collectionTrack2.innerHTML = "";

    for (let i = 0; i < 2; i++) {
        collectionBooksData.forEach(book => {
            collectionTrack1.appendChild(createCollectionCard(book));
        });
    }

    const reversedBooks = [...collectionBooksData].reverse();
    for (let i = 0; i < 2; i++) {
        reversedBooks.forEach(book => {
            collectionTrack2.appendChild(createCollectionCard(book));
        });
    }
}

if (document.getElementById("collectionMarqueeTrack1")) {
    renderCollectionMarquee();
}

// ========== ИНИЦИАЛИЗАЦИЯ ==========
async function init() {
    setLanguage(currentLang);
    await loadPopularBooks();
    renderRecent();
    renderFavorites();
    updateCounter();
    renderGenres();
    updateAboutPage();
}

// ========== СТРАНИЦА ПРОФИЛЯ ==========

// Функция загрузки профиля
function loadProfile() {
    if (!currentUser) {
        alert("Сначала войдите в аккаунт");
        document.querySelector('[data-page="home"]')?.click();
        return;
    }

    const user = users.find(u => u.id === currentUser.id);
    if (!user) return;

    // Заполняем данные
    document.getElementById("profileAvatar").src = user.avatar || "https://i.pravatar.cc/150?img=1";
    document.getElementById("profileUsername").textContent = user.username;
    document.getElementById("profileEmail").textContent = user.email || "—";
    document.getElementById("profileRegDate").textContent = user.regDate || new Date(parseInt(user.id)).toLocaleDateString() || "—";
    document.getElementById("profileGenres").textContent = user.favoriteGenres?.join(", ") || "Не указаны";
    document.getElementById("profileBio").textContent = user.bio || "Здесь пока ничего нет. Нажмите «Редактировать профиль», чтобы добавить информацию о себе.";

    // Заполняем поля редактирования
    document.getElementById("editGenres").value = user.favoriteGenres?.join(", ") || "";
    document.getElementById("editBio").value = user.bio || "";
}

// Редактирование профиля
document.getElementById("editProfileBtn")?.addEventListener("click", () => {
    document.getElementById("profileInfo").style.display = "none";
    document.getElementById("profileEditForm").style.display = "block";
});

document.getElementById("cancelEditBtn")?.addEventListener("click", () => {
    document.getElementById("profileInfo").style.display = "block";
    document.getElementById("profileEditForm").style.display = "none";
});

document.getElementById("saveProfileBtn")?.addEventListener("click", () => {
    if (!currentUser) return;

    const userIndex = users.findIndex(u => u.id === currentUser.id);
    if (userIndex !== -1) {
        // Сохраняем жанры
        const genresStr = document.getElementById("editGenres").value;
        users[userIndex].favoriteGenres = genresStr.split(",").map(g => g.trim()).filter(g => g);

        // Сохраняем био
        users[userIndex].bio = document.getElementById("editBio").value;

        localStorage.setItem("users", JSON.stringify(users));

        alert("✅ Профиль обновлён!");

        document.getElementById("profileInfo").style.display = "block";
        document.getElementById("profileEditForm").style.display = "none";
        loadProfile();
    }
});

// При клике на аватарку в хедере - открываем профиль
document.getElementById("userAvatar")?.addEventListener("click", () => {
    document.querySelector('[data-page="profile"]')?.click();
});


init();

// ========== ФУНКЦИИ ДЛЯ ПРОГРЕССА ЧТЕНИЯ (только один раз, без дублей) ==========

// Сохранение прогресса при чтении
function saveReadingProgress(bookId, pageNumber) {
    if (!currentUser) return;

    let users = JSON.parse(localStorage.getItem("users")) || [];
    const userIndex = users.findIndex(u => u.id === currentUser.id);

    if (userIndex !== -1) {
        if (!users[userIndex].readingProgress) users[userIndex].readingProgress = {};
        users[userIndex].readingProgress[bookId] = {
            page: pageNumber,
            lastRead: new Date().toISOString()
        };
        localStorage.setItem("users", JSON.stringify(users));
    }
}

// Получить сохранённую страницу
function getSavedPage(bookId) {
    if (!currentUser) return 1;
    let users = JSON.parse(localStorage.getItem("users")) || [];
    const user = users.find(u => u.id === currentUser.id);
    return user?.readingProgress?.[bookId]?.page || 1;
}

// Открыть книгу на сохранённой странице
function continueReading(book) {
    const savedPage = getSavedPage(book.id);
    let url = `https://books.google.com/books?id=${book.id}&pg=PA${savedPage}`;

    if (!book.previewLink && !book.id) {
        url = `https://books.google.com/books?q=${encodeURIComponent(book.title)}+${encodeURIComponent(book.authors?.[0] || '')}`;
    }

    window.open(url, '_blank');
}

function updateStats() {
    document.getElementById("totalRead").textContent = recent.length;
    document.getElementById("totalFav").textContent = favorites.length;

    if (recent.length > 0) {
        const lastBook = recent[0];
        document.getElementById("lastReadBook").textContent = lastBook.title?.substring(0, 25) || "—";
    } else {
        document.getElementById("lastReadBook").textContent = "—";
    }
}

async function init() {
    setLanguage(currentLang);
    await loadPopularBooks();
    renderRecent();
    renderFavorites();
    updateCounter();
    renderGenres();
    updateAboutPage();
    updateStats(); // ← добавь
}