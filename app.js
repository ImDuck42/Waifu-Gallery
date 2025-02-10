const nsfwToggle = document.getElementById('nsfwToggle');
const categoryDropdown = document.getElementById('categoryDropdown');
const waifuContainer = document.getElementById('waifu-container');
const scrollBtn = document.querySelector('.scroll-top');

let basePath = '';

// Panel Management
const togglePanel = () => document.getElementById('sidePanel').classList.toggle('active');

// Scroll Management
const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

window.addEventListener('scroll', () => {
    scrollBtn.classList.toggle('visible', window.scrollY > 300);
}, { passive: true });

// Category Configuration
const nsfwCategories = ['waifu', 'neko', 'trap', 'blowjob'];
const sfwCategories = ['waifu', 'neko', 'shinobu', 'megumin', 'bully', 'cuddle', 'cry', 'hug', 'awoo', 'kiss', 'lick', 'pat', 'smug', 'bonk', 'yeet', 'blush', 'smile', 'wave', 'highfive', 'handhold', 'nom', 'bite', 'glomp', 'slap', 'kill', 'kick', 'happy', 'wink', 'poke', 'dance', 'cringe'];
const apiCache = new Map();

function updateCategories() {
    const categories = nsfwToggle.checked ? nsfwCategories : sfwCategories;
    categoryDropdown.innerHTML = categories.reduce((acc, cat) => 
        acc + `<option value="${cat}">${cat.charAt(0).toUpperCase() + cat.slice(1)}</option>`
    , '<option value="" disabled selected>Select Category</option>');
}

// URL Handling
const updateURL = (type, category) => 
    window.history.pushState({}, '', `${basePath}/${type}/${category}`);

const parseURL = () => {
    const [type = '', category = ''] = window.location.pathname.split('/').slice(2);
    return { type, category };
};

function validateAndApplyURLParams() {
    const { type, category } = parseURL();
    const validType = ['nsfw', 'sfw'].includes(type);
    const validCategory = (type === 'nsfw' ? nsfwCategories : sfwCategories).includes(category);
    
    if (!validType || !validCategory) {
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
        waifuContainer.innerHTML = Array.from({ length: 9 }, () => 
            '<div class="loading-skeleton"></div>').join('');
        
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

const displayWaifus = files => 
    waifuContainer.innerHTML = files.map(url => `
        <div class="image-wrapper">
            <img src="${url}" alt="Generated waifu" loading="lazy">
        </div>
    `).join('');

function handleError(error) {
    waifuContainer.innerHTML = `
        <div class="error-container">
            <div class="error-icon">
                <img src="./assets/smthnwrong.png" alt="Error">
            </div>
            <p class="error-text">Failed to generate waifus<br><small>${error.message || 'Unknown error'}</small></p>
            <button class="retry-btn" onclick="fetchAndDisplayWaifus()">
                <svg viewBox="0 0 24 24" width="18" height="18">
                    <path d="M23 4v6h-6M1 20v-6h6"/>
                    <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
                </svg>
                Try Again
            </button>
        </div>`;
}

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    const pathParts = window.location.pathname.split('/');
    basePath = pathParts[1] ? `/${pathParts[1]}` : '';

    if (sessionStorage.redirect) {
        const redirectUrl = new URL(sessionStorage.redirect);
        window.history.replaceState({}, '', redirectUrl.pathname.replace(new RegExp(`^${basePath}`), ''));
        delete sessionStorage.redirect;
    }

    nsfwToggle?.addEventListener('change', updateCategories);
    updateCategories();
    validateAndApplyURLParams();
    window.addEventListener('popstate', validateAndApplyURLParams);
});