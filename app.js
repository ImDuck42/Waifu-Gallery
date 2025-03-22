// Cached DOM elements
let nsfwToggle, categoryDropdown, waifuContainer, scrollBtn;
let jsonFileInput, selectedFileName, fileNameDisplay, importSourceBtn, importStatus, clearFileBtn;

checkLocalStorageData()

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
function setupScrollButton() {
    scrollBtn = document.querySelector('.scroll-top');
    if (!scrollBtn) return;

    window.addEventListener('scroll', () => {
        window.clearTimeout(isScrolling);
        isScrolling = setTimeout(() => {
            scrollBtn.classList.toggle('visible', window.scrollY > 300);
        }, 100);
    });
}

// Category Configuration
const nsfwCategories = ['waifu', 'neko', 'trap', 'blowjob'];
const sfwCategories = ['waifu', 'neko', 'shinobu', 'megumin', 'bully', 'cuddle', 'cry', 'hug', 'awoo', 'kiss', 'lick', 'pat', 'smug', 'bonk', 'yeet', 'blush', 'smile', 'wave', 'highfive', 'handhold', 'nom', 'bite', 'glomp', 'slap', 'kill', 'kick', 'happy', 'wink', 'poke', 'dance', 'cringe'];
const apiCache = new Map();

// Custom Source Configuration
const customSources = {
    sfw: new Map(),
    nsfw: new Map()
};

// Legacy function - use updateCategoriesWithCustomSources instead
function updateCategories() {
    // Now just redirect to the more comprehensive function
    updateCategoriesWithCustomSources();
}

// Update categories dropdown with custom sources
function updateCategoriesWithCustomSources() {
    const isNSFW = nsfwToggle.checked;
    const categories = isNSFW ? nsfwCategories : sfwCategories;
    const customCats = isNSFW ? Array.from(customSources.nsfw.keys()) : Array.from(customSources.sfw.keys());
    
    // Reset dropdown
    categoryDropdown.innerHTML = '<option value="" disabled selected>Select Category</option>';
    
    // Group 1: API categories
    if (categories.length > 0) {
        const apiGroup = document.createElement('optgroup');
        apiGroup.label = 'API Categories';
        
        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = `${cat.charAt(0).toUpperCase()}${cat.slice(1)}`;
            apiGroup.appendChild(option);
        });
        
        categoryDropdown.appendChild(apiGroup);
    }
    
    // Group 2: Custom categories
    if (customCats.length > 0) {
        const customGroup = document.createElement('optgroup');
        customGroup.label = 'Custom Categories';
        
        customCats.forEach(cat => {
            const option = document.createElement('option');
            option.value = 'custom:' + cat;
            option.textContent = `${cat.charAt(0).toUpperCase()}${cat.slice(1)}`;
            customGroup.appendChild(option);
        });
        
        categoryDropdown.appendChild(customGroup);
    }
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
    
    // Extract the base category name if it's a custom category
    const isCustomCategory = category && category.startsWith('custom:');
    const baseCategoryName = isCustomCategory ? category.substring(7) : category;
    
    // Determine if the category is valid
    const isValidCategory = isCustomCategory 
        ? (type === 'nsfw' ? customSources.nsfw.has(baseCategoryName) : customSources.sfw.has(baseCategoryName))
        : (type === 'nsfw' ? nsfwCategories.includes(baseCategoryName) : sfwCategories.includes(baseCategoryName));
    
    if (!validTypes.includes(type) || !isValidCategory) {
        window.history.replaceState({}, '', basePath || '/');
        return false;
    }

    nsfwToggle.checked = type === 'nsfw';
    updateCategoriesWithCustomSources();
    categoryDropdown.value = isCustomCategory ? `custom:${baseCategoryName}` : baseCategoryName;
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
    
    // Check if this is a custom category
    if (category.startsWith('custom:')) {
        const customCatName = category.substring(7); // Remove 'custom:' prefix
        displayCustomWaifus(type, customCatName);
        updateURL(type, category); // Still update the URL
        return;
    }

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
    `).join('');}

// Display custom  images
function displayCustomWaifus(type, categoryName) {
    const categoryData = customSources[type].get(categoryName);
    
    if (!categoryData || !categoryData.images || categoryData.images.length === 0) {
        handleError(new Error(`No images found in custom category: ${categoryName}`));
        return;
    }
    
    displayWaifus(categoryData.images);
}

function handleError(error) {
    waifuContainer.innerHTML = `
        <div class="error-container">
            <div class="error-icon">
                <img src="./assets/smthnwrong.png" alt="Something went wrong">
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

// URL Redirection Logic
function handleRedirects() {
    const currentPath = window.location.pathname;

    if (currentPath.endsWith('/api') || currentPath.endsWith('/api/')) {
        window.location.replace(`${basePath}/documentation/indexdocs.html`);
    } else if (currentPath.endsWith('/contact') || currentPath.endsWith('/contact/')) {
        window.location.replace(`${basePath}/contact/indexcontact.html`);
    }
}

