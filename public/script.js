// Human Evolution Archive - Main JavaScript
// Handles all interactivity, filtering, and dynamic content

document.addEventListener('DOMContentLoaded', () => {
    // Set dynamic footer year
    const footerYear = document.getElementById('footerYear');
    if (footerYear) footerYear.textContent = new Date().getFullYear();

    // Initialize all components
    initNavigation();
    initHeroStats();
    initDeferredSections();
    initModal();
    initLightbox();
    initScrollEffects();
});

// ========================================
// Navigation
// ========================================
function initNavigation() {
    const navbar = document.getElementById('navbar');
    const navToggle = document.getElementById('navToggle');
    const mobileMenu = document.getElementById('mobileMenu');
    const navLinks = document.querySelectorAll('.nav-link, .mobile-link');

    // Scroll effect for navbar
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    }, { passive: true });

    // Mobile menu toggle
    navToggle.addEventListener('click', () => {
        const isOpen = mobileMenu.classList.toggle('active');
        navToggle.classList.toggle('active', isOpen);
        navToggle.setAttribute('aria-expanded', String(isOpen));
    });

    // Active link tracking
    const sections = document.querySelectorAll('section[id]');

    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 100;
            if (window.scrollY >= sectionTop) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    }, { passive: true });

    // Close mobile menu on link click
    document.querySelectorAll('.mobile-link').forEach(link => {
        link.addEventListener('click', () => {
            mobileMenu.classList.remove('active');
            navToggle.classList.remove('active');
            navToggle.setAttribute('aria-expanded', 'false');
        });
    });
}

// ========================================
// Hero Stats Animation
// ========================================
function initHeroStats() {
    const fossilsEl = document.getElementById('statFossils');
    const speciesEl = document.getElementById('statSpecies');
    const yearsEl = document.getElementById('statYears');

    const uniqueSpecies = new Set(FOSSIL_DATA.map(f => f.species)).size;
    fossilsEl.textContent = FOSSIL_DATA.length;
    speciesEl.textContent = uniqueSpecies;
    yearsEl.textContent = '7';
}

// ========================================
// Deferred Sections
// ========================================
let timelineInitialized = false;
let catalogInitialized = false;
let filtersInitialized = false;

function initDeferredSections() {
    const timeline = document.getElementById('timeline');
    const catalog = document.getElementById('catalog');

    if (!('IntersectionObserver' in window)) {
        initTimeline();
        initCatalog();
        initFilters();
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;

            if (entry.target === timeline && !timelineInitialized) {
                initTimeline();
            }

            if (entry.target === catalog && !catalogInitialized) {
                initCatalog();
                initFilters();
            }
        });
    }, { rootMargin: '0px 0px', threshold: 0.01 });

    if (timeline) observer.observe(timeline);
    if (catalog) observer.observe(catalog);
}

// ========================================
// Timeline
// ========================================
function initTimeline() {
    if (timelineInitialized) return;
    timelineInitialized = true;

    const eraButtons = document.querySelectorAll('.era-btn');

    renderTimeline('all');

    // Era filter buttons
    eraButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            eraButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderTimeline(btn.dataset.era);
        });
    });
}

