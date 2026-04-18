# Quick Access Guide: Theme Version Information

## Where to Find Theme Information

### Option 1: Header Gear Icon (⚙️)

```
┌──────────────────────────────────────────────────┐
│  [☰] Logo  IT-Journey  [⚙️] [☰]                  │ ← Click here!
└──────────────────────────────────────────────────┘
```

The gear icon (⚙️) in the header navigation opens the **Settings & Info** modal containing:

- Theme version and repository
- System and build information
- Active plugins
- Technology stack
- Quick links to documentation

### Option 2: Footer Info Button

```
┌──────────────────────────────────────────────────┐
│  © 2026 IT-Journey — Powered by:                 │
│  [Ruby] [Jekyll] [Bootstrap] [GitHub] [Info] ←   │ Click here!
└──────────────────────────────────────────────────┘
```

The **Info** button in the footer provides the same access point.

## What You'll See

When you click either button, a modal opens showing:

```
╔════════════════════════════════════════╗
║  Settings and Source               [×] ║
╠════════════════════════════════════════╣
║                                        ║
║  📍 Breadcrumbs                        ║
║  🔍 Search                             ║
║                                        ║
║  ℹ️  Theme Information                 ║
║  ┌─────────────────────────────────┐  ║
║  │ 🎨 Theme                         │  ║
║  │   Name: zer0-mistakes            │  ║
║  │   Repository: bamr87/zer0-...    │  ║
║  │   Version: v0.22.13 or Latest    │  ║
║  │   [Changelog] [Documentation]    │  ║
║  └─────────────────────────────────┘  ║
║                                        ║
║  ┌─────────────────────────────────┐  ║
║  │ 💻 Build Environment             │  ║
║  │   Jekyll: v3.9.5                 │  ║
║  │   Ruby: v3.3.x                   │  ║
║  │   Environment: production        │  ║
║  │   Last Build: (dynamic)          │  ║
║  └─────────────────────────────────┘  ║
║                                        ║
║  ┌─────────────────────────────────┐  ║
║  │ 🌐 Site Details                  │  ║
║  │   Repository: bamr87/zer0-...    │  ║
║  │   Branch: main                   │  ║
║  │   Collections: 8 configured      │  ║
║  └─────────────────────────────────┘  ║
║                                        ║
║  ┌─────────────────────────────────┐  ║
║  │ 🔌 Active Plugins                │  ║
║  │   [jekyll-remote-theme]          │  ║
║  │   [jekyll-feed] [jekyll-seo...]  │  ║
║  └─────────────────────────────────┘  ║
║                                        ║
║  ┌─────────────────────────────────┐  ║
║  │ 📚 Technology Stack              │  ║
║  │   Ruby      → 3.3.x              │  ║
║  │   Jekyll    → 3.9.5              │  ║
║  │   Bootstrap → 5.3.3              │  ║
║  │   Docker    → 20.10+             │  ║
║  └─────────────────────────────────┘  ║
║                                        ║
║  🔗 Quick Links:                       ║
║  [GitHub] [VS Code] [Config]           ║
║                                        ║
║  🌓 Dark Mode Toggle                   ║
║                                        ║
║  ❓ Need help?                         ║
║  [Jekyll Docs] [Report Issue]...       ║
║                                        ║
║             [Close]                    ║
╚════════════════════════════════════════╝
```

## Benefits

✅ **Always Available**: Accessible from every page  
✅ **No Navigation**: Direct access from header/footer  
✅ **Comprehensive**: All system info in one place  
✅ **Helpful Links**: Quick access to docs and support  
✅ **Up-to-Date**: Shows actual installed version

## Keyboard Shortcuts

- **ESC** - Close the modal
- **Tab** - Navigate between interactive elements
- **Enter** - Activate buttons and links

## For Developers

The theme information is generated dynamically by:

1. `_plugins/theme_version.rb` - Extracts version during build
2. `_includes/components/theme-info.html` - Renders the display
3. `_includes/components/info-section.html` - Modal container

No configuration needed - it works automatically! 🎉

---

**Pro Tip**: Bookmark this modal for quick access to documentation links and system details while developing your site.
