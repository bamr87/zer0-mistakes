# Dependency Management Strategy

## Overview

This project follows a **Zero Pin + Lockfile + Automated Updates** strategy:

- **Zero Pins**: `Gemfile` has no version constraints → allows flexibility
- **Lockfile**: `Gemfile.lock` commits exact versions → reproducibility
- **Automated Updates**: Weekly workflow keeps dependencies current
- **CI Validation**: Tests catch breaking changes before merge

## Automated Update Workflow

### Schedule
- **Primary**: Weekly on Monday at 9:00 AM UTC
- **Secondary**: Manual trigger via GitHub Actions UI

### Process
1. Workflow runs `bundle update` 
2. Creates PR with updated `Gemfile.lock`
3. CI validates compatibility:
   - Build succeeds
   - Tests pass
   - Docker container works
4. Review and merge if green ✅
5. Investigate if red ❌

## Manual Dependency Management

### Update All Dependencies
```bash
bundle update
git add Gemfile.lock
git commit -m "chore(deps): update all Ruby gems"
git push origin main
```

### Update Specific Gem
```bash
bundle update github-pages
git add Gemfile.lock
git commit -m "chore(deps): update github-pages"
git push origin main
```

### Conservative Update (Patch Only)
```bash
bundle update --patch
git add Gemfile.lock
git commit -m "chore(deps): patch updates for security fixes"
git push origin main
```

### Check for Outdated Gems
```bash
bundle outdated
```

## When Updates Fail

If automated PR shows CI failures:

### 1. Review the Error
```bash
gh pr checkout <PR-number>
docker-compose up  # Test locally
```

### 2. Identify Breaking Changes
Check gem changelogs:
```bash
bundle outdated | grep "jekyll\|github-pages"
```

### 3. Options to Resolve

**A. Pin the Problematic Gem** (temporary):
```ruby
# Gemfile
gem "problematic-gem", "~> 1.2.0"  # Pin to working version
```

**B. Fix Code Compatibility**:
```bash
# Update code to work with new version
# Then commit fixes to the PR branch
```

**C. Wait and Skip**:
```bash
# Close the automated PR
# Wait for next version or upstream fix
```

## Best Practices

### ✅ DO
- Merge automated PRs promptly when CI passes
- Review changelog for major version bumps
- Test locally before merging complex updates
- Keep `Gemfile.lock` committed to git
- Monitor GitHub security alerts

### ❌ DON'T  
- Pin versions in `Gemfile` unless absolutely necessary
- Ignore failing update PRs (they indicate problems)
- Delete `Gemfile.lock` from git (breaks reproducibility)
- Skip CI validation (catches issues early)

## Troubleshooting

### Issue: Update PR Created But No Changes
**Cause**: Already on latest versions  
**Action**: Close PR, no action needed

### Issue: Update Fails to Create PR
**Cause**: Workflow error or permissions issue  
**Action**: Check workflow run logs, verify GitHub token permissions

### Issue: Docker Build Fails After Update
**Cause**: Incompatible gem versions  
**Action**: 
1. Check `docker/Dockerfile` for version constraints
2. Verify Bundler version compatibility
3. Review gem compilation errors (native extensions)

### Issue: Tests Pass Locally But Fail in CI
**Cause**: Environment differences (Ruby version, OS)  
**Action**: 
1. Match Ruby version with CI (`ruby-version` in workflow)
2. Check platform-specific gems in `Gemfile.lock`
3. Rebuild Docker container: `docker-compose up --build`

## Monitoring

### GitHub Actions
- Check [Actions tab](https://github.com/bamr87/zer0-mistakes/actions) weekly
- Review automated PR when created
- Monitor CI status on open PRs

### Security Alerts
- Enable Dependabot security alerts
- Review GitHub Security tab regularly
- Apply security patches promptly

### Gem Compatibility
- Monitor `github-pages` gem versions (pins Jekyll)
- Check Jekyll changelog for breaking changes
- Test theme features after major updates

## Further Reading

- [Bundler Documentation](https://bundler.io/guides/updating_gems.html)
- [GitHub Pages Dependency Versions](https://pages.github.com/versions/)
- [Zero Pin Strategy Context](../.github/copilot-instructions.md#development-environment)