function renderTimeline(era) {
    const container = document.getElementById('timelineFossils');
    container.replaceChildren();

    let fossils = FOSSIL_DATA;
    if (era !== 'all') {
        fossils = FOSSIL_DATA.filter(f => f.era === era);
    }

    // Sort by age (oldest first) for better visual grouping
    fossils = [...fossils].sort((a, b) => b.ageNumeric - a.ageNumeric);

    // Logarithmic scale parameters
    // Using log scale because data spans 7 Ma to 0.03 Ma (factor of ~233x)
    const maxAge = 7; // 7 Ma (oldest)
    const minAge = 0.025; // ~25 ka (youngest shown, slightly before present)

    // Function to convert age (Ma) to x position percentage
    // Logarithmic scale: older fossils on left (0%), younger on right (100%)
    function ageToPosition(ageMa) {
        if (ageMa <= 0) ageMa = minAge;
        // Log scale transformation
        const logMax = Math.log10(maxAge);
        const logMin = Math.log10(minAge);
        const logAge = Math.log10(Math.max(ageMa, minAge));
        // Normalize: 0% = maxAge (oldest), 100% = minAge (youngest/present)
        const position = (logMax - logAge) / (logMax - logMin) * 100;
        return Math.max(2, Math.min(98, position)); // Keep within bounds
    }

    // Track positions to handle overlapping fossils
    const usedPositions = [];
    fossils.forEach((fossil, index) => {
        const xPercent = ageToPosition(fossil.ageNumeric);

        // Smart vertical positioning to avoid overlaps
        let yPos = 20;
        let row = 0;
        const xTolerance = 3; // % width tolerance for overlap detection

        // Find available row at this x position
        for (let r = 0; r < 5; r++) {
            const testY = 20 + r * 55;
            const hasOverlap = usedPositions.some(pos =>
                Math.abs(pos.x - xPercent) < xTolerance && pos.y === testY
            );
            if (!hasOverlap) {
                yPos = testY;
                row = r;
                break;
            }
        }

        usedPositions.push({ x: xPercent, y: yPos });

        const fossilEl = document.createElement('button');
        fossilEl.className = 'timeline-fossil';
        fossilEl.type = 'button';
        fossilEl.setAttribute('aria-label', `${fossil.species}, ${fossil.specimen}, ${fossil.age}`);
        fossilEl.dataset.id = fossil.id;
        fossilEl.dataset.species = fossil.species;
        fossilEl.dataset.era = fossil.era;
        fossilEl.dataset.age = fossil.age; // Store formatted age for tooltip
        fossilEl.style.left = `${xPercent}%`;
        fossilEl.style.top = `${yPos}px`;
        fossilEl.style.animationDelay = `${index * 30}ms`;

        // Add title attribute for native tooltip with age info
        fossilEl.title = `${fossil.species}\n${fossil.specimen}\n${fossil.age}`;

        // Try to load image
        const img = document.createElement('img');
        img.src = thumbnailSrc(fossil.images[0], 160);
        img.alt = fossil.specimen;
        img.loading = 'lazy';
        img.decoding = 'async';
        img.width = 160;
        img.height = 160;
        img.onerror = () => {
            fossilEl.replaceChildren(createEl('span', 'fossil-placeholder'));
        };
        fossilEl.appendChild(img);

        fossilEl.addEventListener('click', () => openModal(fossil.id));

        container.appendChild(fossilEl);
    });

    // Update scale markers to match logarithmic positions
    updateTimelineScale();
}

function updateTimelineScale() {
    const scaleContainer = document.querySelector('.timeline-scale');
    if (!scaleContainer) return;

    // Define scale markers with their ages in Ma
    const markers = [
        { label: '7 Ma', ageMa: 7 },
        { label: '3 Ma', ageMa: 3 },
        { label: '1 Ma', ageMa: 1 },
        { label: '500 ka', ageMa: 0.5 },
        { label: '100 ka', ageMa: 0.1 },
        { label: '30 ka', ageMa: 0.03 }
    ];

    const maxAge = 7;
    const minAge = 0.025;

    scaleContainer.replaceChildren(...markers.map(m => {
        const logMax = Math.log10(maxAge);
        const logMin = Math.log10(minAge);
        const logAge = Math.log10(Math.max(m.ageMa, minAge));
        const position = (logMax - logAge) / (logMax - logMin) * 100;

        const marker = createEl('span', 'scale-marker', m.label);
        marker.style.left = `${position}%`;
        return marker;
    }));
}

// ========================================
// Catalog
// ========================================
let currentPage = 1;
const itemsPerPage = 12;
let filteredFossils = [...FOSSIL_DATA];
let currentView = 'grid';

function initCatalog() {
    if (catalogInitialized) return;
    catalogInitialized = true;

    renderCatalog();

    const grid = document.getElementById('catalogGrid');
    grid.addEventListener('click', (event) => {
        const card = event.target.closest('.fossil-card');
        if (!card || !grid.contains(card)) return;
        openModal(Number(card.dataset.fossilId));
    });

    // View toggle
    document.querySelectorAll('.view-toggle').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.view-toggle').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentView = btn.dataset.view;
            const grid = document.getElementById('catalogGrid');
            grid.classList.toggle('list-view', currentView === 'list');
        });
    });

    // Load more button
    document.getElementById('loadMore').addEventListener('click', () => {
        currentPage++;
        renderCatalog(true);
    });
}

