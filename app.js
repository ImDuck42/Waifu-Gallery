// Global state management
const state = {
    nsfwToggle: null,
    categoryDropdown: null,
    waifuContainer: null,
    scrollBtn: null,
    jsonFileInput: null,
    selectedFileName: null,
    fileNameDisplay: null,
    importSourceBtn: null,
    importStatus: null,
    clearFileBtn: null,
    basePath: '',
    isScrolling: null,
    apiCache: new Map(),
    customSources: {
      sfw: new Map(),
      nsfw: new Map(),
      sourceInfo: []
    }
  };
  
  // Constants
  const CATEGORIES = {
    nsfw: ['waifu', 'neko', 'trap', 'blowjob'],
    sfw: ['waifu', 'neko', 'shinobu', 'megumin', 'bully', 'cuddle', 'cry', 'hug', 'awoo', 'kiss', 'lick', 'pat', 'smug', 'bonk', 'yeet', 'blush', 'smile', 'wave', 'highfive', 'handhold', 'nom', 'bite', 'glomp', 'slap', 'kill', 'kick', 'happy', 'wink', 'poke', 'dance', 'cringe']
  };
  
  // Helper functions
  const getElement = (id) => document.getElementById(id);
  const createElement = (tag) => document.createElement(tag);
  const capitalize = (str) => `${str.charAt(0).toUpperCase()}${str.slice(1)}`;
  
  // Initialize the application
  function initializeApplication() {
    // Get DOM elements
    state.nsfwToggle = getElement('nsfwToggle');
    state.categoryDropdown = getElement('categoryDropdown');
    state.waifuContainer = getElement('waifu-container');
    
    // Set base path for GitHub Pages or other hosting environments
    const pathParts = window.location.pathname.split('/');
    state.basePath = pathParts[1] ? `/${pathParts[1]}` : '';
    
    // Handle redirects for 404 page
    if (sessionStorage.redirect) {
      const redirectUrl = new URL(sessionStorage.redirect);
      const cleanPath = redirectUrl.pathname.replace(new RegExp(`^${state.basePath}`), '');
      window.history.replaceState({}, '', `${state.basePath}${cleanPath}`);
      delete sessionStorage.redirect;
    }
    
    // Load custom sources from localStorage
    loadCustomSourcesFromStorage();
    
    // Handle specific path redirects
    handleRedirects();
    
    // Setup event listeners
    if (state.nsfwToggle) {
      state.nsfwToggle.addEventListener('change', updateCategoriesWithCustomSources);
    }
    
    // Initialize categories dropdown
    updateCategoriesWithCustomSources();
    
    // Set up custom source import
    setupCustomSourceImport();
    
    // Check URL parameters
    if (!validateAndApplyURLParams()) {
      state.categoryDropdown.value = '';
    }
    
    // Setup scroll button
    setupScrollButton();
    
    // Set up history change listener
    window.addEventListener('popstate', validateAndApplyURLParams);
    
    // Check localStorage data for clear button state
    checkLocalStorageData();
  }
  
  // Panel Management
  function togglePanel() {
    getElement('sidePanel').classList.toggle('active');
  }
  
  // Scroll to Top
  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  
  // Scroll Button Visibility with Throttling
  function setupScrollButton() {
    state.scrollBtn = document.querySelector('.scroll-top');
    if (!state.scrollBtn) return;
    
    window.addEventListener('scroll', () => {
      window.clearTimeout(state.isScrolling);
      state.isScrolling = setTimeout(() => {
        state.scrollBtn.classList.toggle('visible', window.scrollY > 300);
      }, 100);
    });
  }
  
  // Update categories dropdown with custom sources
  function updateCategoriesWithCustomSources() {
    const isNSFW = state.nsfwToggle.checked;
    const categories = isNSFW ? CATEGORIES.nsfw : CATEGORIES.sfw;
    const customCats = isNSFW 
      ? Array.from(state.customSources.nsfw.entries()) 
      : Array.from(state.customSources.sfw.entries());
    
    // Reset dropdown
    state.categoryDropdown.innerHTML = '<option value="" disabled selected>Select Category</option>';
    
    // Add API categories group
    if (categories.length > 0) {
      const apiGroup = createElement('optgroup');
      apiGroup.label = 'API Categories';
      
      categories.forEach(cat => {
        const option = createElement('option');
        option.value = cat;
        option.textContent = capitalize(cat);
        apiGroup.appendChild(option);
      });
      
      state.categoryDropdown.appendChild(apiGroup);
    }
    
    // Add custom categories group
    if (customCats.length > 0) {
      const customGroup = createElement('optgroup');
      customGroup.label = state.customSources.sourceInfo[0]?.title || 'Custom Categories';
      
      customCats.forEach(([cat, data]) => {
        const option = createElement('option');
        option.value = `${data.sourceName}:${cat}`;
        option.textContent = capitalize(cat);
        customGroup.appendChild(option);
      });
      
      state.categoryDropdown.appendChild(customGroup);
    }
  }
  
  // Legacy function - maintained for backward compatibility
  function updateCategories() {
    updateCategoriesWithCustomSources();
  }
  
  // URL handling functions
  function updateURL(type, category) {
    const newPath = `${state.basePath}/${type}/${category}`;
    window.history.pushState({}, '', newPath);
  }
  
  function parseURL() {
    const pathSegments = window.location.pathname.split('/').slice(2);
    return {
      type: decodeURIComponent(pathSegments[0] || ''),
      category: decodeURIComponent(pathSegments[1] || '')
    };
  }
  
  function validateAndApplyURLParams() {
    const { type, category } = parseURL();
    const validTypes = ['nsfw', 'sfw'];
    
    // Handle custom categories in URL
    const isCustomCategory = category && category.includes(':');
    const [sourceName, baseCategoryName] = isCustomCategory ? category.split(':') : [null, category];
    
    // Decode category names to handle spaces
    const decodedBaseCategoryName = decodeURIComponent(baseCategoryName || '');
    
    // Determine if the category is valid
    const isValidCategory = isCustomCategory 
      ? (type === 'nsfw' 
          ? state.customSources.nsfw.has(decodedBaseCategoryName) 
          : state.customSources.sfw.has(decodedBaseCategoryName))
      : (type === 'nsfw' 
          ? CATEGORIES.nsfw.includes(decodedBaseCategoryName) 
          : CATEGORIES.sfw.includes(decodedBaseCategoryName));
    
    if (!validTypes.includes(type) || !isValidCategory) {
      window.history.replaceState({}, '', state.basePath || '/');
      return false;
    }
  
    state.nsfwToggle.checked = type === 'nsfw';
    updateCategoriesWithCustomSources();
    state.categoryDropdown.value = isCustomCategory ? `${sourceName}:${decodedBaseCategoryName}` : decodedBaseCategoryName;
    fetchAndDisplayWaifus();
    return true;
  }
  
  // Image handling functions
  async function fetchAndDisplayWaifus() {
    const type = state.nsfwToggle.checked ? 'nsfw' : 'sfw';
    const category = state.categoryDropdown.value;
  
    if (!category) {
      showError('Please select a category first!', './assets/oops.png');
      return;
    }
    
    // Handle custom category selection
    if (category.includes(':')) {
      const [sourceName, customCatName] = category.split(':');
      displayCustomWaifus(type, customCatName);
      updateURL(type, category);
      return;
    }
  
    const cacheKey = `${type}-${category}`;
    if (state.apiCache.has(cacheKey)) {
      displayWaifus(state.apiCache.get(cacheKey));
      updateURL(type, category);
      return;
    }
  
    try {
      showLoadingSkeleton(9);
  
      const response = await fetch(`https://api.waifu.pics/many/${type}/${category}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exclude: [] })
      });
  
      if (!response.ok) throw new Error(`API Error: ${response.status}`);
  
      const { files } = await response.json();
      state.apiCache.set(cacheKey, files);
      displayWaifus(files);
      updateURL(type, category);
      
    } catch (error) {
      window.history.replaceState({}, '', state.basePath || '/');
      handleError(error);
    }
  }
  
  function displayWaifus(files) {
    state.waifuContainer.innerHTML = files.map(url => `
      <div class="image-wrapper">
        <img src="${url}" alt="Generated waifu" loading="lazy">
      </div>
    `).join('');
  }
  
  function displayCustomWaifus(type, categoryName) {
    const categoryData = state.customSources[type].get(categoryName);
    
    if (!categoryData || !categoryData.images || categoryData.images.length === 0) {
      handleError(new Error(`No images found in custom category: ${categoryName}`));
      return;
    }
    
    displayWaifus(categoryData.images);
  }
  
  function showLoadingSkeleton(count) {
    state.waifuContainer.innerHTML = '<div class="loading-skeleton"></div>'.repeat(count);
  }
  
  function showError(message, imageUrl = './assets/smthnwrong.png') {
    state.waifuContainer.innerHTML = `
      <div class="error-container">
        <div class="error-icon">
          <img src="${imageUrl}" alt="Error">
        </div>
        <p class="error-text">${message}</p>
      </div>`;
  }
  
  function handleError(error) {
    state.waifuContainer.innerHTML = `
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
  
  // URL redirection logic
  function handleRedirects() {
    const currentPath = window.location.pathname;
  
    if (currentPath.endsWith('/api') || currentPath.endsWith('/api/')) {
      window.location.replace(`${state.basePath}/documentation/indexdocs.html`);
    } else if (currentPath.endsWith('/contact') || currentPath.endsWith('/contact/')) {
      window.location.replace(`${state.basePath}/contact/indexcontact.html`);
    } else if (currentPath.endsWith('/rl') || currentPath.endsWith('/rl/')) {
      window.location.replace(`https://www.yout-ube.com/watch?v=dQw4w9WgXcQ`);
    }
  }
  
  // Custom source import functions
  function setupCustomSourceImport() {
    state.jsonFileInput = getElement('jsonFileInput');
    state.selectedFileName = getElement('selectedFileName');
    state.fileNameDisplay = getElement('fileNameDisplay');
    state.importSourceBtn = getElement('importSourceBtn');
    state.importStatus = getElement('importStatus');
    state.clearFileBtn = getElement('clearFileBtn');
  
    if (!state.jsonFileInput || !state.selectedFileName || !state.fileNameDisplay || 
        !state.importSourceBtn || !state.importStatus || !state.clearFileBtn) {
      console.error('Custom source import elements not found');
      return;
    }
    
    state.jsonFileInput.addEventListener('change', handleFileSelection);
    state.importSourceBtn.addEventListener('click', importCustomSource);
    state.clearFileBtn.addEventListener('click', clearFileSelection);
  }
  
  function checkLocalStorageData() {
    const clearLocalStorageBtn = getElement('clearLocalStorageBtn');
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
  
  // Storage management functions
  function loadCustomSourcesFromStorage() {
    try {
      const savedData = localStorage.getItem('customSources');
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        state.customSources.sfw = new Map(parsedData.sfw);
        state.customSources.nsfw = new Map(parsedData.nsfw);
        state.customSources.sourceInfo = parsedData.sourceInfo || [];
      }
    } catch (error) {
      console.error('Error loading saved sources:', error);
      localStorage.removeItem('customSources');
    }
  }
  
  function clearLocalStorage() {
    try {
      localStorage.removeItem('customSources');
      state.customSources.sfw.clear();
      state.customSources.nsfw.clear();
      state.customSources.sourceInfo = [];
      updateCategoriesWithCustomSources();
      showImportSuccess("Local storage cleared successfully!");
      
      if (state.categoryDropdown.value.startsWith('')) {
        state.categoryDropdown.value = '';
        state.waifuContainer.innerHTML = `
          <div class="error-container">
            <div class="error-icon">
              <img src="./assets/kurukuruAPNG.png" alt="Cleared">
            </div>
            <p class="error-text">Storage cleared! Select a new category.</p>
          </div>`;
      }
  
      checkLocalStorageData();
    } catch (error) {
      showImportError("Failed to clear storage: " + error.message);
    }
  }
  
  // File handling functions
  function handleFileSelection(event) {
    const file = event.target.files[0];
    if (!file) return;
  
    // Update UI to show selected file
    state.selectedFileName.textContent = file.name;
    state.fileNameDisplay.style.display = 'flex';
    state.importSourceBtn.disabled = false;
  }
  
  function clearFileSelection() {
    state.jsonFileInput.value = '';
    state.selectedFileName.textContent = 'No file selected';
    state.fileNameDisplay.style.display = 'none';
    state.importSourceBtn.disabled = true;
    state.importStatus.style.display = 'none';
    state.importStatus.classList.remove('success', 'error');
  }
  
  async function importCustomSource() {
    const file = state.jsonFileInput.files[0];
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
      state.fileNameDisplay.style.transition = 'opacity 0.5s';
      state.fileNameDisplay.style.opacity = '0';
  
      // Hide the element completely after fade-out
      setTimeout(() => {
        state.fileNameDisplay.style.display = 'none';
        state.fileNameDisplay.style.opacity = '1'; // Reset for future visibility
      }, 250);
  
      // Clear file selection after success message
      state.importSourceBtn.disabled = true;
      setTimeout(() => {
        clearFileSelection();
      }, 2000);
  
      // If a category is selected, update the gallery
      if (state.categoryDropdown.value) {
        fetchAndDisplayWaifus();
      }        
    } catch (error) {
      showImportError("Error importing source: " + error.message);
    }
  }
  
  function readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(new Error("Failed to read file"));
      reader.readAsText(file);
    });
  }
  
  // Custom source validation functions
  function validateSourceFormat(data) {
    return data && 
           typeof data === 'object' && 
           Array.isArray(data.sfw) && 
           Array.isArray(data.nsfw) &&
           data.sfw.every(category => validateCategory(category)) &&
           data.nsfw.every(category => validateCategory(category));
  }
  
  function validateCategory(category) {
    return category && 
           typeof category === 'object' && 
           typeof category.category === 'string' &&
           Array.isArray(category.images) &&
           category.images.every(url => typeof url === 'string');
  }
  
  function processCustomSources(data) {
    // Reset existing custom sources
    state.customSources.sfw.clear();
    state.customSources.nsfw.clear();
    state.customSources.sourceInfo = data.sourceInfo || [];
  
    // Process SFW categories
    data.sfw.forEach(category => {
      if (category.category && Array.isArray(category.images) && category.images.length > 0) {
        state.customSources.sfw.set(category.category, {
          category: category.category,
          sourceName: data.sourceInfo[0]?.title || 'Unknown Source',
          information: category.information || '',
          images: [...category.images]
        });
      }
    });
  
    // Process NSFW categories
    data.nsfw.forEach(category => {
      if (category.category && Array.isArray(category.images) && category.images.length > 0) {
        state.customSources.nsfw.set(category.category, {
          category: category.category,
          sourceName: data.sourceInfo[0]?.title || 'Unknown Source',
          information: category.information || '',
          images: [...category.images]
        });
      }
    });
  
    // Save to localStorage
    saveCustomSourcesToStorage();
  
    // Update UI
    updateCategoriesWithCustomSources();
    checkLocalStorageData();
  }
  
  function saveCustomSourcesToStorage() {
    localStorage.setItem('customSources', JSON.stringify({
      sfw: Array.from(state.customSources.sfw.entries()),
      nsfw: Array.from(state.customSources.nsfw.entries()),
      sourceInfo: state.customSources.sourceInfo
    }));
  }
  
  // Utility functions for custom sources
  function countTotalImages(data) {
    let count = 0;
    if (data.sfw) data.sfw.forEach(cat => count += (cat.images?.length || 0));
    if (data.nsfw) data.nsfw.forEach(cat => count += (cat.images?.length || 0));
    return count;
  }
  
  function countCategories(data) {
    let count = 0;
    if (data.sfw) count += data.sfw.length;
    if (data.nsfw) count += data.nsfw.length;
    return count;
  }
  
  // UI feedback functions
  function showImportSuccess(message) {
    state.importStatus.textContent = message;
    state.importStatus.classList.add('success');
    state.importStatus.classList.remove('error');
    state.importStatus.style.display = 'block';
    state.importStatus.style.opacity = '1';
  
    // Fade out after 2 seconds
    setTimeout(() => {
      state.importStatus.style.transition = 'opacity 0.5s';
      state.importStatus.style.opacity = '0';
  
      setTimeout(() => {
        state.importStatus.style.display = 'none';
        state.importStatus.style.opacity = '1';
      }, 500);
    }, 2000);
  }
  
  function showImportError(message) {
    state.importStatus.textContent = message;
    state.importStatus.classList.add('error');
    state.importStatus.classList.remove('success');
    state.importStatus.style.display = 'block';
  }
  
  // Image randomization function
  function randomizeImages() {
    const images = Array.from(state.waifuContainer.querySelectorAll('.image-wrapper'));
    if (images.length === 0) return;
  
    // Shuffle images
    const shuffledImages = images.sort(() => Math.random() - 0.5);
  
    // Clear and re-append shuffled images
    state.waifuContainer.innerHTML = '';
    shuffledImages.forEach(image => state.waifuContainer.appendChild(image));
  }
  
  // Check localStorage on init
  checkLocalStorageData();
  
  // Run initialization when DOM is loaded
  document.addEventListener('DOMContentLoaded', initializeApplication);