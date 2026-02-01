# GitHub Secrets and Variables Setup

This document explains how to configure GitHub Actions secrets and variables for the zer0-mistakes theme repository.

## Required Configuration

### 🔐 Repository Secrets

Navigate to: **Repository Settings → Secrets and variables → Actions → Secrets**

| Secret Name | Description | How to Get |
|-------------|-------------|-----------|
| `DOCKER_USERNAME` | Docker Hub username | Your Docker Hub login username |
| `DOCKER_TOKEN` | Docker Hub access token | [Create at Docker Hub](https://hub.docker.com/settings/security) → New Access Token |
| `RUBYGEMS_API_KEY` | RubyGems API key (for releases) | [Get from RubyGems](https://rubygems.org/profile/api_keys) |

### 📝 Repository Variables

Navigate to: **Repository Settings → Secrets and variables → Actions → Variables**

| Variable Name | Default Value | Description |
|---------------|---------------|-------------|
| `DOCKER_IMAGE` | `amrabdel/zer0-mistakes` | Full Docker Hub image path |
| `PAGES_REPO_NWO` | `${{ github.repository }}` | Repository name for jekyll-github-metadata |

> **Note:** Variables are optional. Workflows use sensible defaults if not set.

## Docker Hub Setup

### 1. Create Docker Hub Access Token

1. Log in to [Docker Hub](https://hub.docker.com)
2. Go to **Account Settings → Security → New Access Token**
3. Name: `github-actions-zer0-mistakes`
4. Access permissions: `Read, Write, Delete`
5. Copy the token immediately (shown only once)

### 2. Add to GitHub Secrets

```bash
# Using GitHub CLI
gh secret set DOCKER_USERNAME --body "amrabdel"
gh secret set DOCKER_TOKEN --body "dckr_pat_your_token_here"
```

Or add via GitHub UI:
1. Go to repository **Settings → Secrets and variables → Actions**
2. Click **New repository secret**
3. Add `DOCKER_USERNAME` and `DOCKER_TOKEN`

### 3. Set Variables (Optional)

```bash
# Using GitHub CLI
gh variable set DOCKER_IMAGE --body "amrabdel/zer0-mistakes"
gh variable set PAGES_REPO_NWO --body "bamr87/zer0-mistakes"
```

## How Workflows Use These Values

### TEST (Latest Dependencies) Workflow

```yaml
env:
  # Uses variable if set, otherwise default
  DOCKER_IMAGE: ${{ vars.DOCKER_IMAGE || 'amrabdel/zer0-mistakes' }}
  PAGES_REPO_NWO: ${{ vars.PAGES_REPO_NWO || github.repository }}
```

### Docker Login Step

```yaml
- name: Login to Docker Hub
  uses: docker/login-action@v3
  with:
    username: ${{ secrets.DOCKER_USERNAME }}
    password: ${{ secrets.DOCKER_TOKEN }}
```

## Workflow Triggers

| Workflow | Publishes Docker Image? | When |
|----------|------------------------|------|
| `test-latest.yml` | ✅ Yes | Push to main, daily schedule |
| `ci.yml` | ❌ No | All PRs and pushes |
| `release.yml` | ❌ No (RubyGems only) | Version tags |

## Forking This Repository

If you fork this repository, you'll need to:

1. **Create your own Docker Hub repository**
   - Go to [Docker Hub](https://hub.docker.com)
   - Create repository: `yourusername/zer0-mistakes`

2. **Set up secrets in your fork**
   ```bash
   gh secret set DOCKER_USERNAME --body "yourusername"
   gh secret set DOCKER_TOKEN --body "your_token"
   ```

3. **Set variables in your fork**
   ```bash
   gh variable set DOCKER_IMAGE --body "yourusername/zer0-mistakes"
   gh variable set PAGES_REPO_NWO --body "yourusername/zer0-mistakes"
   ```

## Troubleshooting

### Docker Login Failed

**Error:** `unauthorized: incorrect username or password`

**Solutions:**
1. Verify `DOCKER_USERNAME` matches your Docker Hub username exactly
2. Regenerate `DOCKER_TOKEN` - tokens expire or may be revoked
3. Check the token has `Read, Write` permissions

### Jekyll Build Fails with "No repo name found"

**Error:** `No repo name found. Specify using PAGES_REPO_NWO environment variables`

**Solution:** Ensure `PAGES_REPO_NWO` is set in workflow env or repository variables.

### Image Push Failed

**Error:** `denied: requested access to the resource is denied`

**Solutions:**
1. Verify the Docker Hub repository exists
2. Check your token has write permissions
3. Ensure `DOCKER_IMAGE` matches your Docker Hub repo path

## Security Best Practices

- ✅ Use access tokens, never passwords
- ✅ Set minimal required permissions on tokens
- ✅ Rotate tokens periodically
- ✅ Use repository secrets, not hardcoded values
- ❌ Never commit secrets to code
- ❌ Never log secret values in workflows

## Quick Reference

```bash
# List current secrets (names only)
gh secret list

# List current variables
gh variable list

# Set a secret
gh secret set SECRET_NAME --body "value"

# Set a variable
gh variable set VAR_NAME --body "value"

# Delete a secret
gh secret delete SECRET_NAME

# Delete a variable
gh variable delete VAR_NAME
```