function renderCatalog(append = false) {
    const grid = document.getElementById('catalogGrid');
    const loadMoreBtn = document.getElementById('loadMore');
    const resultCount = document.getElementById('resultCount');

    if (!append) {
        grid.replaceChildren();
        currentPage = 1;
    }

    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageItems = filteredFossils.slice(start, end);

    pageItems.forEach((fossil, index) => {
        const card = createFossilCard(fossil, start + index);
        grid.appendChild(card);
    });

    // Update result count
    resultCount.textContent = `${filteredFossils.length} specimen${filteredFossils.length !== 1 ? 's' : ''}`;

    // Show/hide load more button
    loadMoreBtn.style.display = end >= filteredFossils.length ? 'none' : 'block';
}

function createFossilCard(fossil, index) {
    const card = document.createElement('button');
    card.className = 'fossil-card';
    card.type = 'button';
    card.dataset.fossilId = String(fossil.id);
    card.setAttribute('aria-label', `Open ${fossil.species}, ${fossil.specimen}`);
    card.style.animationDelay = `${(index % itemsPerPage) * 50}ms`;

    const eraConfig = ERA_CONFIG[fossil.era];

    const imageWrap = createEl('div', 'fossil-card-image');
    const image = document.createElement('img');
    image.src = thumbnailSrc(fossil.images[0], 520);
    image.srcset = `${thumbnailSrc(fossil.images[0], 160)} 160w, ${thumbnailSrc(fossil.images[0], 520)} 520w`;
    image.sizes = '(max-width: 700px) 100vw, 33vw';
    image.alt = fossil.specimen;
    image.loading = 'lazy';
    image.decoding = 'async';
    image.width = 520;
    image.height = 360;
    image.onerror = () => imageWrap.replaceChildren(createEl('div', 'fossil-card-placeholder'));

    const era = createEl('span', 'fossil-card-era', eraConfig.label);
    era.style.color = eraConfig.color;
    imageWrap.append(image, era);

    const content = createEl('div', 'fossil-card-content');
    content.append(
        createEl('div', 'fossil-card-species', fossil.species),
        createEl('div', 'fossil-card-specimen', fossil.specimen)
    );

    const meta = createEl('div', 'fossil-card-meta');
    meta.append(
        createEl('span', 'meta-age', fossil.age),
        createEl('span', 'meta-location', fossil.location.split(',')[0])
    );
    content.append(meta, createEl('span', 'fossil-card-action', 'View details'));
    card.append(imageWrap, content);

    return card;
}

// ========================================
// Filters
// ========================================
function initFilters() {
    if (filtersInitialized) return;
    filtersInitialized = true;

    const searchInput = document.getElementById('searchInput');
    const searchClear = document.getElementById('searchClear');
    const speciesFilter = document.getElementById('speciesFilter');
    const locationFilter = document.getElementById('locationFilter');
    const sortFilter = document.getElementById('sortFilter');

    // Populate species filter
    getUniqueSpecies().forEach(species => {
        const option = document.createElement('option');
        option.value = species;
        option.textContent = species;
        speciesFilter.appendChild(option);
    });

    // Populate location filter
    getUniqueLocations().forEach(location => {
        const option = document.createElement('option');
        option.value = location;
        option.textContent = location;
        locationFilter.appendChild(option);
    });

    // Search input
    let searchTimeout;
    searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(applyFilters, 300);
    });

    // Clear search
    searchClear.addEventListener('click', () => {
        searchInput.value = '';
        applyFilters();
    });

    // Filter changes
    speciesFilter.addEventListener('change', applyFilters);
    locationFilter.addEventListener('change', applyFilters);
    sortFilter.addEventListener('change', applyFilters);
}

