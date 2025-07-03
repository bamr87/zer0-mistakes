#!/bin/bash

# Version Automation Evolution Seed - Setup Script
# Embodies IT-Journey principles: DFF, DRY, KIS, AIPD

set -e

# Colors for enhanced user experience
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Logging functions with AI-enhanced feedback
log() {
    echo -e "${GREEN}[SEED-SETUP]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

success() {
    echo -e "${PURPLE}[SUCCESS]${NC} $1"
}

# ASCII Art for the evolution seed
echo -e "${CYAN}"
cat << 'EOF'
  🌱 VERSION AUTOMATION EVOLUTION SEED 🌱
  
     ╭─────────────────────────────────────╮
     │  Design for Failure      (DFF)     │
     │  Don't Repeat Yourself   (DRY)     │  
     │  Keep It Simple          (KIS)     │
     │  AI-Powered Development  (AIPD)    │
     ╰─────────────────────────────────────╯
  
     Planting intelligent automation seeds...
EOF
echo -e "${NC}"

# Validate environment requirements
log "🔍 Validating environment prerequisites..."

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    warn "Not in a git repository. Initializing..."
    git init
    git config --get user.name > /dev/null || git config user.name "AI Evolution Engine"
    git config --get user.email > /dev/null || git config user.email "evolution@ai-engine.dev"
fi

# Check Ruby installation and version
if ! command -v ruby &> /dev/null; then
    error "Ruby is not installed. Please install Ruby >= 2.7.0"
fi

RUBY_VERSION=$(ruby --version | awk '{print $2}')
log "✓ Ruby version: $RUBY_VERSION"

# Check Bundler
if ! command -v bundle &> /dev/null; then
    log "Installing Bundler..."
    gem install bundler
else
    info "✓ Bundler available"
fi

# Check jq for JSON processing
if ! command -v jq &> /dev/null; then
    warn "jq not found. Installing via package manager..."
    if command -v brew &> /dev/null; then
        brew install jq
    elif command -v apt-get &> /dev/null; then
        sudo apt-get install -y jq
    elif command -v yum &> /dev/null; then
        sudo yum install -y jq
    else
        error "Please install jq manually for JSON processing"
    fi
fi

info "✓ jq available for JSON processing"

# Check Git configuration
if ! git config --get user.name > /dev/null; then
    error "Git user.name not configured. Run: git config --global user.name 'Your Name'"
fi

if ! git config --get user.email > /dev/null; then
    error "Git user.email not configured. Run: git config --global user.email 'your@email.com'"
fi

info "✓ Git configuration validated"

# Create essential project structure
log "🏗️  Creating evolution-ready project structure..."

# Create directories if they don't exist
mkdir -p scripts
mkdir -p .github/workflows
mkdir -p pages/_about/features
mkdir -p _layouts
mkdir -p _includes
mkdir -p _sass
mkdir -p assets

# Ensure scripts are executable
if [ -d "scripts" ]; then
    chmod +x scripts/*.sh 2>/dev/null || true
fi

# Create package.json if it doesn't exist
if [ ! -f "package.json" ]; then
    log "Creating package.json template..."
    cat > package.json << 'EOF'
{
  "name": "evolved-automation-seed",
  "private": true,
  "version": "0.1.0",
  "description": "AI-enhanced automation seed for Jekyll themes and modern web applications",
  "repository": {
    "type": "git",
    "url": "https://github.com/username/repo.git"
  },
  "keywords": [
    "jekyll",
    "automation",
    "ai-powered",
    "devops",
    "ci-cd"
  ],
  "author": "AI Evolution Engine",
  "license": "MIT",
  "engines": {
    "node": ">= 14.0.0",
    "ruby": ">= 2.7.0"
  }
}
EOF
fi

# Create gemspec template if it doesn't exist
if [ ! -f "*.gemspec" ]; then
    PROJECT_NAME=$(basename "$(pwd)")
    log "Creating gemspec template..."
    cat > "${PROJECT_NAME}.gemspec" << 'EOF'
require "json"

package_json = JSON.parse(File.read("package.json"))

Gem::Specification.new do |s|
  s.name                     = package_json["name"]
  s.version                  = package_json["version"]
  s.authors                  = ["AI Evolution Engine"]
  s.email                    = ["evolution@ai-engine.dev"]

  s.summary                  = "AI-enhanced Jekyll theme with comprehensive automation"
  s.homepage                 = package_json.dig("repository", "url") || "https://github.com/ai-evolution/seed"
  s.license                  = "MIT"
  
  s.metadata["plugin_type"]  = "theme"
  
  s.files                    = `git ls-files -z`.split("\x0").select do |f|
    f.match(%r{^(assets|_(data|includes|layouts|sass)/|(LICENSE|README|CHANGELOG)((\.(txt|md|markdown)|$)))}i)
  end
  
  s.platform                 = Gem::Platform::RUBY
  s.required_ruby_version    = ">= 2.7.0"

  s.add_runtime_dependency "jekyll", "~> 3.9.5"
  s.add_development_dependency "bundler", ">= 2.3.0"
  s.add_development_dependency "rake", "~> 13.0"
end
EOF
fi

# Create Gemfile if it doesn't exist
if [ ! -f "Gemfile" ]; then
    log "Creating Gemfile..."
    cat > Gemfile << 'EOF'
source "https://rubygems.org"
gemspec

# Jekyll and GitHub Pages compatibility
gem 'github-pages'

# Development and testing gems
group :jekyll_plugins do
  gem 'jekyll-remote-theme', "~> 0.4.3"
  gem 'jekyll-feed', "~> 0.17"
  gem 'jekyll-sitemap', "~> 1.4.0"
  gem 'jekyll-seo-tag', "~> 2.8.0"
  gem 'jekyll-paginate', '~> 1.1'
end
EOF
fi

# Create Makefile if it doesn't exist
if [ ! -f "Makefile" ]; then
    log "Creating intelligent Makefile interface..."
    cat > Makefile << 'EOF'
# AI-Enhanced Automation Makefile
# Embodies IT-Journey principles for simple, powerful workflows

# Colors for enhanced user experience
BOLD := \033[1m
RED := \033[31m
GREEN := \033[32m
YELLOW := \033[33m
BLUE := \033[34m
RESET := \033[0m

# Dynamic version detection
VERSION := $(shell jq -r '.version' package.json 2>/dev/null || echo "0.1.0")

.PHONY: help setup test build clean version status
.DEFAULT_GOAL := help

##@ Setup & Maintenance
setup: ## Set up development environment
	@echo "$(GREEN)Setting up evolution-ready environment...$(RESET)"
	@./scripts/setup.sh

clean: ## Remove build artifacts
	@echo "$(YELLOW)Cleaning build artifacts...$(RESET)"
	@rm -f *.gem
	@rm -rf _site
	@rm -rf .sass-cache

##@ Testing & Validation  
test: ## Run comprehensive tests
	@echo "$(BLUE)Running evolution tests...$(RESET)"
	@./scripts/test.sh

test-verbose: ## Run tests with detailed output
	@echo "$(BLUE)Running verbose tests...$(RESET)"
	@./scripts/test.sh --verbose

##@ Version Management
version: ## Show current version
	@echo "$(BOLD)Current version:$(RESET) $(VERSION)"

version-patch: test ## Bump patch version
	@echo "$(YELLOW)Evolving patch version...$(RESET)"
	@./scripts/version.sh patch

version-minor: test ## Bump minor version  
	@echo "$(YELLOW)Evolving minor version...$(RESET)"
	@./scripts/version.sh minor

version-major: test ## Bump major version
	@echo "$(YELLOW)Evolving major version...$(RESET)"
	@./scripts/version.sh major

##@ Build & Release
build: test ## Build project artifacts
	@echo "$(GREEN)Building evolution artifacts...$(RESET)"
	@./scripts/build.sh

publish: build ## Build and publish
	@echo "$(RED)$(BOLD)Publishing to ecosystem...$(RESET)"
	@./scripts/build.sh --publish

##@ Monitoring & Status
status: ## Show git and version status
	@echo "$(BOLD)Evolution Status:$(RESET)"
	@echo "Current Version: $(VERSION)"
	@echo "Git Status:"
	@git status --short
	@echo "Last Tag: $(shell git describe --tags --abbrev=0 2>/dev/null || echo 'No tags')"

check: ## Run comprehensive health check
	@echo "$(BLUE)Evolution Health Check:$(RESET)"
	@echo "Ruby: $(shell ruby --version)"
	@echo "Bundler: $(shell bundle --version)"
	@echo "jq: $(shell jq --version)"
	@echo "Git: $(shell git --version)"
	@echo ""
	@echo "Running tests..."
	@./scripts/test.sh

##@ Help
help: ## Display this help message
	@awk 'BEGIN {FS = ":.*##"; printf "\n$(BOLD)AI Evolution Seed Commands:$(RESET)\n"} /^[a-zA-Z_0-9-]+:.*?##/ { printf "  $(BLUE)%-15s$(RESET) %s\n", $$1, $$2 } /^##@/ { printf "\n$(BOLD)%s$(RESET)\n", substr($$0, 5) } ' $(MAKEFILE_LIST)
EOF
fi

# Install dependencies
log "📦 Installing evolution dependencies..."
if [ -f "Gemfile" ]; then
    bundle install
fi

# Validate project structure
log "🔍 Validating evolution-ready structure..."

# Check for essential files
REQUIRED_FILES=("package.json" "Makefile")
for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        info "✓ $file present"
    else
        warn "⚠ $file missing"
    fi
done

# Check for essential directories
REQUIRED_DIRS=("scripts" ".github/workflows")
for dir in "${REQUIRED_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        info "✓ $dir/ present"
    else
        warn "⚠ $dir/ missing"
    fi
done

# Create CHANGELOG if it doesn't exist
if [ ! -f "CHANGELOG.md" ]; then
    log "Creating evolution changelog..."
    cat > CHANGELOG.md << 'EOF'
# Evolution Changelog

All notable changes to this evolution seed will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial evolution seed with AI-enhanced automation
- Comprehensive testing and validation system
- Intelligent version management workflows
- Production-ready CI/CD integration
- Self-documenting project structure

### Evolution Principles
- Design for Failure (DFF) implementation
- Don't Repeat Yourself (DRY) architecture  
- Keep It Simple (KIS) user interface
- AI-Powered Development (AIPD) enhancement

EOF
fi

# Set up Git hooks for evolution tracking
if [ -d ".git" ]; then
    log "🪝 Setting up evolution tracking hooks..."
    mkdir -p .git/hooks
    
    # Pre-commit hook for validation
    cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
# Evolution Seed Pre-commit Hook

echo "🧬 Running evolution validation..."

# Validate package.json
if ! jq empty package.json > /dev/null 2>&1; then
    echo "❌ Invalid package.json format"
    exit 1
fi

# Validate gemspec if present
for gemspec in *.gemspec; do
    if [ -f "$gemspec" ]; then
        if ! gem specification "$gemspec" > /dev/null 2>&1; then
            echo "❌ Invalid gemspec: $gemspec"
            exit 1
        fi
    fi
done

echo "✅ Evolution validation passed"
EOF
    chmod +x .git/hooks/pre-commit
fi

# Create .gitignore optimized for evolution
if [ ! -f ".gitignore" ]; then
    log "Creating evolution-optimized .gitignore..."
    cat > .gitignore << 'EOF'
# Evolution Build Artifacts
*.gem
pkg/
_site/
.sass-cache/
.jekyll-cache/
.jekyll-metadata

# Dependency directories
node_modules/
.bundle/
vendor/

# Environment and configuration
.env
.env.local
.DS_Store
Thumbs.db

# IDE and editor files
.vscode/
.idea/
*.swp
*.swo
*~

# Logs
*.log

# Temporary files
.tmp/
tmp/
EOF
fi

# Final validation and success message
log "🧪 Running final evolution validation..."

# Test basic functionality
if command -v jq &> /dev/null && [ -f "package.json" ]; then
    VERSION=$(jq -r '.version' package.json)
    success "✅ Evolution seed planted successfully!"
    success "🌱 Version: $VERSION"
    success "🎯 Ready for AI-enhanced development"
else
    warn "⚠ Basic validation failed - please check requirements"
fi

# Display next steps
echo ""
echo -e "${CYAN}🚀 Next Evolution Steps:${NC}"
echo "1. Run 'make test' to validate your environment"
echo "2. Run 'make version-patch' to start version evolution"
echo "3. Run 'make build' to create evolution artifacts"
echo "4. Run 'make help' to see all available commands"
echo ""
echo -e "${PURPLE}🧬 Your evolution seed is ready to grow!${NC}"

# Log evolution event
echo "$(date): Evolution seed planted successfully" >> .evolution.log