// Setup Custom Source Import
function setupCustomSourceImport() {
    jsonFileInput = document.getElementById('jsonFileInput');
    selectedFileName = document.getElementById('selectedFileName');
    fileNameDisplay = document.getElementById('fileNameDisplay');
    importSourceBtn = document.getElementById('importSourceBtn');
    importStatus = document.getElementById('importStatus');
    clearFileBtn = document.getElementById('clearFileBtn');

    if (!jsonFileInput || !selectedFileName || !fileNameDisplay || !importSourceBtn || !importStatus || !clearFileBtn) {
        console.error('Custom source import elements not found');
        return;
    }
  
    jsonFileInput.addEventListener('change', handleFileSelection);
    importSourceBtn.addEventListener('click', importCustomSource);
    clearFileBtn.addEventListener('click', clearFileSelection);
}

// Add this function to check if localStorage has data
function checkLocalStorageData() {
    const clearLocalStorageBtn = document.getElementById('clearLocalStorageBtn');
    if (!clearLocalStorageBtn) return;
    
    try {
        const savedData = localStorage.getItem('customSources');
        if (savedData) {
            const parsedData = JSON.parse(savedData);
            // Enable button if there are any custom sources
            const hasSFWData = parsedData.sfw && parsedData.sfw.length > 0;
            const hasNSFWData = parsedData.nsfw && parsedData.nsfw.length > 0;
            
            clearLocalStorageBtn.disabled = !(hasSFWData || hasNSFWData);
        } else {
            // Disable button if no custom sources found
            clearLocalStorageBtn.disabled = true;
        }
    } catch (error) {
        console.error('Error checking localStorage data:', error);
        clearLocalStorageBtn.disabled = true;
    }
}

// Storage Management Functions
function clearLocalStorage() {
    try {
        localStorage.removeItem('customSources');
        customSources.sfw.clear();
        customSources.nsfw.clear();
        updateCategoriesWithCustomSources();
        showImportSuccess("Local storage cleared successfully!");
        
        if (categoryDropdown.value.startsWith('')) {
            categoryDropdown.value = '';
            waifuContainer.innerHTML = `
                <div class="error-container">
                    <div class="error-icon">
                        <img src="./assets/kurukuruAPNG.png" alt="Cleared">
                    </div>
                    <p class="error-text">Storage cleared! Select a new category.</p>
                </div>`;
        }

        checkLocalStorageData()

    } catch (error) {
        showImportError("Failed to clear storage: " + error.message);
    }
}

// Handle file selection
function handleFileSelection(event) {
    const file = event.target.files[0];
    if (!file) return;
  
    // Update UI to show selected file
    selectedFileName.textContent = file.name;
    fileNameDisplay.style.display = 'flex';
    importSourceBtn.disabled = false;
}

// Clear file selection
function clearFileSelection() {
    jsonFileInput.value = '';
    selectedFileName.textContent = 'No file selected';
    fileNameDisplay.style.display = 'none';
    importSourceBtn.disabled = true;
    importStatus.style.display = 'none';
    importStatus.classList.remove('success', 'error');
}

// Import and process custom source
async function importCustomSource() {
    const file = jsonFileInput.files[0];
    if (!file) return;
    
    try {
        // Read file content
        const fileContent = await readFileAsText(file);
        const sourceData = JSON.parse(fileContent);
  
        // Validate source structure
        if (!validateSourceFormat(sourceData)) {
            showImportError("Invalid source format. Please use the correct template.");
            return;
        }
  
        // Process and store custom sources
        processCustomSources(sourceData);
      
        // Update UI for successful import
        showImportSuccess(`Successfully imported ${countTotalImages(sourceData)} images in ${countCategories(sourceData)} categories.`);
        
        // Hide fileNameDisplay after successful import with fade-out effect
        fileNameDisplay.style.transition = 'opacity 0.5s';
        fileNameDisplay.style.opacity = '0';

        // Hide the element completely after fade-out
        setTimeout(() => {
            fileNameDisplay.style.display = 'none';
            fileNameDisplay.style.opacity = '1'; // Reset for future visibility
        }, 250); // Wait for fade-out to complete

        // If a category is selected, update the gallery
        if (categoryDropdown.value) {
            fetchAndDisplayWaifus();
        }
    } catch (error) {
        showImportError("Error importing source: " + error.message);
    }
}

// Read file as text
function readFileAsText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(new Error("Failed to read file"));
        reader.readAsText(file);
    });
}

// Validate source format
function validateSourceFormat(data) {
    return data && 
           typeof data === 'object' && 
           Array.isArray(data.sfw) && 
           Array.isArray(data.nsfw) &&
           data.sfw.every(category => validateCategory(category)) &&
           data.nsfw.every(category => validateCategory(category));
}