function applyFilters() {
    const search = document.getElementById('searchInput').value.toLowerCase();
    const species = document.getElementById('speciesFilter').value;
    const location = document.getElementById('locationFilter').value;
    const sort = document.getElementById('sortFilter').value;

    // Filter
    filteredFossils = FOSSIL_DATA.filter(fossil => {
        // Search filter
        if (search) {
            const searchable = [
                fossil.species,
                fossil.specimen,
                fossil.location,
                fossil.description,
                fossil.significance,
                fossil.discoverer
            ].join(' ').toLowerCase();

            if (!searchable.includes(search)) return false;
        }

        // Species filter
        if (species && fossil.species !== species) return false;

        // Location filter
        if (location && !fossil.location.includes(location)) return false;

        return true;
    });

    // Sort
    switch (sort) {
        case 'age-desc':
            filteredFossils.sort((a, b) => b.ageNumeric - a.ageNumeric);
            break;
        case 'age-asc':
            filteredFossils.sort((a, b) => a.ageNumeric - b.ageNumeric);
            break;
        case 'name-asc':
            filteredFossils.sort((a, b) => a.species.localeCompare(b.species));
            break;
        case 'year-desc':
            filteredFossils.sort((a, b) => b.yearDiscovered - a.yearDiscovered);
            break;
    }

    if (!catalogInitialized) initCatalog();
    renderCatalog();
}

// ========================================
// Modal
// ========================================
function initModal() {
    const modal = document.getElementById('fossilModal');
    const closeBtn = document.getElementById('modalClose');
    const backdrop = modal.querySelector('.modal-backdrop');

    closeBtn.addEventListener('click', closeModal);
    backdrop.addEventListener('click', closeModal);

    // Close on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
            closeLightbox();
        }
        // Focus trap for modal
        if (e.key === 'Tab' && modal.classList.contains('active')) {
            trapFocus(e, modal);
        }
    });
}

function trapFocus(e, container) {
    const focusable = container.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
        last.focus();
        e.preventDefault();
    } else if (!e.shiftKey && document.activeElement === last) {
        first.focus();
        e.preventDefault();
    }
}

function openModal(fossilId) {
    const modal = document.getElementById('fossilModal');
    const content = document.getElementById('modalContent');
    const fossil = FOSSIL_DATA.find(f => f.id === fossilId);

    if (!fossil) return;

    const eraConfig = ERA_CONFIG[fossil.era];
    const mainImgSrc = thumbnailSrc(fossil.images[0], 1200);

    const detail = createEl('div', 'modal-detail');
    const imageWrap = createEl('div', 'modal-image');
    const mainImage = document.createElement('img');
    mainImage.src = mainImgSrc;
    mainImage.alt = fossil.specimen;
    mainImage.id = 'modalMainImage';
    mainImage.loading = 'eager';
    mainImage.decoding = 'async';
    mainImage.addEventListener('click', () => openLightbox(mainImage.src, `${fossil.specimen} - ${fossil.species}`));
    mainImage.addEventListener('error', () => imageWrap.replaceChildren(createEl('div', 'modal-image-placeholder')));
    imageWrap.append(mainImage);

    if (fossil.images.length > 1) {
        const thumbs = createEl('div', 'modal-thumbnails');
        fossil.images.forEach((img, index) => {
            const thumb = createEl('button', `thumbnail ${index === 0 ? 'active' : ''}`);
            thumb.type = 'button';
            thumb.dataset.index = String(index);
            thumb.setAttribute('aria-label', `View image ${index + 1}`);
            const thumbImg = document.createElement('img');
            thumbImg.src = thumbnailSrc(img, 160);
            thumbImg.alt = `View ${index + 1}`;
            thumbImg.loading = 'lazy';
            thumbImg.decoding = 'async';
            thumb.append(thumbImg);
            thumb.addEventListener('click', () => switchModalImage(fossilId, index));
            thumbs.append(thumb);
        });
        imageWrap.append(thumbs);
    }

    const info = createEl('div', 'modal-info');
    const era = createEl('span', 'modal-era-tag', eraConfig.label);
    era.style.background = `${eraConfig.color}20`;
    era.style.color = eraConfig.color;
    const species = createEl('h2', 'modal-species', fossil.species);
    species.id = 'modalSpecies';
    const overview = createEl(
        'p',
        'modal-overview',
        `${fossil.specimen} is documented from ${fossil.location} and dated to ${fossil.age}.`
    );

    info.append(
        era,
        species,
        createEl('h3', 'modal-specimen', fossil.specimen),
        overview,
        createMetaGrid([
            ['Age', fossil.age],
            ['Location', fossil.location],
            ['Discovered', String(fossil.yearDiscovered)],
            ['Discoverer(s)', fossil.discoverer]
        ]),
        createTextSection('modal-description', 'Description', fossil.description),
        createTextSection('modal-significance', 'Significance', fossil.significance),
        createCitationSection(fossil)
    );

    detail.append(imageWrap, info);
    content.replaceChildren(detail);

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    // Focus close button for accessibility
    setTimeout(() => document.getElementById('modalClose')?.focus(), 100);
}

