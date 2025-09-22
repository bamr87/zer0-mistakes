# Testing Guide for zer0-mistakes Jekyll Theme

## 🧪 Comprehensive Testing Framework

This directory contains a comprehensive testing framework for the zer0-mistakes Jekyll theme, covering installation, deployment, Docker functionality, and documentation accuracy.

## 📋 Available Test Scripts

### 🚀 Quick Validation Scripts

#### `validate_installation.sh`
**Purpose:** Quick validation without Docker dependencies  
**Runtime:** ~30 seconds  
**Requirements:** Bash, Ruby (optional)

```bash
# Quick validation
./test/validate_installation.sh

# What it tests:
✓ Full installation process
✓ Minimal installation process  
✓ File structure and permissions
✓ YAML syntax validation
✓ Documentation accuracy
```

#### `test_docker_deployment.sh`
**Purpose:** Docker-specific deployment testing  
**Runtime:** 2-3 minutes  
**Requirements:** Docker Desktop

```bash
# Docker deployment test
./test/test_docker_deployment.sh

# With verbose output
./test/test_docker_deployment.sh --verbose

# Keep test site for inspection
./test/test_docker_deployment.sh --no-cleanup

# What it tests:
✓ Docker volume mounting (home directory vs /tmp)
✓ Gemfile configuration for Jekyll sites
✓ Environment variable setup
✓ Jekyll build and serve process
✓ Live reload functionality
✓ Site accessibility and content validation
```

### 🔬 Comprehensive Test Suites

#### `test_installation_complete.sh`
**Purpose:** Full installation validation across all methods  
**Runtime:** 3-5 minutes  
**Requirements:** Bash, Docker (optional), Ruby (optional)

```bash
# Run all installation tests
./test/test_installation_complete.sh

# Verbose output with detailed logs
./test/test_installation_complete.sh --verbose

# Skip remote tests (faster)
./test/test_installation_complete.sh --skip-remote

# What it tests:
✓ Local full installation
✓ Local minimal installation
✓ Remote installation from GitHub
✓ Docker environment setup
✓ Jekyll build process
✓ Documentation accuracy
✓ Error handling validation
✓ Performance benchmarking
```

#### `test_deployment_complete.sh`
**Purpose:** End-to-end deployment workflow validation  
**Runtime:** 5-10 minutes  
**Requirements:** Docker, Git

```bash
# Complete deployment test
./test/test_deployment_complete.sh

# Skip Docker tests if unavailable
./test/test_deployment_complete.sh --skip-docker

# Skip remote installation tests
./test/test_deployment_complete.sh --skip-remote

# What it tests:
✓ Fresh installation in isolated environment
✓ Configuration file validity
✓ File permissions and structure
✓ Docker environment functionality
✓ Jekyll build process
✓ GitHub Pages readiness
✓ Documentation accuracy
✓ Installation performance
```

#### `test_github_deployment.sh`
**Purpose:** Real GitHub repository deployment testing  
**Runtime:** 5-15 minutes  
**Requirements:** GitHub CLI, Git, Docker

```bash
# Test GitHub deployment (creates real repo)
./test/test_github_deployment.sh --no-cleanup

# Test local workflow only
./test/test_github_deployment.sh --skip-github

# What it tests:
✓ GitHub repository creation
✓ Theme installation via remote script
✓ Local development environment
✓ GitHub Pages configuration
✓ Live site deployment
```

### 🏃‍♂️ Legacy Test Scripts

#### `test_local_deployment.sh`
**Purpose:** Local installation testing  
**Requirements:** Docker

```bash
./test/test_local_deployment.sh --verbose
```

#### `test_install.sh`
**Purpose:** Basic installation testing  
**Requirements:** Bash

```bash
./test/test_install.sh
```

## 🎯 Testing Scenarios

### 1. **Developer Workflow Testing**
Test the complete developer experience:

```bash
# Test installation and Docker setup
./test/test_docker_deployment.sh --verbose --no-cleanup

# Test site customization
cd ~/zer0-docker-test-*
echo "# Custom Content" >> index.md
# Check live reload at http://localhost:4000

# Clean up
docker-compose down && cd ~ && rm -rf zer0-docker-test-*
```

