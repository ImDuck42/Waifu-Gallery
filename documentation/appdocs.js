function changeTab(event, tabId) {
    // Hide all code examples
    const codeExamples = document.getElementsByClassName("code-example");
    for (let i = 0; i < codeExamples.length; i++) {
        codeExamples[i].style.display = "none";
    }

    // Remove 'active' class from all tabs
    const tabs = document.getElementsByClassName("tab");
    for (let i = 0; i < tabs.length; i++) {
        tabs[i].className = tabs[i].className.replace(" active", "");
    }

    // Show the selected code example and add 'active' class to the clicked tab
    document.getElementById(tabId).style.display = "block";
    event.currentTarget.className += " active";
}

document.addEventListener("DOMContentLoaded", () => {
    const sections = document.querySelectorAll(".docs-section");
    const navLinks = document.querySelectorAll(".quick-nav-link");

    window.addEventListener("scroll", () => {
        let current = "None"; // Default to None
        sections.forEach((section) => {
            const sectionTop = section.offsetTop - 100;
            const sectionHeight = section.offsetHeight;
            if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
                current = section.getAttribute("id");
            }
        });

        // Update active navigation link
        navLinks.forEach((link) => {
            link.classList.remove("active");
            if (link.getAttribute("href").includes(current)) {
                link.classList.add("active");
            }
        });

        // Update the URL hash or clear it if no section is active
        if (current !== "None") {
            history.pushState(null, null, `#${current}`);
        } else {
            history.pushState(null, null, ' '); // Clear the hash
        }
    });

    // Add smooth scrolling to quick navigation links
    navLinks.forEach((link) => {
        link.addEventListener("click", (event) => {
            event.preventDefault();
            const targetId = link.getAttribute("href").substring(1);
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: "smooth" });
            }
        });
    });
});