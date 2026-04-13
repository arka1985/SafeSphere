document.addEventListener('DOMContentLoaded', () => {
    // 1. Inject Help Trigger Button
    const triggerBtn = document.createElement('button');
    triggerBtn.className = 'help-trigger';
    triggerBtn.innerHTML = '?';
    triggerBtn.title = 'Show Instructions';
    triggerBtn.onclick = showHelp;
    document.body.appendChild(triggerBtn);

    // 2. Check LocalStorage
    const pageId = window.location.pathname.split('/').pop(); // e.g., 'cobot.html'
    const hideHelp = localStorage.getItem(`hide_help_${pageId}`);

    if (!hideHelp) {
        setTimeout(showHelp, 500); // Auto-show after delay
    }

    // 3. Setup Cursor Hint (if defined)
    const hintEl = document.getElementById('cursorHint');
    if (hintEl) {
        document.addEventListener('mousemove', (e) => {
            hintEl.style.left = e.clientX + 'px';
            hintEl.style.top = e.clientY + 'px';

            // Show hint only on canvas or specific areas if needed
            // For now, simple visibility toggle based on movement or specific targets
            // We'll let the specific demo JS toggle the 'visible' class if needed
            // Or just always show it if it's a "Click to X" demo
        });
    }
});

function showHelp() {
    const modal = document.getElementById('helpModal');
    if (modal) modal.classList.add('active');

    // Hide hint while modal is open
    const hint = document.getElementById('cursorHint');
    if (hint) hint.classList.remove('visible');
}

function closeHelp() {
    const modal = document.getElementById('helpModal');
    if (modal) modal.classList.remove('active');

    // Show hint when modal closes
    const hint = document.getElementById('cursorHint');
    if (hint) hint.classList.add('visible');

    // Check "Don't show again"
    const checkbox = document.getElementById('dontShowAgain');
    if (checkbox && checkbox.checked) {
        const pageId = window.location.pathname.split('/').pop();
        localStorage.setItem(`hide_help_${pageId}`, 'true');
    }
}

// Close on click outside
document.addEventListener('click', (e) => {
    const modal = document.getElementById('helpModal');
    if (e.target === modal) {
        closeHelp();
    }
});

// Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeHelp();
});