### 2. **Installation Method Validation**
Test all installation methods:

```bash
# Test all installation methods
./test/test_installation_complete.sh --verbose

# Focus on specific methods
./test/test_installation_complete.sh --pattern local
./test/test_installation_complete.sh --pattern remote
```

### 3. **Platform Compatibility Testing**
Test across different environments:

```bash
# Test Docker volume mounting issues
./test/test_docker_deployment.sh --use-tmp  # Should show warnings

# Test in proper location
./test/test_docker_deployment.sh             # Should work perfectly
```

### 4. **Performance and Reliability Testing**
Test system performance and error handling:

```bash
# Run comprehensive tests with performance metrics
./test/test_deployment_complete.sh --verbose

# Test error handling
./test/test_installation_complete.sh --pattern error
```

## 🐳 Docker Testing Best Practices

### Volume Mounting Validation

**✅ Recommended Locations:**
- User home directory: `~/my-site`
- User Documents: `~/Documents/my-site`
- Desktop: `~/Desktop/my-site`

**⚠️ Problematic Locations:**
- System temp: `/tmp/my-site` (may not mount properly)
- System directories: `/var/`, `/usr/` (permission issues)
- Complex paths with spaces or special characters

### Docker Desktop Configuration

**Required Settings:**
1. **File Sharing:** Ensure home directory is shared
2. **Resources:** Minimum 2GB RAM, 2 CPU cores
3. **Experimental Features:** May need to be disabled for stability

### Common Docker Issues and Solutions

**Issue: Volume mounting fails**
```bash
# Solution: Use home directory
mkdir ~/my-test-site
cd ~/my-test-site
# Run installation here
```

**Issue: Port already in use**
```bash
# Solution: Use different port
docker-compose run -p 4001:4000 jekyll
# Or stop existing containers
docker ps -q | xargs docker stop
```

**Issue: Bundle install fails**
```bash
# Solution: Clear Docker cache
docker-compose down
docker system prune -f
docker-compose up --build
```

## 📊 Test Results Interpretation

### Success Indicators
- ✅ **HTTP 200 OK** from `curl -I http://localhost:4000`
- ✅ **"Server running"** in Jekyll logs
- ✅ **Site content** contains theme elements
- ✅ **Live reload** working (X-Rack-Livereload header present)
- ✅ **Build time** under 5 seconds for initial build

### Warning Signs
- ⚠️ **Bundle install** taking over 2 minutes
- ⚠️ **Volume mounting** empty `/app` directory in container
- ⚠️ **Port conflicts** preventing server startup
- ⚠️ **Missing environment variables** causing build failures

### Failure Indicators
- ❌ **Gemfile errors** with `gemspec` references
- ❌ **Configuration errors** in YAML files
- ❌ **Missing files** in installation
- ❌ **Docker container** exits immediately
- ❌ **Site not accessible** after startup

## 🔧 Debugging Commands

### Container Inspection
```bash
# Check container status
docker-compose ps

# View Jekyll logs
docker-compose logs jekyll

# Access container shell
docker-compose exec jekyll bash

# Check mounted files
docker-compose run --rm jekyll ls -la /app/
```

### Site Validation
```bash
# Test site accessibility
curl -I http://localhost:4000

# Get site content preview
curl -s http://localhost:4000 | head -20

# Check for specific content
curl -s http://localhost:4000 | grep -i "zer0-mistakes\|jekyll\|welcome"
```

### Configuration Validation
```bash
# Validate YAML syntax
ruby -e "require 'yaml'; YAML.load_file('_config.yml')"

# Validate Docker Compose
docker-compose config

# Check Gemfile syntax
bundle check || bundle install --dry-run
```

## 📈 Test Coverage Matrix

