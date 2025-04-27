// Theme Toggle Logic
document.addEventListener('DOMContentLoaded', () => {
    const themeSelector = document.getElementById('theme-toggle'); // Match the id in HTML
    const savedTheme = localStorage.getItem('theme') || 'light';

    // Apply the saved theme
    document.documentElement.setAttribute('data-theme', savedTheme);
    if (themeSelector) {
        themeSelector.value = savedTheme;

        // Update theme on selection change
        themeSelector.addEventListener('change', () => {
            const selectedTheme = themeSelector.value;
            document.documentElement.setAttribute('data-theme', selectedTheme);
            localStorage.setItem('theme', selectedTheme);
        });
    }

    // Add 'loaded' class to body for page transition
    document.body.classList.add('loaded');
});