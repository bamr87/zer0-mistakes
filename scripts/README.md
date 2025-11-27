# Gem Automation Scripts

This directory contains automation scripts for managing the `jekyll-theme-zer0` gem lifecycle and feature modules.

## Scripts Overview

### 🖼️ `generate-preview-images.sh` (Feature: ZER0-003)
AI-powered preview image generator for Jekyll posts and content.

**Usage:**
```bash
./scripts/generate-preview-images.sh [options]
```

**Examples:**
```bash
./scripts/generate-preview-images.sh --list-missing    # List files missing previews
./scripts/generate-preview-images.sh --dry-run         # Preview without changes
./scripts/generate-preview-images.sh --collection posts # Generate for posts only
./scripts/generate-preview-images.sh -f path/to/file.md # Process specific file
./scripts/generate-preview-images.sh --provider openai  # Use OpenAI DALL-E
```

**Configuration:**
Settings in `_config.yml` under `preview_images` section:
```yaml
preview_images:
  enabled: true
  provider: openai
  model: dall-e-3
  size: "1792x1024"
  style: "retro pixel art, 8-bit video game aesthetic"
  output_dir: assets/images/previews
```

**See:** [Preview Image Generator Documentation](/docs/features/preview-image-generator.md)

### 📦 `install-preview-generator.sh`
Installer for the AI Preview Image Generator feature.

**Usage:**
```bash
# Remote installation (for other Jekyll sites)
curl -fsSL https://raw.githubusercontent.com/bamr87/zer0-mistakes/main/scripts/install-preview-generator.sh | bash

# Local installation with options
./scripts/install-preview-generator.sh [options]
```

**Options:**
- `-d, --dry-run` - Preview what would be installed
- `-f, --force` - Overwrite existing files
- `-p, --provider PROVIDER` - Set default AI provider
- `--no-config` - Skip _config.yml modification
- `--no-tasks` - Skip VS Code tasks installation

### 🚀 `setup.sh`
Sets up the development environment for gem development.

**Usage:**
```bash
./scripts/setup.sh
```

**What it does:**
- Checks system requirements (Ruby, Bundler, jq, Git)
- Installs dependencies
- Makes scripts executable
- Validates gemspec
- Creates CHANGELOG.md if missing
- Sets up Git hooks for validation
- Updates .gitignore for gem development

### 📈 `version.sh`
Manages semantic versioning of the gem.

**Usage:**
```bash
./scripts/version.sh [patch|minor|major] [--dry-run]
```

**Examples:**
```bash
./scripts/version.sh patch           # 0.1.8 → 0.1.9
./scripts/version.sh minor           # 0.1.8 → 0.2.0
./scripts/version.sh major           # 0.1.8 → 1.0.0
./scripts/version.sh patch --dry-run # Preview changes without applying
```

**What it does:**
- Validates working directory is clean
- Updates version in `package.json`
- Updates `CHANGELOG.md` if it exists
- Creates git commit with version bump
- Creates git tag (`v{version}`)

### 🔨 `build.sh`
Builds and optionally publishes the gem.

**Usage:**
```bash
./scripts/build.sh [--publish] [--dry-run]
```

**Examples:**
```bash
./scripts/build.sh                    # Build gem only
./scripts/build.sh --publish          # Build and publish to RubyGems
./scripts/build.sh --publish --dry-run # Preview publish process
```

**What it does:**
- Validates dependencies and gemspec
- Builds the gem file
- Shows gem contents for verification
- Optionally publishes to RubyGems (with confirmation)

### 🧪 `test.sh`
Runs comprehensive tests and validations.

**Usage:**
```bash
./scripts/test.sh [--verbose]
```

**What it tests:**
- `package.json` syntax and version format
- Gemspec syntax and validity
- Required files existence
- YAML front matter in layouts
- Jekyll dependencies
- Version consistency
- Script permissions
- Bundle install capability

## Development Workflow

