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
	@./scripts/bin/test

.PHONY: test-verbose
test-verbose: ## Run tests with verbose output
	@echo "$(BLUE)Running tests (verbose)...$(RESET)"
	@./scripts/bin/test --verbose

.PHONY: validate
validate: ## Run canonical preflight validation
	@echo "$(BLUE)Running preflight validation...$(RESET)"
	@./scripts/validate

.PHONY: validate-quick
validate-quick: ## Run host-only validation checks
	@echo "$(BLUE)Running quick validation...$(RESET)"
	@./scripts/validate --quick

.PHONY: lint
lint: ## Run linting and code quality checks
	@echo "$(BLUE)Running lint checks...$(RESET)"
	@if [ -f .rubocop.yml ]; then rubocop; else echo "No RuboCop config found"; fi
	@gem specification jekyll-theme-zer0.gemspec > /dev/null && echo "$(GREEN)✓ Gemspec is valid$(RESET)"

.PHONY: convert-notebooks
convert-notebooks: ## Convert Jupyter notebooks to Jekyll-compatible Markdown
	@echo "$(BLUE)Converting Jupyter notebooks...$(RESET)"
	@./scripts/convert-notebooks.sh

.PHONY: convert-notebooks-dry-run
convert-notebooks-dry-run: ## Preview notebook conversion without making changes
	@echo "$(BLUE)Previewing notebook conversion...$(RESET)"
	@./scripts/convert-notebooks.sh --dry-run

.PHONY: convert-notebooks-force
convert-notebooks-force: ## Force reconversion of all notebooks
	@echo "$(BLUE)Force converting all notebooks...$(RESET)"
	@./scripts/convert-notebooks.sh --force

.PHONY: list-notebooks
list-notebooks: ## List all notebooks to be converted
	@echo "$(BLUE)Listing notebooks...$(RESET)"
	@./scripts/convert-notebooks.sh --list

.PHONY: clean-notebooks
clean-notebooks: ## Remove converted notebook markdown files
	@echo "$(YELLOW)Cleaning converted notebooks...$(RESET)"
	@./scripts/convert-notebooks.sh --clean

##@ Version Management

.PHONY: version
version: ## Show current version
	@echo "$(BOLD)Current version:$(RESET) $(VERSION)"

.PHONY: version-patch
version-patch: validate-quick ## Preview patch release version changes
	@echo "$(YELLOW)Previewing patch release version changes...$(RESET)"
	@./scripts/bin/release patch --dry-run --skip-publish --no-github-release --non-interactive

.PHONY: version-minor
version-minor: validate-quick ## Preview minor release version changes
	@echo "$(YELLOW)Previewing minor release version changes...$(RESET)"
	@./scripts/bin/release minor --dry-run --skip-publish --no-github-release --non-interactive

.PHONY: version-major
version-major: validate-quick ## Preview major release version changes
	@echo "$(YELLOW)Previewing major release version changes...$(RESET)"
	@./scripts/bin/release major --dry-run --skip-publish --no-github-release --non-interactive

.PHONY: version-dry-run
version-dry-run: ## Preview version bump without applying changes
	@echo "$(BLUE)Version bump preview (patch):$(RESET)"
	@./scripts/bin/release patch --dry-run --skip-publish --no-github-release --non-interactive

##@ Build Commands

.PHONY: build
build: test ## Build the gem
	@echo "$(GREEN)Building gem...$(RESET)"
	@./scripts/build

.PHONY: build-dry-run
build-dry-run: ## Preview build process without creating gem
	@echo "$(BLUE)Build preview:$(RESET)"
	@./scripts/build --dry-run

.PHONY: publish
publish: ## Deprecated: use release-patch, release-minor, or release-major
	@echo "$(YELLOW)Publishing is handled by the release workflow.$(RESET)"
	@echo "Use: make release-patch, make release-minor, or make release-major"
	@exit 1

.PHONY: publish-dry-run
publish-dry-run: ## Preview publish process without uploading
	@echo "$(BLUE)Publish preview:$(RESET)"
	@./scripts/bin/release patch --dry-run --skip-publish --no-github-release --non-interactive

##@ Release Workflow

.PHONY: release-patch
release-patch: ## Full patch release workflow
	@./scripts/bin/release patch

.PHONY: release-minor
release-minor: ## Full minor release workflow
	@./scripts/bin/release minor

.PHONY: release-major
release-major: ## Full major release workflow
	@./scripts/bin/release major

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
