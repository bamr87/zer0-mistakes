---
applyTo: "scripts/**"
description: "Shell script development guidelines for automation and tooling scripts"
---

# Shell Script Development Guidelines

## 🛠️ Overview

This document provides guidelines for developing and maintaining shell scripts in the `scripts/` directory. These scripts automate critical tasks including versioning, building, testing, and releasing the Jekyll theme.

## 📋 Script Inventory

### Core Scripts

| Script | Purpose | Usage |
|--------|---------|-------|
| `version.sh` | Semantic version management | `./scripts/version.sh [patch\|minor\|major]` |
| `build.sh` | Build Jekyll site and gem | `./scripts/build.sh` |
| `test.sh` | Run test suite | `./scripts/test.sh` |
| `release.sh` | Complete release workflow | `./scripts/release.sh` |
| `gem-publish.sh` | Publish gem to RubyGems.org | `./scripts/gem-publish.sh` |
| `setup.sh` | Initial project setup | `./scripts/setup.sh` |

## 🔧 Script Development Standards

### Shell Script Best Practices

#### Error Handling
```bash
#!/bin/bash
# Always use strict error handling
set -euo pipefail

# Set up error trap
trap 'echo "Error on line $LINENO"' ERR
```

#### Logging Functions
```bash
# Consistent logging with colors
log_info() {
    echo -e "\033[0;34m[INFO]\033[0m $1"
}

log_success() {
    echo -e "\033[0;32m[SUCCESS]\033[0m $1"
}

log_warning() {
    echo -e "\033[0;33m[WARNING]\033[0m $1"
}

log_error() {
    echo -e "\033[0;31m[ERROR]\033[0m $1" >&2
}
```

#### Parameter Validation
```bash
# Validate required arguments
if [ $# -eq 0 ]; then
    log_error "Usage: $0 <argument>"
    exit 1
fi

# Validate specific values
case "$1" in
    patch|minor|major)
        VERSION_TYPE="$1"
        ;;
    *)
        log_error "Invalid version type. Use: patch, minor, or major"
        exit 1
        ;;
esac
```

#### Environment Detection
```bash
# Detect operating system
detect_os() {
    case "$(uname -s)" in
        Darwin*)    echo "macos" ;;
        Linux*)     echo "linux" ;;
        MINGW*)     echo "windows" ;;
        *)          echo "unknown" ;;
    esac
}

# Detect architecture
detect_arch() {
    case "$(uname -m)" in
        x86_64)     echo "amd64" ;;
        arm64)      echo "arm64" ;;
        aarch64)    echo "arm64" ;;
        *)          echo "unknown" ;;
    esac
}
```

### Script Structure Template

```bash
#!/bin/bash
#
# Script Name: example.sh
# Description: Brief description of what this script does
# Usage: ./scripts/example.sh [options]
# Dependencies: List any required commands or tools
#
# Examples:
#   ./scripts/example.sh --option value
#

set -euo pipefail

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Logging functions
log_info() { echo -e "\033[0;34m[INFO]\033[0m $1"; }
log_success() { echo -e "\033[0;32m[SUCCESS]\033[0m $1"; }
log_error() { echo -e "\033[0;31m[ERROR]\033[0m $1" >&2; }

# Error handling
trap 'log_error "Error on line $LINENO"' ERR

# Main function
main() {
    log_info "Starting script execution..."
    
    # Script logic here
    
    log_success "Script completed successfully"
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
    shift
done

# Execute main function
main "$@"
```

## 🧪 Testing Scripts

### Testing Checklist
- [ ] Test with valid inputs
- [ ] Test with invalid/missing inputs
- [ ] Test error conditions and recovery
- [ ] Test on multiple platforms (macOS, Linux)
- [ ] Test with different shell environments (bash, zsh)
- [ ] Verify exit codes are correct
- [ ] Check that error messages are helpful
- [ ] Ensure idempotency where appropriate

