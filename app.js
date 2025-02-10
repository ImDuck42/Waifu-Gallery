// Cached DOM elements
const nsfwToggle = document.getElementById('nsfwToggle');
const categoryDropdown = document.getElementById('categoryDropdown');
const waifuContainer = document.getElementById('waifu-container');
const scrollBtn = document.querySelector('.scroll-top');

// Panel Management
let basePath = '';

function togglePanel() {
    document.getElementById('sidePanel').classList.toggle('active');
}

// Scroll to Top
function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Scroll Button Visibility with Throttling
let isScrolling;
window.addEventListener('scroll', () => {
    window.clearTimeout(isScrolling);
    isScrolling = setTimeout(() => {
        scrollBtn.classList.toggle('visible', window.scrollY > 300);
    }, 100);
});

// Category Configuration
const nsfwCategories = ['waifu', 'neko', 'trap', 'blowjob'];
const sfwCategories = ['waifu', 'neko', 'shinobu', 'megumin', 'bully', 'cuddle', 'cry', 'hug', 'awoo', 'kiss', 'lick', 'pat', 'smug', 'bonk', 'yeet', 'blush', 'smile', 'wave', 'highfive', 'handhold', 'nom', 'bite', 'glomp', 'slap', 'kill', 'kick', 'happy', 'wink', 'poke', 'dance', 'cringe'];
const apiCache = new Map();

function updateCategories() {
    const isNSFW = nsfwToggle.checked;
    const categories = isNSFW ? nsfwCategories : sfwCategories;

    categoryDropdown.innerHTML = '<option value="" disabled selected>Select Category</option>';
    categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = `${cat.charAt(0).toUpperCase()}${cat.slice(1)}`;
        categoryDropdown.appendChild(option);
    });
}

// URL Handling
function updateURL(type, category) {
    const newPath = `${basePath}/${type}/${category}`;
    window.history.pushState({}, '', newPath);
}

function parseURL() {
    const pathSegments = window.location.pathname.split('/').slice(2);
    return {
        type: pathSegments[0] || '',
        category: pathSegments[1] || ''
    };
}

function validateAndApplyURLParams() {
    const { type, category } = parseURL();
    const validTypes = ['nsfw', 'sfw'];
    
    if (!validTypes.includes(type) || !(type === 'nsfw' ? nsfwCategories : sfwCategories).includes(category)) {
        window.history.replaceState({}, '', basePath || '/');
        return false;
    }

    nsfwToggle.checked = type === 'nsfw';
    updateCategories();
    categoryDropdown.value = category;
    fetchAndDisplayWaifus();
    return true;
}

// Image Handling
async function fetchAndDisplayWaifus() {
    const type = nsfwToggle.checked ? 'nsfw' : 'sfw';
    const category = categoryDropdown.value;

    if (!category) {
        waifuContainer.innerHTML = `
            <div class="error-container">
                <div class="error-icon">
                    <img src="./assets/oops.png" alt="Oops">
                </div>
                <p class="error-text">Please select a category first!</p>
            </div>`;
        return;
    }

    if (window.innerWidth <= 768) togglePanel();

    const cacheKey = `${type}-${category}`;
    if (apiCache.has(cacheKey)) {
        displayWaifus(apiCache.get(cacheKey));
        updateURL(type, category);
        return;
    }

    try {
        waifuContainer.innerHTML = '<div class="loading-skeleton"></div>'.repeat(9);
        
        const response = await fetch(`https://api.waifu.pics/many/${type}/${category}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ exclude: [] })
        });

        if (!response.ok) throw new Error(`API Error: ${response.status}`);
        
        const { files } = await response.json();
        apiCache.set(cacheKey, files);
        displayWaifus(files);
        updateURL(type, category);

    } catch (error) {
        window.history.replaceState({}, '', basePath || '/');
        handleError(error);
    }
}

function displayWaifus(files) {
    waifuContainer.innerHTML = files.map(url => `
        <div class="image-wrapper">
            <img src="${url}" alt="Generated waifu" loading="lazy">
        </div>
    `).join('');
}

function handleError(error) {
    waifuContainer.innerHTML = `
        <div class="error-container">
            <div class="error-icon">
                <img src="./assets/smthnwrong.png" alt="Smthnwrong">
            </div>
            <p class="error-text">Failed to generate waifus<br><small>${error.message || 'Unknown error'}</small></p>
            <button class="retry-btn" onclick="fetchAndDisplayWaifus()">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M23 4v6h-6M1 20v-6h6"/>
                    <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
                </svg>
                Try Again
            </button>
        </div>`;
}

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    const initialPath = window.location.pathname;
    const pathParts = initialPath.split('/');
    basePath = pathParts[1] ? `/${pathParts[1]}` : '';

    if (sessionStorage.redirect) {
        const redirectUrl = new URL(sessionStorage.redirect);
        const cleanPath = redirectUrl.pathname.replace(new RegExp(`^${basePath}`), '');
        window.history.replaceState({}, '', `${basePath}${cleanPath}`);
        delete sessionStorage.redirect;
    }

    if (nsfwToggle) {
        nsfwToggle.addEventListener('change', updateCategories);
    }
    updateCategories();
    
    if (!validateAndApplyURLParams()) {
        categoryDropdown.value = '';
    }
    
    window.addEventListener('popstate', validateAndApplyURLParams);
});