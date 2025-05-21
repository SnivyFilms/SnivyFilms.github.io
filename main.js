document.addEventListener('DOMContentLoaded', () => {
    // Theme Toggle Logic
    const themeSelector = document.getElementById('theme-toggle');
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

    // Photography Gallery Filtering
    const categoryFilter = document.getElementById('category-filter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', filterImages);

        function filterImages() {
            const category = categoryFilter.value;
            const images = document.querySelectorAll('.gallery img');

            images.forEach(img => {
                const src = img.getAttribute('src');

                if (category === 'all') {
                    img.style.display = '';
                } else if (category === 'trains' && src.includes('Images/Trains/')) {
                    img.style.display = '';
                } else if (category === 'nationalparks' && src.includes('Images/National Parks/')) {
                    img.style.display = '';
                } else if (category === 'other' && src.includes('Images/Other/')) {
                    img.style.display = '';
                } else {
                    img.style.display = 'none';
                }
            });
        }
    }

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