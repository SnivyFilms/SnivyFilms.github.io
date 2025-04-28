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

    // Fetch README.md files for code projects
    const codeItems = document.querySelectorAll(".code-item");

    codeItems.forEach(item => {
        const repo = item.getAttribute("data-repo");
        const readmeElement = item.querySelector(".readme");
        const releaseButton = item.querySelector(".release-button");

        // Fetch README.md
        fetch(`https://api.github.com/repos/${repo}/readme`, {
            headers: { Accept: "application/vnd.github.v3.raw" }
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error("Failed to fetch README");
                }
                return response.text();
            })
            .then(readme => {
                readmeElement.textContent = readme.substring(0, 200) + "...";
            })
            .catch(() => {
                readmeElement.textContent = "README not available.";
            });

        // Check for releases
        fetch(`https://api.github.com/repos/${repo}/releases`, {
            headers: { Accept: "application/vnd.github.v3+json" }
        })
            .then(response => response.json())
            .then(releases => {
                if (releases.length > 0) {
                    releaseButton.href = `https://github.com/${repo}/releases`;
                    releaseButton.style.display = "inline-block";
                }
            })
            .catch(() => {
                console.error(`No releases found for ${repo}`);
            });
    });
});