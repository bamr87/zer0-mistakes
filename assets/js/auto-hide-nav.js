// Feature: ZER0-033
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

        // Calculate and set body padding to prevent content jump.
        // The measured height is also published as --zer0-header-height so
        // stylesheets (theme or consumer) can align overlays with the real
        // header instead of hard-coding its pixel height.
        //
        // Layout is never read synchronously here. Reading navbar.offsetHeight
        // at DOMContentLoaded (and again on every resize) forced a style +
        // layout pass while stylesheets were still settling (Lighthouse
        // "forced reflow", ~233ms per read on a throttled phone). Instead:
        //   - ResizeObserver delivers the navbar's border-box height after the
        //     browser's own layout pass, before paint, so the padding still
        //     lands in the first frame;
        //   - without ResizeObserver, the read happens in a requestAnimationFrame
        //     callback, and the write in the frame after it, so a read never
        //     follows a write in the same pass;
        //   - the last height is cached and nothing is written when it is
        //     unchanged.
        let lastNavbarHeight = -1;

        function applyNavbarHeight(height) {
            height = Math.round(height);
            if (height === lastNavbarHeight) return;
            lastNavbarHeight = height;
            document.body.style.paddingTop = height + 'px';
            document.documentElement.style.setProperty('--zer0-header-height', height + 'px');
        }

        if (typeof window.ResizeObserver === 'function') {
            const navbarObserver = new ResizeObserver(function(entries) {
                const entry = entries[entries.length - 1];
                const box = entry.borderBoxSize && (entry.borderBoxSize[0] || entry.borderBoxSize);
                // Layout is already clean inside a ResizeObserver callback, so
                // the offsetHeight fallback (old engines without borderBoxSize)
                // does not force a reflow.
                applyNavbarHeight(box && box.blockSize ? box.blockSize : entry.target.offsetHeight);
            });
            navbarObserver.observe(navbar);
        } else {
            let measureQueued = false;
            const measureNavbar = function() {
                if (measureQueued) return;
                measureQueued = true;
                window.requestAnimationFrame(function() {
                    const height = navbar.offsetHeight; // read
                    window.requestAnimationFrame(function() {
                        measureQueued = false;
                        applyNavbarHeight(height); // write, next frame
                    });
                });
            };
            measureNavbar();

            // Update padding on window resize with debounce
            let resizeTimeout;
            window.addEventListener('resize', function() {
                clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(measureNavbar, 150);
            }, { passive: true });
        }

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
        function onScroll() {
            if (!ticking) {
                window.requestAnimationFrame(handleScroll);
                ticking = true;
            }
        }
        window.addEventListener('scroll', onScroll, { passive: true });

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
            `;
            document.head.appendChild(style);
        }

        // Pause auto-hide when offcanvas is open so fixed positioning works
        const offcanvasEl = document.getElementById('bdNavbar');
        if (offcanvasEl) {
            offcanvasEl.addEventListener('show.bs.offcanvas', function() {
                navbar.classList.remove('navbar-hidden');
                isNavbarHidden = false;
                window.removeEventListener('scroll', onScroll);
            });
            offcanvasEl.addEventListener('hidden.bs.offcanvas', function() {
                lastScrollTop = window.pageYOffset || document.documentElement.scrollTop;
                window.addEventListener('scroll', onScroll, { passive: true });
            });
        }
    });
})();