// Validate category structure
function validateCategory(category) {
    return category && 
           typeof category === 'object' && 
           typeof category.name === 'string' && 
           Array.isArray(category.images) &&
           category.images.every(url => typeof url === 'string');
}

// Process custom sources
function processCustomSources(data) {
    // Reset existing custom sources
    customSources.sfw.clear();
    customSources.nsfw.clear();
    
    // Process SFW categories
    data.sfw.forEach(category => {
        if (category.name && Array.isArray(category.images) && category.images.length > 0) {
            customSources.sfw.set(category.name, {
                name: category.name,
                description: category.description || '',
                images: [...category.images]
            });
        }
    });
    
    // Process NSFW categories
    data.nsfw.forEach(category => {
        if (category.name && Array.isArray(category.images) && category.images.length > 0) {
            customSources.nsfw.set(category.name, {
                name: category.name,
                description: category.description || '',
                images: [...category.images]
            });
        }
    });
    
    // Save to localStorage (new addition)
    localStorage.setItem('customSources', JSON.stringify({
        sfw: Array.from(customSources.sfw.entries()),
        nsfw: Array.from(customSources.nsfw.entries())
    }));
    
    // Update the categories dropdown with new options
    updateCategoriesWithCustomSources();
    checkLocalStorageData()
}

// Count total images in source
function countTotalImages(data) {
    let count = 0;
    if (data.sfw) data.sfw.forEach(cat => count += (cat.images?.length || 0));
    if (data.nsfw) data.nsfw.forEach(cat => count += (cat.images?.length || 0));
    return count;
}

// Count categories in source
function countCategories(data) {
    let count = 0;
    if (data.sfw) count += data.sfw.length;
    if (data.nsfw) count += data.nsfw.length;
    return count;
}

// Show import success message
function showImportSuccess(message) {
    importStatus.textContent = message;
    importStatus.classList.add('success');
    importStatus.classList.remove('error');
    importStatus.style.display = 'block';
    importStatus.style.opacity = '1';

    // Keep it visible for 2 seconds
    setTimeout(() => {
        importStatus.style.transition = 'opacity 0.5s';
        importStatus.style.opacity = '0';

        // Hide the element completely after fade-out
        setTimeout(() => {
            importStatus.style.display = 'none';
            importStatus.style.opacity = '1'; // Reset for future messages
        }, 500); // Wait for fade-out to complete
    }, 2000);
}

// Show import error message
function showImportError(message) {
    importStatus.textContent = message;
    importStatus.classList.add('error');
    importStatus.classList.remove('success');
    importStatus.style.display = 'block';
}

// Add this function to randomize images
function randomizeImages() {
    const images = Array.from(waifuContainer.querySelectorAll('.image-wrapper'));
    if (images.length === 0) return;

    // Shuffle images
    const shuffledImages = images.sort(() => Math.random() - 0.5);

    // Clear and re-append shuffled images
    waifuContainer.innerHTML = '';
    shuffledImages.forEach(image => waifuContainer.appendChild(image));
}

// Initialization
function initializeApplication() {
    // Get DOM elements after document is loaded
    nsfwToggle = document.getElementById('nsfwToggle');
    categoryDropdown = document.getElementById('categoryDropdown');
    waifuContainer = document.getElementById('waifu-container');

    // Set up the base path for GitHub Pages or other hosting environments
    const initialPath = window.location.pathname;
    const pathParts = initialPath.split('/');
    basePath = pathParts[1] ? `/${pathParts[1]}` : '';

    // Handle redirects (for 404 page)
    if (sessionStorage.redirect) {
        const redirectUrl = new URL(sessionStorage.redirect);
        const cleanPath = redirectUrl.pathname.replace(new RegExp(`^${basePath}`), '');
        window.history.replaceState({}, '', `${basePath}${cleanPath}`);
        delete sessionStorage.redirect;
    }

    // Load custom sources from localStorage
    try {
        const savedData = localStorage.getItem('customSources');
        if (savedData) {
        const parsedData = JSON.parse(savedData);
        customSources.sfw = new Map(parsedData.sfw);
        customSources.nsfw = new Map(parsedData.nsfw);
        updateCategoriesWithCustomSources();
        }
    } catch (error) {
        console.error('Error loading saved sources:', error);
        localStorage.removeItem('customSources');
    }

    // Handle redirects (for specific paths)
    handleRedirects();

    // Setup event listeners
    if (nsfwToggle) {
        nsfwToggle.addEventListener('change', updateCategoriesWithCustomSources); // Changed this line
    }

    // Initialize categories dropdown
    updateCategoriesWithCustomSources(); // Changed to use the comprehensive function
    
    // Set up custom source import
    setupCustomSourceImport(); 

    // Check if URL has valid parameters
    if (!validateAndApplyURLParams()) {
        categoryDropdown.value = '';
    }

    // Setup scroll button
    setupScrollButton();

    // Set up history change listener
    window.addEventListener('popstate', validateAndApplyURLParams);
}

// Run initialization when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApplication);