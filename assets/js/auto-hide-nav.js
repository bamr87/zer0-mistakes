/**
 * Auto-hide navbar on scroll
 * 
 * Behavior:
 * - Navbar is fixed at top and visible by default
 * - Hides when scrolling DOWN past a threshold (100px)
 * - Reappears when scrolling UP
 * - Respects prefers-reduced-motion accessibility setting
 * - Adds body padding to prevent content jump
 */
(function() {
    'use strict';

    // Configuration
    const SCROLL_THRESHOLD = 100; // Pixels before hide/show triggers
    const SCROLL_DELTA = 5; // Minimum scroll distance to trigger change

    document.addEventListener('DOMContentLoaded', function() {
        const navbar = document.getElementById('navbar');
        if (!navbar) return;

        let lastScrollTop = 0;
        let ticking = false;

        // Check for reduced motion preference
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        // Calculate and set body padding to prevent content jump
        function updateBodyPadding() {
            const navbarHeight = navbar.offsetHeight;
            document.body.style.paddingTop = navbarHeight + 'px';
        }

        // Initial padding setup
        updateBodyPadding();

        // Update padding on window resize
        window.addEventListener('resize', updateBodyPadding, { passive: true });

        // Scroll handler
        function handleScroll() {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const scrollDelta = scrollTop - lastScrollTop;

            // Only trigger if scroll delta exceeds minimum threshold
            if (Math.abs(scrollDelta) < SCROLL_DELTA) {
                ticking = false;
                return;
            }

            if (scrollDelta > 0 && scrollTop > SCROLL_THRESHOLD) {
                // Scrolling DOWN past threshold - hide navbar
                navbar.classList.add('navbar-hidden');
            } else if (scrollDelta < 0) {
                // Scrolling UP - show navbar
                navbar.classList.remove('navbar-hidden');
            }

            // Always show navbar when at top of page
            if (scrollTop <= 0) {
                navbar.classList.remove('navbar-hidden');
            }

            lastScrollTop = Math.max(0, scrollTop);
            ticking = false;
        }

        // Optimized scroll listener using requestAnimationFrame
        window.addEventListener('scroll', function() {
            if (!ticking) {
                window.requestAnimationFrame(handleScroll);
                ticking = true;
            }
        }, { passive: true });

        // Disable animations if user prefers reduced motion
        if (prefersReducedMotion) {
            navbar.style.transition = 'none';
        }
    });
})();