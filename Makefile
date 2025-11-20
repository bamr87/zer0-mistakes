# Makefile for jekyll-theme-zer0 gem automation

# Default target
.DEFAULT_GOAL := help

# Color definitions
RED    := \033[31m
GREEN  := \033[32m
YELLOW := \033[33m
BLUE   := \033[34m
BOLD   := \033[1m
RESET  := \033[0m

# Get current version from package.json
VERSION := $(shell jq -r '.version' package.json 2>/dev/null || echo "unknown")

##@ Setup Commands

.PHONY: setup
setup: ## Set up development environment
	@echo "$(GREEN)Setting up development environment...$(RESET)"
	@chmod +x scripts/*.sh
	@./scripts/setup.sh

.PHONY: install
install: setup ## Alias for setup

##@ Development Commands

.PHONY: test
test: ## Run all tests and validations
	@echo "$(BLUE)Running tests...$(RESET)"
	@./scripts/test.sh

.PHONY: test-verbose
test-verbose: ## Run tests with verbose output
	@echo "$(BLUE)Running tests (verbose)...$(RESET)"
	@./scripts/test.sh --verbose

.PHONY: lint
lint: ## Run linting and code quality checks
	@echo "$(BLUE)Running lint checks...$(RESET)"
	@if [ -f .rubocop.yml ]; then rubocop; else echo "No RuboCop config found"; fi
	@gem specification jekyll-theme-zer0.gemspec > /dev/null && echo "$(GREEN)✓ Gemspec is valid$(RESET)"

##@ Version Management

.PHONY: version
version: ## Show current version
	@echo "$(BOLD)Current version:$(RESET) $(VERSION)"

.PHONY: version-patch
version-patch: test ## Bump patch version (0.1.8 → 0.1.9)
	@echo "$(YELLOW)Bumping patch version...$(RESET)"
	@./scripts/version.sh patch

.PHONY: version-minor
version-minor: test ## Bump minor version (0.1.8 → 0.2.0)
	@echo "$(YELLOW)Bumping minor version...$(RESET)"
	@./scripts/version.sh minor

.PHONY: version-major
version-major: test ## Bump major version (0.1.8 → 1.0.0)
	@echo "$(YELLOW)Bumping major version...$(RESET)"
	@./scripts/version.sh major

.PHONY: version-dry-run
version-dry-run: ## Preview version bump without applying changes
	@echo "$(BLUE)Version bump preview (patch):$(RESET)"
	@./scripts/version.sh patch --dry-run

##@ Build Commands

.PHONY: build
build: test ## Build the gem
	@echo "$(GREEN)Building gem...$(RESET)"
	@./scripts/build.sh

.PHONY: build-dry-run
build-dry-run: ## Preview build process without creating gem
	@echo "$(BLUE)Build preview:$(RESET)"
	@./scripts/build.sh --dry-run

.PHONY: publish
publish: build ## Build and publish gem to RubyGems
	@echo "$(RED)$(BOLD)Publishing gem to RubyGems...$(RESET)"
	@./scripts/build.sh --publish

.PHONY: publish-dry-run
publish-dry-run: ## Preview publish process without uploading
	@echo "$(BLUE)Publish preview:$(RESET)"
	@./scripts/build.sh --publish --dry-run

##@ Release Workflow

.PHONY: release-patch
release-patch: version-patch build publish ## Full patch release workflow
	@echo "$(GREEN)$(BOLD)Patch release complete!$(RESET)"

.PHONY: release-minor
release-minor: version-minor build publish ## Full minor release workflow
	@echo "$(GREEN)$(BOLD)Minor release complete!$(RESET)"

.PHONY: release-major
release-major: version-major build publish ## Full major release workflow
	@echo "$(GREEN)$(BOLD)Major release complete!$(RESET)"

##@ Git Commands

.PHONY: push
push: ## Push changes and tags to remote repository
	@echo "$(BLUE)Pushing to remote repository...$(RESET)"
	@git push origin main --tags

.PHONY: status
status: ## Show git status and gem info
	@echo "$(BOLD)Git Status:$(RESET)"
	@git status --short
	@echo ""
	@echo "$(BOLD)Current Version:$(RESET) $(VERSION)"
	@echo "$(BOLD)Last Tag:$(RESET) $$(git describe --tags --abbrev=0 2>/dev/null || echo 'none')"
	@echo "$(BOLD)Gem Files:$(RESET)"
	@ls -la *.gem 2>/dev/null || echo "No gem files found"

##@ Cleanup Commands

.PHONY: clean
clean: ## Remove built gems and temporary files
	@echo "$(YELLOW)Cleaning up...$(RESET)"
	@rm -f *.gem
	@rm -f .bundle/config
	@echo "$(GREEN)Cleanup complete$(RESET)"

.PHONY: clean-all
clean-all: clean ## Remove all generated files including dependencies
	@echo "$(YELLOW)Deep cleaning...$(RESET)"
	@rm -rf vendor/
	@rm -rf .bundle/
	@bundle install
	@echo "$(GREEN)Deep cleanup complete$(RESET)"

##@ Utility Commands

.PHONY: deps
deps: ## Install/update dependencies
	@echo "$(BLUE)Installing dependencies...$(RESET)"
	@bundle install

.PHONY: check
check: ## Run comprehensive health check
	@echo "$(BOLD)Health Check:$(RESET)"
	@echo "Ruby: $$(ruby --version)"
	@echo "Bundler: $$(bundle --version)"
	@echo "jq: $$(jq --version 2>/dev/null || echo 'not installed')"
	@echo "Git: $$(git --version)"
	@echo ""
	@$(MAKE) test

.PHONY: info
info: ## Show project information
	@echo "$(BOLD)Project Information:$(RESET)"
	@echo "Name: jekyll-theme-zer0"
	@echo "Version: $(VERSION)"
	@echo "Repository: https://github.com/bamr87/zer0-mistakes"
	@echo "RubyGems: https://rubygems.org/gems/jekyll-theme-zer0"
	@echo ""
	@echo "$(BOLD)Available Scripts:$(RESET)"
	@ls -la scripts/*.sh

##@ Help

.PHONY: help
help: ## Display this help message
	@awk 'BEGIN {FS = ":.*##"; printf "\n$(BOLD)Usage:$(RESET)\n  make $(BLUE)<target>$(RESET)\n"} /^[a-zA-Z_0-9-]+:.*?##/ { printf "  $(BLUE)%-15s$(RESET) %s\n", $$1, $$2 } /^##@/ { printf "\n$(BOLD)%s$(RESET)\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

# Safety checks for destructive operations
.PHONY: _check-clean
_check-clean:
	@if [ -n "$$(git status --porcelain)" ]; then \
		echo "$(RED)Error: Working directory is not clean$(RESET)"; \
		echo "Please commit or stash your changes first"; \
		exit 1; \
	fi

# Add safety check to version bump commands
version-patch: _check-clean
version-minor: _check-clean  
version-major: _check-clean