### Initial Setup
```bash
# Clone the repository
git clone https://github.com/bamr87/zer0-mistakes.git
cd zer0-mistakes

# Set up development environment
./scripts/setup.sh
```

### Making Changes
```bash
# Make your changes to the theme files

# Run tests to validate changes
./scripts/test.sh

# If tests pass, bump version
./scripts/version.sh patch

# Build the gem
./scripts/build.sh

# Publish to RubyGems (when ready)
./scripts/build.sh --publish
```

### Automated Workflows
The project includes GitHub Actions workflows for automation:

#### CI Workflow (`.github/workflows/ci.yml`)
- Triggers on: Push to main/develop, Pull Requests
- Tests on multiple Ruby versions (2.7, 3.0, 3.1, 3.2)
- Runs linting and security scans
- Validates gem building

#### Release Workflow (`.github/workflows/gem-release.yml`)
- Triggers on: Git tags (`v*`), Manual dispatch
- Builds and tests the gem
- Publishes to RubyGems (production environment)
- Creates GitHub release with gem attached

#### Version Bump Workflow (`.github/workflows/version-bump.yml`)
- Manual trigger with version type selection
- Runs tests before bumping
- Creates version bump commit and tag
- Optionally creates PR for review

## Requirements

### System Dependencies
- **Ruby**: >= 2.7.0
- **Bundler**: For dependency management
- **jq**: For JSON processing
- **Git**: For version control

### RubyGems Publishing Setup
To publish gems, you need:

