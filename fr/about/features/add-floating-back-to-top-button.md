---
title: Ajouter un bouton flottant de retour en haut
description: Comment ajouter un bouton flottant qui fait défiler jusqu'en haut d'une
  page ?
date: 2023-03-09 00:15:05.278000000 Z
preview: "/images/previews/add-floating-back-to-top-button.png"
tags: Bootstrap
categories: How-To
sub-title:
author:
excerpt: Étapes pour ajouter un bouton flottant de retour en haut à un site web.
snippet:
lastmod: 2025-12-20 22:15:46.273000000 Z
draft: true
lang: fr
permalink: "/fr/about/features/add-floating-back-to-top-button/"
translation_of: pages/_about/features/add-floating-back-to-top-button.md
translation_source_url: "/about/features/add-floating-back-to-top-button/"
machine_translated: true
translated_from_sha: cbc5f327ba28
---

[w3 schools](https://www.w3schools.com/howto/howto_js_scroll_to_top.asp)

## Comment créer un bouton de retour en haut

---

### Étape 1) Ajouter le HTML :

Créez un bouton qui ramènera l'utilisateur en haut de la page lorsqu'il est cliqué :

```html
<!-- Sidebar-right.html  -->
<!-- Back to Top -->
<button
  onclick="backToTopBtn()"
  id="backToTopBtn"
  title="Go to top"
  class="btn btn-primary"
>
  {{ site.data.ui-text[site.locale].back_to_top | default: 'Back to Top' }}
  &uarr;
</button>
```

#### Étape 2) Ajouter le CSS :

Styliser le bouton :

```scss
// Floating back to top button

#backToTopBtn {
  display: block; /* Hidden by default */
  position: fixed; /* Fixed/sticky position */
  bottom: 20px; /* Place the button at the bottom of the page */
  right: 30px; /* Place the button 30px from the right */
  z-index: 99; /* Make sure it does not overlap */
  border: none; /* Remove borders */
  outline: none; /* Remove outline */
  background-color: $primary; /* Set a background color */
  color: inherit; /* Text color */
  opacity: 50%;
  cursor: pointer; /* Add a mouse pointer on hover */
  padding: 15px; /* Some padding */
  border-radius: 10px; /* Rounded corners */
  font-size: 18px; /* Increase font size */
}

#backToTopBtn {
  .text {
    display: inline-block;
  }

  .arrow {
    display: none;
  }

  @media (max-width: 600px) {
    .text {
      display: none;
    }

    .arrow {
      display: inline-block;
    }
  }
}

#backToTopBtn:hover {
  background-color: #555; /* Add a dark-grey background on hover */
  opacity: 100%;
}
```

### Ajouter le JavaScript

```js
// assets/js/back-to-top.js

document.addEventListener("DOMContentLoaded", (event) => {
  let mybutton = document.getElementById("backToTopBtn");

  function topFunction() {
    document.body.scrollTop = 0; // For Safari
    document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
    mybutton.style.opacity = "75%";
  }

  if (mybutton) {
    mybutton.onclick = topFunction;
  }

  // When the user scrolls down 20px from the top of the document, show the button
  window.onscroll = function () {
    scrollFunction();
  };

  function scrollFunction() {
    if (
      document.body.scrollTop > 20 ||
      document.documentElement.scrollTop > 20
    ) {
      mybutton.style.display = "block";
    } else {
      mybutton.style.display = "none";
    }
  }
});
```

### Ajouter la source JS dans head

```html
<!-- includes/head.html -->

<!-- Custom JS Scripts -->

<script src="/assets/js/back-to-top.js"></script>
```