### Manual Testing Commands
```bash
# Test script execution
bash -x ./scripts/script_name.sh  # Debug mode

# Test in isolated environment
docker run -it --rm -v "$PWD:/workspace" -w /workspace ubuntu:latest bash
./scripts/script_name.sh

# Check for shellcheck issues
shellcheck ./scripts/*.sh
```

## 🔒 Security Considerations

### Safe Scripting Practices

1. **Input Validation**: Always validate and sanitize user inputs
   ```bash
   # Validate input before using
   if [[ ! "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
       log_error "Invalid version format"
       exit 1
   fi
   ```

2. **Avoid Command Injection**: Use arrays for command arguments
   ```bash
   # Safe
   args=("--option" "$user_input")
   command "${args[@]}"
   
   # Unsafe
   command --option $user_input
   ```

3. **Secure Temporary Files**: Use proper temp file creation
   ```bash
   TEMP_FILE=$(mktemp)
   trap "rm -f $TEMP_FILE" EXIT
   ```

4. **Credentials**: Never hardcode credentials
   ```bash
   # Use environment variables
   GITHUB_TOKEN="${GITHUB_TOKEN:-}"
   if [ -z "$GITHUB_TOKEN" ]; then
       log_error "GITHUB_TOKEN not set"
       exit 1
   fi
   ```

## 📖 Documentation Requirements

### Script Header Documentation
Every script must include:
- Brief description
- Usage examples
- Required dependencies
- Environment variables needed
- Expected inputs and outputs

### Inline Comments
- Explain complex logic
- Document non-obvious behavior
- Provide context for business logic
- Keep comments up-to-date with code

### Help/Usage Function
```bash
show_help() {
    cat << EOF
Usage: $(basename "$0") [OPTIONS]

Description of what this script does.

Options:
    -h, --help          Show this help message
    -v, --version TYPE  Bump version (patch|minor|major)
    -d, --dry-run       Preview changes without executing

Examples:
    $(basename "$0") --version patch
    $(basename "$0") --dry-run

EOF
}
```

## 🚀 Common Patterns

### Docker Integration
```bash
# Check if running in Docker
is_docker() {
    [ -f /.dockerenv ] || grep -q docker /proc/1/cgroup 2>/dev/null
}

# Execute command in Docker container
docker_exec() {
    docker-compose exec jekyll "$@"
}
```

### Git Operations
```bash
# Check for uncommitted changes
check_git_clean() {
    if ! git diff-index --quiet HEAD --; then
        log_error "Uncommitted changes detected"
        exit 1
    fi
}

# Get current branch
get_current_branch() {
    git rev-parse --abbrev-ref HEAD
}
```

### Version Management
```bash
# Read version from file
get_current_version() {
    grep "VERSION = " lib/jekyll-theme-zer0/version.rb | \
        cut -d'"' -f2
}

# Bump version number
bump_version() {
    local version="$1"
    local type="$2"
    
    IFS='.' read -r major minor patch <<< "$version"
    
    case "$type" in
        major) echo "$((major + 1)).0.0" ;;
        minor) echo "$major.$((minor + 1)).0" ;;
        patch) echo "$major.$minor.$((patch + 1))" ;;
    esac
}
```

## 🔄 Maintenance Guidelines

### Script Updates
- Keep scripts synchronized with workflow changes
- Update documentation when changing functionality
- Test thoroughly after modifications
- Review shellcheck warnings regularly

### Deprecation Process
1. Add deprecation warning to script
2. Update documentation
3. Notify users through CHANGELOG
4. Remove after grace period (minimum 2 releases)

### Performance Optimization
- Minimize external command calls
- Use bash built-ins when possible
- Cache expensive operations
- Add progress indicators for long-running tasks

---

*These guidelines ensure consistent, reliable, and maintainable shell scripts across the Zer0-Mistakes project. Always test scripts thoroughly before committing.*