| Test Category | Quick Validation | Docker Test | Installation Complete | Deployment Complete |
|---------------|------------------|-------------|----------------------|---------------------|
| **Installation Process** | ✅ | ✅ | ✅ | ✅ |
| **File Structure** | ✅ | ✅ | ✅ | ✅ |
| **Docker Environment** | ❌ | ✅ | ✅ | ✅ |
| **Jekyll Build** | ❌ | ✅ | ✅ | ✅ |
| **Site Serving** | ❌ | ✅ | ❌ | ✅ |
| **Live Reload** | ❌ | ✅ | ❌ | ✅ |
| **Remote Installation** | ❌ | ❌ | ✅ | ✅ |
| **GitHub Pages** | ❌ | ❌ | ❌ | ✅ |
| **Performance** | ❌ | ❌ | ✅ | ✅ |
| **Error Handling** | ❌ | ❌ | ✅ | ✅ |

## 🚨 Known Issues and Workarounds

### 1. Docker Volume Mounting on macOS
**Issue:** Files not visible in container when using `/tmp` or system directories  
**Solution:** Use home directory locations (`~/my-site`)  
**Test:** `./test/test_docker_deployment.sh --use-tmp` vs normal execution

### 2. Gemfile Configuration
**Issue:** Theme's Gemfile includes `gemspec` which fails for sites  
**Solution:** Install script now creates site-appropriate Gemfile  
**Test:** Check that generated Gemfile doesn't contain `gemspec`

### 3. Repository Environment Variable
**Issue:** Jekyll SEO plugin requires repository information  
**Solution:** Install script adds `PAGES_REPO_NWO` to docker-compose.yml  
**Test:** Verify environment variable is present and Jekyll builds successfully

### 4. Bundle Install Performance
**Issue:** Initial bundle install can take 60-90 seconds in Docker  
**Solution:** This is normal - subsequent starts are much faster  
**Test:** Monitor Jekyll logs for "Server running" message

## 🎯 Recommended Testing Workflow

### For Theme Development
```bash
# 1. Quick validation
./test/validate_installation.sh

# 2. Docker functionality
./test/test_docker_deployment.sh --verbose

# 3. Full installation testing
./test/test_installation_complete.sh
```

### For User Experience Validation
```bash
# 1. Test user workflow
mkdir ~/test-user-experience
cd ~/test-user-experience
curl -fsSL https://raw.githubusercontent.com/bamr87/zer0-mistakes/main/install.sh | bash

# 2. Validate Docker startup
docker-compose up -d

# 3. Test site accessibility
curl -I http://localhost:4000

# 4. Clean up
docker-compose down && cd ~ && rm -rf test-user-experience
```

### For CI/CD Validation
```bash
# Run all tests in sequence
./test/validate_installation.sh && \
./test/test_docker_deployment.sh && \
./test/test_installation_complete.sh --skip-remote && \
echo "All tests passed - ready for production!"
```

## 📝 Test Report Generation

All test scripts generate JSON reports in `test/results/`:

```bash
# View latest test results
ls -la test/results/

# Parse test results (if jq available)
jq '.summary' test/results/deployment_test_report.json

# View test details
cat test/results/installation_test_report.json
```

## 🔄 Continuous Testing

### GitHub Actions Integration
The repository includes automated testing workflows:
- **CI Pipeline:** `.github/workflows/ci.yml`
- **Enhanced CI:** `.github/workflows/enhanced-ci.yml`
- **Advanced Testing:** `.github/workflows/advanced-testing.yml`

### Local Automation
Set up automated testing with:

```bash
# Watch for changes and run tests
watch -n 300 './test/validate_installation.sh'

# Daily comprehensive test
echo "0 6 * * * cd /Users/bamr87/github/zer0-mistakes && ./test/test_installation_complete.sh" | crontab -
```

---

## 🎉 Success Criteria

A successful test run should show:

1. **✅ Installation:** All files and directories created correctly
2. **✅ Configuration:** YAML files valid, no syntax errors
3. **✅ Docker:** Volume mounting working, containers starting
4. **✅ Jekyll:** Site builds in under 5 seconds
5. **✅ Serving:** HTTP 200 OK response from localhost:4000
6. **✅ Content:** Theme elements visible in site output
7. **✅ Live Reload:** Automatic updates when files change

**🎯 Target Performance:**
- Installation: < 30 seconds
- Docker startup: < 2 minutes (including bundle install)
- Jekyll build: < 5 seconds
- Site response: < 100ms

**🚀 Ready for Production when all tests pass consistently!**