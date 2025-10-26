# 🚀 Gem Publication System Documentation

This document describes the comprehensive gem publication system for Jekyll Theme Zer0, including VS Code integration and automatic changelog generation.

## 📁 New Publication Script

### `gem-publish.sh` - Comprehensive Publication Workflow

The new comprehensive script that handles the entire gem publication process:

```bash
./scripts/gem-publish.sh [patch|minor|major] [options]
```

#### Key Features:
- 📋 **Automatic Changelog Generation**: Analyzes commit history since last version
- 🔢 **Semantic Versioning**: Handles patch, minor, and major version bumps
- 🧪 **Comprehensive Testing**: Runs full test suite before publication
- 📦 **Gem Building & Validation**: Builds and validates gem packages
- 🚀 **RubyGems Publication**: Publishes to RubyGems.org
- 🏷️ **GitHub Releases**: Creates GitHub releases with assets
- 🔄 **Git Integration**: Handles commits, tags, and repository synchronization

#### Usage Examples:
```bash
# Patch release (bug fixes)
./scripts/gem-publish.sh patch

# Minor release (new features)
./scripts/gem-publish.sh minor

# Major release (breaking changes)
./scripts/gem-publish.sh major

# Preview what would happen (dry run)
./scripts/gem-publish.sh patch --dry-run

# Skip publishing (development testing)
./scripts/gem-publish.sh patch --skip-publish --no-github-release

# Non-interactive mode (CI/CD)
./scripts/gem-publish.sh patch --non-interactive
```

## 🎛️ VS Code Integration

### Launch Configurations (F5 Debug Menu)

New launch configurations in `.vscode/launch.json`:

1. **🚀 Gem Publisher: Patch Release** - Full patch version workflow
2. **🚀 Gem Publisher: Minor Release** - Full minor version workflow  
3. **🚀 Gem Publisher: Major Release** - Full major version workflow
4. **🔍 Gem Publisher: Dry Run (Patch)** - Preview changes without modifications
5. **⚡ Gem Publisher: Quick Build & Test** - Development workflow, skip publishing
6. **📝 Gem Publisher: Changelog Preview** - Preview changelog generation only

### Task Runner (Ctrl+Shift+P → "Tasks: Run Task")

New tasks in `.vscode/tasks.json`:

#### Gem Management Tasks:
- **🚀 Gem: Patch Release** - Full patch release workflow
- **🚀 Gem: Minor Release** - Full minor release workflow  
- **🚀 Gem: Major Release** - Full major release workflow
- **🔍 Gem: Dry Run Preview** - Preview changes without modifications
- **⚡ Gem: Quick Build & Test** - Development workflow (default build task)
- **📝 Gem: Generate Changelog** - Preview changelog generation
- **🧪 Gem: Run Tests Only** - Run test suite only (default test task)
- **🔨 Gem: Build Only** - Build gem without publishing
- **📊 Gem: Version Info** - Display current version and git status

## 📋 Automatic Changelog Generation

### Commit Categorization

The system automatically categorizes commits based on conventional commit prefixes:

#### Added (New Features)
```bash
feat: add user authentication system
feature(api): implement rate limiting
```

#### Fixed (Bug Fixes)
```bash
fix: resolve memory leak in parser
bugfix(ui): correct button alignment issue
```

#### Changed (Modifications)
```bash
chore: update dependencies
refactor: improve code organization
perf: optimize database queries
style: fix code formatting
docs: update API documentation
test: add integration tests
ci: update workflow configuration
build: improve build process
```

#### Security (Security Updates)
```bash
security: patch XSS vulnerability
sec: update authentication tokens
```

#### Deprecated & Removed
```bash
# Deprecated - any commit containing "deprecat"
# Removed
remove: delete legacy API endpoints
rm: clean up unused files
```

### Generated Changelog Format

```markdown
## [1.2.3] - 2025-01-27

### Added
- User authentication system
- API rate limiting functionality

### Changed
- Updated dependencies to latest versions
- Improved code organization and structure

### Fixed
- Resolved memory leak in parser component
- Corrected button alignment in mobile view

### Security
- Patched XSS vulnerability in form processing
```

