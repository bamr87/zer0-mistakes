/**
 * Auto-hide navbar on scroll with enhanced UX
 * 
 * Behavior:
 * - Navbar is fixed at top and visible by default
 * - Hides when scrolling DOWN past a threshold (80px)
 * - Reappears when scrolling UP
 * - Shows immediately when near top of page
 * - Respects prefers-reduced-motion accessibility setting
 * - Adds body padding to prevent content jump
 * - Smooth transitions for better visual experience
 */
(function() {
    'use strict';

    // Configuration
    const SCROLL_THRESHOLD = 80; // Reduced from 100px for quicker response
    const SCROLL_DELTA = 3; // Reduced from 5px for smoother detection
    const SHOW_ON_TOP_OFFSET = 50; // Show navbar when within 50px of top

    document.addEventListener('DOMContentLoaded', function() {
        const navbar = document.getElementById('navbar');
        if (!navbar) return;

        let lastScrollTop = 0;
        let ticking = false;
        let isNavbarHidden = false;

        // Check for reduced motion preference
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        // Calculate and set body padding to prevent content jump
        function updateBodyPadding() {
            const navbarHeight = navbar.offsetHeight;
            document.body.style.paddingTop = navbarHeight + 'px';
        }

        // Initial padding setup
        updateBodyPadding();

        // Update padding on window resize with debounce
        let resizeTimeout;
        window.addEventListener('resize', function() {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(updateBodyPadding, 150);
        }, { passive: true });

        // Enhanced scroll handler with better logic
        function handleScroll() {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const scrollDelta = scrollTop - lastScrollTop;

            // Only trigger if scroll delta exceeds minimum threshold
            if (Math.abs(scrollDelta) < SCROLL_DELTA) {
                ticking = false;
                return;
            }

            // Always show navbar when near top of page
            if (scrollTop <= SHOW_ON_TOP_OFFSET) {
                if (isNavbarHidden) {
                    navbar.classList.remove('navbar-hidden');
                    isNavbarHidden = false;
                }
                lastScrollTop = scrollTop;
                ticking = false;
                return;
            }

            // Hide navbar when scrolling down past threshold
            if (scrollDelta > 0 && scrollTop > SCROLL_THRESHOLD) {
                if (!isNavbarHidden) {
                    navbar.classList.add('navbar-hidden');
                    isNavbarHidden = true;
                }
            } 
            // Show navbar when scrolling up
            else if (scrollDelta < 0) {
                if (isNavbarHidden) {
                    navbar.classList.remove('navbar-hidden');
                    isNavbarHidden = false;
                }
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

        // Apply smooth transition (unless user prefers reduced motion)
        if (!prefersReducedMotion) {
            navbar.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s ease';
        } else {
            navbar.style.transition = 'none';
        }

        // Add CSS for the hidden state if not already present
        if (!document.getElementById('navbar-autohide-styles')) {
            const style = document.createElement('style');
            style.id = 'navbar-autohide-styles';
            style.textContent = `
                #navbar.navbar-hidden {
                    transform: translateY(-100%);
                    box-shadow: none;
                }
                #navbar {
                    will-change: transform;
                }
            `;
            document.head.appendChild(style);
        }
    });
})();