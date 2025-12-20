# Gem Automation Scripts

This directory contains automation scripts for managing the `jekyll-theme-zer0` gem lifecycle and feature modules.

## Directory Structure

```
scripts/
├── bin/                    # Entry point commands (use these!)
│   ├── build              # Build gem without releasing
│   ├── release            # Full release workflow
│   └── test               # Run all test suites
├── lib/                   # Shared libraries (sourced, not executed)
│   ├── common.sh          # Logging, utilities, dry-run support
│   ├── version.sh         # Version management functions
│   ├── validation.sh      # Environment validation
│   ├── git.sh             # Git operations
│   ├── changelog.sh       # Changelog generation
│   ├── gem.sh             # Gem build/publish
│   └── preview_generator.py  # Python preview image generator
├── features/              # Feature-specific scripts
│   ├── generate-preview-images     # AI preview image generator
│   ├── install-preview-generator   # Preview generator installer
│   └── validate_preview_urls.py    # Preview URL validator
├── utils/                 # Utility scripts
│   ├── analyze-commits    # Commit analyzer for version bumps
│   ├── fix-markdown       # Markdown formatting fixer
│   └── setup              # Development environment setup
├── test/                  # Test suites
│   ├── lib/               # Library unit tests
│   ├── theme/             # Theme validation tests
│   └── integration/       # Integration tests
└── *.sh (wrappers)        # Backward-compatible wrappers
```

## Quick Start

```bash
# Build gem
./scripts/bin/build

# Full release workflow
./scripts/bin/release patch   # or minor/major

# Run tests
./scripts/bin/test
```

## Scripts Overview

### Main Commands (scripts/bin/)

#### `bin/build`
Build the gem without the full release workflow.

```bash
./scripts/bin/build [--dry-run] [--verbose]
```

#### `bin/release`
Full release workflow with changelog, version bump, and publishing.

```bash
./scripts/bin/release [patch|minor|major] [options]

Options:
  --dry-run           Preview without making changes
  --skip-tests        Skip test execution
  --skip-publish      Skip RubyGems publishing
  --no-github-release Skip GitHub release creation
  --non-interactive   No confirmation prompts
```

#### `bin/test`
Unified test runner for all test suites.

```bash
./scripts/bin/test [all|lib|theme|integration] [--verbose]
```

### Feature Scripts (scripts/features/)

#### `generate-preview-images`
AI-powered preview image generator for Jekyll posts.

```bash
./scripts/features/generate-preview-images [options]

Options:
  --list-missing      List files missing previews
  --dry-run           Preview without changes
  --collection TYPE   Generate for specific collection (posts, docs, etc.)
  -f, --file PATH     Process specific file
  --provider PROVIDER Use specific AI provider (openai, stability, xai)
  --assets-prefix     Custom assets path prefix (default: /assets)
  --no-auto-prefix    Disable automatic path prefixing

AI Providers:
  openai    - OpenAI DALL-E (requires OPENAI_API_KEY)
  stability - Stability AI (requires STABILITY_API_KEY)
  xai       - xAI Grok image generation (requires XAI_API_KEY)
```

#### `install-preview-generator`
Install the preview image generator feature.

```bash
./scripts/features/install-preview-generator [options]
```

#### `validate_preview_urls.py`
Validate preview image URLs in frontmatter.

```bash
python3 scripts/features/validate_preview_urls.py [--verbose] [--suggestions]
```

### Utility Scripts (scripts/utils/)

#### `setup`
Set up the development environment.

```bash
./scripts/utils/setup
```

#### `analyze-commits`
Analyze commits to determine version bump type.

```bash
./scripts/utils/analyze-commits [range]
```

#### `fix-markdown`
Fix markdown formatting issues.

```bash
./scripts/utils/fix-markdown [files...]
```

### Libraries (scripts/lib/)

These are sourced by other scripts, not executed directly:

- `common.sh` - Logging utilities, colors, dry-run support
- `version.sh` - Version parsing, calculation, file updates
- `validation.sh` - Environment and dependency validation
- `git.sh` - Git operations (tags, commits, branches)
- `changelog.sh` - Changelog generation from commits
- `gem.sh` - Gem build/publish operations
- `preview_generator.py` - Python preview image generator

### Test Suites (scripts/test/)

```bash
# Run all library unit tests
./scripts/test/lib/run_tests.sh

# Run theme validation
./scripts/test/theme/validate

# Run integration tests
./scripts/test/integration/auto-version
./scripts/test/integration/mermaid
```

## Backward Compatibility

Legacy script paths (e.g., `./scripts/build.sh`) are maintained as thin wrappers
that forward to the canonical locations in `bin/`, `utils/`, `features/`, or `test/`.

## Development Workflow

### Initial Setup
```bash
git clone https://github.com/bamr87/zer0-mistakes.git
cd zer0-mistakes
./scripts/utils/setup
```

### Making Changes
```bash
# Make your changes

# Run tests
./scripts/bin/test

# Build (without publish)
./scripts/bin/build

# Full release
./scripts/bin/release patch
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
- **Bash**: >= 3.2 (macOS default supported - no Homebrew Bash required!)
- **Ruby**: >= 2.7.0
- **Bundler**: For dependency management
- **jq**: For JSON processing
- **Git**: For version control

**Note on Bash Compatibility**: All scripts are compatible with Bash 3.2+ (the default version on macOS). You do NOT need to install Homebrew Bash. The release automation, changelog generation, and all CI/CD workflows work seamlessly with the system-provided Bash on macOS and standard Bash installations on Linux.

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