## 🚦 Complete Workflow Process

### 1. Environment Validation
- Checks git repository status (must be clean)
- Validates required files exist
- Confirms RubyGems authentication
- Verifies command availability

### 2. Changelog Generation
- Analyzes commit history since last version tag
- Categories commits by type (Added, Changed, Fixed, Security, etc.)
- Generates structured changelog entry
- Updates CHANGELOG.md file
- Shows preview for review

### 3. Version Management
- Reads current version from `lib/jekyll-theme-zer0/version.rb`
- Calculates new version based on type (patch/minor/major)
- Updates version in Ruby version file and package.json

### 4. Testing & Building
- Runs comprehensive test suite (`bundle exec rspec`)
- Validates gemspec syntax
- Builds gem package
- Shows package summary

### 5. Publication
- Checks for version conflicts on RubyGems
- Publishes gem to RubyGems.org
- Creates git commit and tag
- Generates GitHub release with gem asset

### 6. Repository Synchronization
- Pushes changes to repository
- Pushes tags to repository
- Updates remote tracking

## 🔧 Prerequisites & Setup

### Required Tools
```bash
# Check if tools are available
which git ruby gem bundle jq gh
```

### Authentication Setup
```bash
# RubyGems authentication
gem signin

# GitHub CLI authentication (for releases)
gh auth login
```

### File Requirements
- `lib/jekyll-theme-zer0/version.rb` - Version definition
- `jekyll-theme-zer0.gemspec` - Gem specification  
- `CHANGELOG.md` - Changelog file
- Clean git working directory

## 🐛 Troubleshooting

### Common Issues

#### "Working directory is not clean"
```bash
git status           # Check what's uncommitted
git add . && git commit -m "commit message"
# or
git stash           # Temporarily stash changes
```

#### "Not authenticated with RubyGems"
```bash
gem signin          # Sign in to RubyGems.org
```

#### "Version already exists"
The script prevents republishing existing versions - you need to bump the version number first.

#### "Tests failed"
Fix test failures before proceeding, or use `--skip-tests` for emergency releases (not recommended).

### Debug Mode
```bash
bash -x ./scripts/gem-publish.sh patch --dry-run
```

## 🔒 Security Features

- Prevents republishing existing versions
- Requires clean git working directory
- Validates gem contents before publishing
- Confirms user intent for destructive operations
- API keys managed securely (RubyGems credentials, GitHub CLI)

## 🎯 How to Use

### For Development (Quick Testing)
1. Use **⚡ Gem: Quick Build & Test** task or launch config
2. This generates changelog, bumps version, runs tests, builds gem
3. But skips publishing to RubyGems

### For Preview (See What Would Happen)
1. Use **🔍 Gem: Dry Run Preview** task or launch config
2. Shows exactly what changes would be made
3. Great for reviewing changelog generation

### For Real Releases
1. Ensure working directory is clean
2. Use appropriate release type:
   - **Patch** (0.0.X): Bug fixes
   - **Minor** (0.X.0): New features, backward compatible
   - **Major** (X.0.0): Breaking changes
3. Use launch config or run: `./scripts/gem-publish.sh [type]`

### Access Methods

#### Via VS Code Debug Panel (F5)
1. Open VS Code
2. Press F5 or go to Run & Debug panel
3. Select desired gem publication configuration
4. Click play button

#### Via VS Code Task Runner
1. Press Ctrl+Shift+P (Cmd+Shift+P on Mac)
2. Type "Tasks: Run Task" 
3. Select desired gem task from the list

#### Via Terminal
```bash
cd /path/to/zer0-mistakes
./scripts/gem-publish.sh patch --dry-run
```

## 📊 Integration Benefits

- **Streamlined Workflow**: One command handles entire publication process
- **Consistent Changelogs**: Automatic generation from commit history
- **Error Prevention**: Comprehensive validation at each step
- **Development Friendly**: Multiple modes for different scenarios
- **VS Code Native**: Integrated with familiar VS Code workflows
- **Documentation**: Automatic GitHub releases with detailed information

---

*This system transforms gem publication from a manual, error-prone process into a reliable, automated workflow while maintaining full control and visibility.*