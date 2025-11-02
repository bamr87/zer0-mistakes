# Automation Scripts

This directory contains automation scripts for managing the `jekyll-theme-zer0` gem lifecycle, as well as build scripts for MDX and Tailwind CSS.

## Scripts Overview

### 📦 `build-mdx.js`
Processes MDX (Markdown + JSX) files and converts them to HTML for Jekyll.

**Usage:**
```bash
node scripts/build-mdx.js
# or
npm run build:mdx
```

**What it does:**
- Finds all `.mdx` files in the project
- Parses front matter from each file
- Compiles MDX content to HTML
- Generates HTML files in `_mdx-generated/` directory
- Maintains Jekyll-compatible front matter

**Output:**
- Input: `pages/_docs/example.mdx`
- Output: `_mdx-generated/pages/_docs/example.html`

**See also:** [MDX and Tailwind CSS Guide](../docs/MDX_TAILWIND_GUIDE.md)

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

## Support

For issues with the automation system:

1. **Check logs**: Review GitHub Actions logs
2. **Run locally**: Test scripts on your local machine
3. **Validate environment**: Ensure all dependencies are installed
4. **Create issue**: Report bugs with full error output and system info
