/**
 * SafeSphere Core UI Interactions
 * Handles Bhashini Multilingual Widget & Glassmorphic Menu
 */

document.addEventListener('DOMContentLoaded', () => {
    initBhashini();
});

/**
 * Bhashini Multilingual Widget Logic
 */
function initBhashini() {
    const trigger = document.getElementById('bhashini-trigger');
    const menu = document.getElementById('bhashini-menu');
    const langOptions = document.querySelectorAll('.lang-option');

    // Toggle Menu
    trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        menu.classList.toggle('active');
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!menu.contains(e.target) && !trigger.contains(e.target)) {
            menu.classList.remove('active');
        }
    });

    // Language Selection Handling
    langOptions.forEach(option => {
        option.addEventListener('click', () => {
            const langCode = option.getAttribute('data-lang');
            const langName = option.textContent;

            // Update UI
            langOptions.forEach(opt => opt.classList.remove('active'));
            option.classList.add('active');

            // Close menu
            setTimeout(() => {
                menu.classList.remove('active');
                
                // 1. Attempt official script trigger if available
                triggerNativeTranslation(langCode);
                
                // 2. Fallback notification
                showToast(`Switched to ${langName}`);
            }, 300);
        });
    });
}

function triggerNativeTranslation(langCode) {
    try {
        console.log(`Bhashini Bridge: Triggering translation for code [${langCode}]`);
        
        // 1. Check if Bhashini is fully loaded and UI is injected
        const bhashiniReady = document.querySelector('.bhashini-plugin-container') && 
                             (window.selectLanguage || window.bhashiniTranslationPlugin);

        if (!bhashiniReady) {
            console.warn('Bhashini Bridge: Script or Container not fully ready. Retrying in 500ms...');
            setTimeout(() => triggerNativeTranslation(langCode), 500);
            return;
        }

        // 2. Dynamically find the correct label for the langCode
        // Some versions use 'Hindi (हिन्दी)', some 'हिन्दी (Hindi)', some just 'Hindi'.
        // We first try to find a match in Bhashini's internal list if available.
        let langLabel = null;
        if (window.supportedTargetLangArr && Array.isArray(window.supportedTargetLangArr)) {
            const matchedObj = window.supportedTargetLangArr.find(l => {
                const normalizedCode = langCode.toLowerCase();
                const normalizedLabel = (l.label || "").toLowerCase();
                const normalizedObjCode = (l.code || "").toLowerCase();
                return normalizedObjCode === normalizedCode || 
                       normalizedLabel.includes(normalizedCode) || 
                       (normalizedCode === 'hi' && normalizedLabel.includes('hindi')) ||
                       (normalizedCode === 'bn' && normalizedLabel.includes('bengali'));
            });
            langLabel = matchedObj ? matchedObj.label : null;
        }

        // Fallback mapping if dynamic detection fails
        if (!langLabel) {
            const langMap = {
                'hi': 'Hindi (हिन्दी)', 'bn': 'Bengali (বাংলা)', 'te': 'Telugu (తెలుగు)',
                'mr': 'Marathi (मराठी)', 'ta': 'Tamil (தமிழ்)', 'ur': 'Urdu (اردو)',
                'gu': 'Gujarati (ગુજરાતી)', 'ml': 'Malayalam (മലയാളം)', 'kn': 'Kannada (ಕನ್ನಡ)',
                'or': 'Odia (ଓଡ଼ିଆ)', 'pa': 'Punjabi (ਪੰਜਾਬੀ)', 'as': 'Assamese (অসমীয়া)',
                'mai': 'Maithili (मैथिली)', 'sat': 'Santali (संताली)', 'ks': 'Kashmiri (کٲشُر)',
                'ne': 'Nepali (नेपाली)', 'kok': 'Konkani (कोंकणी)', 'sd': 'Sindhi (سنڌي)',
                'doi': 'Dogri (डोगरी)', 'mni': 'Manipuri (মৈতেইলোন)', 'brx': 'Bodo (बोडो)',
                'sa': 'Sanskrit (संस्कृतम्)', 'en': 'English'
            };
            langLabel = langMap[langCode] || langCode;
        }

        console.log(`Bhashini Bridge: Best match label [${langLabel}]`);

        // 3. Attempt trigger methods
        if (typeof window.selectLanguage === 'function') {
            try {
                window.selectLanguage(langLabel);
            } catch (e) {
                console.log('Bhashini Bridge: Label trigger failed, trying ISO code...');
                window.selectLanguage(langCode);
            }
        } 
        else if (window.bhashiniTranslationPlugin && window.bhashiniTranslationPlugin.translate) {
            window.bhashiniTranslationPlugin.translate(langCode);
        }
        
        // 4. Fallback: Directly trigger any injected select element
        const hiddenSelect = document.querySelector('.bhashini-plugin-container select');
        if (hiddenSelect) {
            hiddenSelect.value = langCode;
            hiddenSelect.dispatchEvent(new Event('change'));
        }

    } catch (err) {
        console.error('Bhashini Bridge Error:', err);
        // Attempt to recover by triggering a general translation cycle if exposed
        if (typeof window.translateAllTextNodes === 'function') {
             window.translateAllTextNodes();
        }
    }
}

/**
 * Premium UI Notifications
 */
function showToast(message) {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        bottom: 30px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(15, 23, 42, 0.9);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(16, 185, 129, 0.3);
        color: white;
        padding: 12px 24px;
        border-radius: 30px;
        font-family: 'Outfit', sans-serif;
        font-size: 0.9rem;
        z-index: 100000;
        box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        opacity: 0;
        transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    `;
    toast.textContent = `🌐 ${message}`;
    document.body.appendChild(toast);

    // Animate in
    setTimeout(() => {
        toast.style.opacity = '1';
        toast.style.bottom = '40px';
    }, 10);

    // Animate out
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.bottom = '30px';
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}
