document.addEventListener("DOMContentLoaded", () => {
    const navButtons = document.querySelectorAll(".nav-btn");
    const activePill = document.getElementById("active-pill");
    const themeBtn = document.getElementById("theme-btn");
    const html = document.documentElement;
    const nav = document.getElementById("nav");
    const glare = document.getElementById("glare");

    // SVGs for the theme toggle
    const sunIcon = `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;
    const moonIcon = `<svg viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;

    // Set initial theme icon
    themeBtn.innerHTML = sunIcon;

    // Function to move the background pill
    function updatePill(btn) {
        if (!btn) return;
        activePill.style.width = `${btn.offsetWidth}px`;
        activePill.style.transform = `translateX(${btn.offsetLeft}px)`;
    }

    // Initialize pill position on load
    const initialActive = document.querySelector(".nav-btn.active");
    if (initialActive) {
        setTimeout(() => {
            updatePill(initialActive);
        }, 50);
    }

    // Handle Nav Clicks
    navButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            navButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            updatePill(btn);
        });
    });

    // Handle Theme Toggle
    themeBtn.addEventListener("click", () => {
        const currentTheme = html.getAttribute("data-theme");
        const newTheme = currentTheme === "light" ? "dark" : "light";
        html.setAttribute("data-theme", newTheme);
        themeBtn.innerHTML = newTheme === "dark" ? moonIcon : sunIcon;
    });

    // Handle Mouse Glare Tracking
    nav.addEventListener("mousemove", (e) => {
        const rect = nav.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        glare.style.left = `${x}px`;
        glare.style.top = `${y}px`;
    });

    nav.addEventListener("mouseenter", () => {
        glare.style.opacity = "1";
    });

    nav.addEventListener("mouseleave", () => {
        glare.style.opacity = "0";
    });

    // Adjust pill position on window resize
    window.addEventListener("resize", () => {
        const activeBtn = document.querySelector(".nav-btn.active");
        if (activeBtn) updatePill(activeBtn);
    });
});