1. **RubyGems account**: Sign up at [rubygems.org](https://rubygems.org)
2. **API key**: Get from your RubyGems account settings
3. **GitHub secret**: Add `RUBYGEMS_API_KEY` to repository secrets

### Local Authentication
```bash
# Sign in to RubyGems locally
gem signin

# Verify authentication
gem whoami
```

## CI/CD Integration

The automation system is designed for complete CI/CD integration:

### Local Development
1. **Setup**: `./scripts/setup.sh`
2. **Development**: Make changes
3. **Testing**: `./scripts/test.sh`
4. **Version**: `./scripts/version.sh`
5. **Build**: `./scripts/build.sh`

### Automated Release
1. **Manual trigger**: Version bump workflow
2. **Automatic testing**: CI workflow validates changes
3. **Tag creation**: Creates version tag
4. **Release build**: Gem release workflow triggers
5. **Publication**: Automatic publishing to RubyGems

## Error Handling

### Common Issues

#### "Working directory is not clean"
```bash
# Check status
git status

# Commit or stash changes
git add .
git commit -m "Your changes"
```

#### "Not authenticated with RubyGems"
```bash
# Sign in to RubyGems
gem signin

# Or set up API key
echo ":rubygems_api_key: YOUR_API_KEY" > ~/.gem/credentials
chmod 600 ~/.gem/credentials
```

#### "jq command not found"
```bash
# macOS
brew install jq

# Ubuntu/Debian
sudo apt-get install jq
```

#### "Gemspec validation failed"
```bash
# Check gemspec syntax
gem specification jekyll-theme-zer0.gemspec

# Common fixes:
# - Ensure all required files exist
# - Check Ruby version compatibility
# - Validate dependency versions
```

## Best Practices

### Version Management
- **Patch**: Bug fixes, small improvements
- **Minor**: New features, backward compatible
- **Major**: Breaking changes

### Testing
- Always run tests before version bumps
- Use `--dry-run` to preview changes
- Test builds before publishing

### Git Workflow
- Keep working directory clean
- Use descriptive commit messages
- Tag releases consistently

### Security
- Never commit API keys
- Use GitHub secrets for CI/CD
- Regularly update dependencies

## Monitoring and Maintenance

### Regular Tasks
- **Weekly**: Run `./scripts/test.sh` to catch issues early
- **Monthly**: Review and update dependencies
- **Per release**: Monitor RubyGems downloads and feedback

### Monitoring Points
- **CI/CD status**: GitHub Actions dashboard
- **Gem stats**: RubyGems.org gem page
- **Security**: Dependabot alerts
- **Performance**: Build times and test results

## Troubleshooting

### Debug Mode
Most scripts support verbose output:
```bash
./scripts/test.sh --verbose
./scripts/build.sh --dry-run
```

### Manual Recovery
If automation fails, you can manually:
```bash
# Reset version
git checkout package.json
git reset HEAD~1

# Rebuild gem
rm -f *.gem
gem build jekyll-theme-zer0.gemspec

# Force push (use with caution)
git push --force-with-lease
```

## Contributing

When contributing to the automation system:

1. **Test thoroughly**: Run all scripts with `--dry-run` first
2. **Update documentation**: Reflect changes in this README
3. **Follow conventions**: Match existing script patterns
4. **Error handling**: Include proper error messages and exit codes
5. **Backwards compatibility**: Ensure existing workflows continue working

---

## 🎨 `generate-preview-images.sh`

AI-powered preview image generator for Jekyll posts, articles, and quests. Automatically scans content files, detects missing preview images, and generates them using AI providers (OpenAI DALL-E, Stability AI).

### Usage

```bash
# List all files missing preview images
./scripts/generate-preview-images.sh --list-missing

# Dry run to see what would be generated
./scripts/generate-preview-images.sh --dry-run --verbose

# Generate images for posts collection
./scripts/generate-preview-images.sh --collection posts

# Generate image for a specific file
./scripts/generate-preview-images.sh -f pages/_posts/my-article.md

# Force regenerate all images
./scripts/generate-preview-images.sh --force

# Use different AI provider
./scripts/generate-preview-images.sh --provider stability
```

### Options

| Option | Description |
|--------|-------------|
| `-h, --help` | Show help message |
| `-d, --dry-run` | Preview without making changes |
| `-v, --verbose` | Enable verbose output |
| `-f, --file FILE` | Process a specific file only |
| `-c, --collection NAME` | Process collection (posts, quickstart, docs, all) |
| `-p, --provider PROVIDER` | AI provider: openai, stability, local |
| `--output-dir DIR` | Output directory (default: assets/images/previews) |
| `--force` | Regenerate even if preview exists |
| `--list-missing` | Only list files with missing previews |

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | For OpenAI | OpenAI API key for DALL-E |
| `STABILITY_API_KEY` | For Stability | Stability AI API key |
| `IMAGE_STYLE` | No | Custom style prompt |
| `IMAGE_SIZE` | No | Image dimensions (default: 1024x1024) |
| `IMAGE_MODEL` | No | OpenAI model (default: dall-e-3) |

### AI Agent Integration

The script is designed to integrate with AI agents for automated content management:

1. **Content Analysis**: Extracts title, description, categories, and content to generate meaningful prompts
2. **Smart Prompts**: Creates detailed image generation prompts based on article content
3. **Front Matter Updates**: Automatically updates the markdown file with the new preview path
4. **Idempotent**: Won't regenerate images that already exist (unless `--force`)

### Python Alternative

A Python version is available at `scripts/lib/preview_generator.py` with additional features:

```bash
# Install dependencies
pip install openai pyyaml requests

# Run Python version
python3 scripts/lib/preview_generator.py --collection posts --dry-run
```

### Example Workflow

```bash
# 1. Check which files need preview images
./scripts/generate-preview-images.sh --list-missing

# 2. Preview what would be generated
export OPENAI_API_KEY="your-api-key"
./scripts/generate-preview-images.sh --dry-run

# 3. Generate images for specific collection
./scripts/generate-preview-images.sh --collection posts

# 4. Verify results and commit
git status
git add assets/images/previews/ pages/
git commit -m "feat: add AI-generated preview images"
```

---

## Support

For issues with the automation system:

1. **Check logs**: Review GitHub Actions logs
2. **Run locally**: Test scripts on your local machine
3. **Validate environment**: Ensure all dependencies are installed
4. **Create issue**: Report bugs with full error output and system info

