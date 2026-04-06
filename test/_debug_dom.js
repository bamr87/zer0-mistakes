const { chromium } = require('@playwright/test');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({width: 1280, height: 720});

  // Intercept classList.remove and setAttribute to get stack trace
  await page.addInitScript(() => {
    window.__stacks = [];
    const origRemove = DOMTokenList.prototype.remove;
    DOMTokenList.prototype.remove = function(...tokens) {
      if (tokens.includes('active')) {
        // Get the owning element via the internal [[associatedElement]]
        // Walk up to check if it's inside admin-sidebar  
        const el = this[Symbol.for('__el')] || (() => {
          // Brute force - check all elements in admin-sidebar
          const nav = document.querySelector('nav.admin-sidebar');
          if (nav) {
            const links = nav.querySelectorAll('.nav-link');
            for (const l of links) {
              if (l.classList === this) return l;
            }
          }
          return null;
        })();
        if (el) {
          window.__stacks.push({
            method: 'classList.remove',
            stack: new Error().stack
          });
        }
      }
      return origRemove.apply(this, tokens);
    };
    const origSetAttr = Element.prototype.setAttribute;
    Element.prototype.setAttribute = function(name, value) {
      if (name === 'class' && this.closest && this.classList.contains('active') && !value.includes('active')) {
        if (this.closest('nav.admin-sidebar')) {
          window.__stacks.push({
            method: 'setAttribute',
            stack: new Error().stack
          });
        }
      }
      return origSetAttr.call(this, name, value);
    };
  });

  await page.goto('http://localhost:4000/about/config/', { waitUntil: 'networkidle' });
  
  const stacks = await page.evaluate(() => window.__stacks || []);
  if (stacks.length > 0) {
    console.log('Caught stacks:', JSON.stringify(stacks, null, 2));
  } else {
    console.log('No stacks caught via patches.');
    // Try checking what events/scripts loaded
    const scripts = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('script[src]')).map(s => s.src);
    });
    console.log('Scripts loaded:', JSON.stringify(scripts.filter(s => !s.includes('vendor')), null, 2));
  }
  
  await browser.close();
})();
