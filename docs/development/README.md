# Development Documentation

Guides for setting up a development environment and contributing to the Zer0-Mistakes theme.

## Contents

| Document | Description |
|----------|-------------|
| [Local Setup](local-setup.md) | Set up your development environment |
| [Testing](testing.md) | Run tests and validate changes |
| [Code Style](code-style.md) | Coding conventions and best practices |

## Quick Start

```bash
# Clone the repository
git clone https://github.com/bamr87/zer0-mistakes.git
cd zer0-mistakes

# Start development server
docker-compose up

# Open http://localhost:4000
```

## Prerequisites

- **Docker Desktop** — For containerized development
- **Git** — For version control
- **Text Editor** — VS Code recommended

## Development Workflow

1. **Fork/clone** the repository
2. **Create a branch** for your changes
3. **Make changes** and test locally
4. **Run tests** to validate
5. **Submit PR** with description

## Key Files

| File | Purpose |
|------|---------|
| `_config.yml` | Production configuration |
| `_config_dev.yml` | Development overrides |
| `docker-compose.yml` | Docker setup |
| `Gemfile` | Ruby dependencies |
| `Makefile` | Build shortcuts |

## Testing

```bash
# Run test suite
./test/test_runner.sh

# Run specific tests
./test/test_runner.sh --suites core

# Lint check
make lint
```

## Building the Gem

```bash
# Preview build
./scripts/build --dry-run

# Build gem
./scripts/build
```

## Related Documentation

- [Architecture](../architecture/README.md) — Codebase structure
- [Release Automation](../systems/release-automation.md) — Release process
- [CONTRIBUTING.md](../../CONTRIBUTING.md) — Contribution guidelines