function closeModal() {
    const modal = document.getElementById('fossilModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

function createMetaGrid(items) {
    const grid = createEl('div', 'modal-meta-grid');
    items.forEach(([label, value]) => {
        const item = createEl('div', 'meta-item');
        item.append(
            createEl('div', 'meta-label', label),
            createEl('div', 'meta-value', value)
        );
        grid.append(item);
    });
    return grid;
}

function createTextSection(className, heading, text) {
    const section = createEl('div', className);
    section.append(createEl('h3', '', heading), createEl('p', '', text));
    return section;
}

function createCitationSection(fossil) {
    const section = createEl('div', 'modal-citation');
    const paragraph = document.createElement('p');
    const citation = fossil.citation;
    const match = citation.match(/DOI:\s*([\d./\w-]+)/i);

    if (!match) {
        if (fossil.primaryPaperUrl) {
            const link = document.createElement('a');
            link.href = fossil.primaryPaperUrl;
            link.target = '_blank';
            link.rel = 'noopener';
            link.textContent = citation;
            paragraph.append(link);
        } else {
            paragraph.textContent = citation;
        }
    } else {
        const [full, doi] = match;
        paragraph.append(document.createTextNode(citation.slice(0, match.index)));
        const link = document.createElement('a');
        link.href = `https://doi.org/${doi}`;
        link.target = '_blank';
        link.rel = 'noopener';
        link.textContent = full;
        paragraph.append(link, document.createTextNode(citation.slice(match.index + full.length)));
    }

    section.append(createEl('h3', '', 'Citation'), paragraph);
    return section;
}

// ========================================
// Lightbox
// ========================================
function initLightbox() {
    const lightbox = document.getElementById('lightbox');
    const closeBtn = lightbox.querySelector('.lightbox-close');

    closeBtn.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) closeLightbox();
    });
}

function openLightbox(src, caption) {
    const lightbox = document.getElementById('lightbox');
    const img = document.getElementById('lightboxImg');
    const captionEl = document.getElementById('lightboxCaption');

    img.src = src;
    captionEl.textContent = caption;
    lightbox.classList.add('active');
}

function closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    lightbox.classList.remove('active');
}

// Make openLightbox globally accessible
window.openLightbox = openLightbox;

// Switch modal image for galleries
function switchModalImage(fossilId, index) {
    const fossil = FOSSIL_DATA.find(f => f.id === fossilId);
    if (!fossil || !fossil.images[index]) return;

    const imgSrc = thumbnailSrc(fossil.images[index], 1200);
    const mainImg = document.getElementById('modalMainImage');

    if (mainImg) {
        mainImg.src = imgSrc;
        mainImg.onclick = () => openLightbox(imgSrc, `${fossil.specimen} - ${fossil.species}`);
    }

    // Update active thumbnail
    document.querySelectorAll('.modal-thumbnails .thumbnail').forEach((thumb, i) => {
        thumb.classList.toggle('active', i === index);
    });
}
window.switchModalImage = switchModalImage;

// ========================================
// Scroll Effects
// ========================================
function initScrollEffects() {
    // Animate elements on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe section headers
    document.querySelectorAll('.section-header, .about-content, .evolution-tree').forEach(el => {
        observer.observe(el);
    });

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// ========================================
// Utility Functions
// ========================================
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function thumbnailSrc(filename, size) {
    const base = filename.replace(/\.[^.]+$/, '');
    return `images/fossils/thumbs/${base}-${size}.webp`;
}

function createEl(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined) el.textContent = text;
    return el;
}

// Handle window resize for timeline
window.addEventListener('resize', debounce(() => {
    const activeEra = document.querySelector('.era-btn.active');
    if (activeEra) {
        renderTimeline(activeEra.dataset.era);
    }
}, 250));
