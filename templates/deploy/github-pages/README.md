# Deploy target: GitHub Pages

Generates a GitHub Actions workflow that builds the Jekyll site with
Bundler and publishes the rendered `_site/` directory to the `gh-pages`
branch. Compatible with both gem-based and `remote_theme` installs.

## Files installed

| Source                                   | Destination                                       |
| ---------------------------------------- | ------------------------------------------------- |
| `jekyll-gh-pages.yml.template`           | `.github/workflows/jekyll-gh-pages.yml`           |

## Template variables

| Variable           | Default | Notes                                       |
| ------------------ | ------- | ------------------------------------------- |
| `{{DEFAULT_BRANCH}}` | `main`  | Branch that triggers the deploy workflow.   |
| `{{RUBY_VERSION}}`   | `3.3`   | Matches the `ruby/setup-ruby` action input. |

## Post-install steps

1. Push the new workflow to GitHub.
2. In the repository settings, set **Pages → Build and deployment →
   Source** to **Deploy from a branch** and select `gh-pages` / `/(root)`.
3. Trigger a build by pushing to `main` (or running the workflow
   manually from the Actions tab).

## Documentation

- <https://docs.github.com/en/pages>
- <https://github.com/peaceiris/actions-gh-pages>
