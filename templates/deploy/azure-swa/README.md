# Deploy target: Azure Static Web Apps

Generates the GitHub Actions workflow + `staticwebapp.config.json`
required by Azure Static Web Apps. This is the modern replacement for
the legacy `install.sh::create_azure_static_web_apps_workflow` heredoc.

## Files installed

| Source                                       | Destination                                              |
| -------------------------------------------- | -------------------------------------------------------- |
| `azure-static-web-apps.yml.template`         | `.github/workflows/azure-static-web-apps.yml`            |
| `staticwebapp.config.json`                   | `staticwebapp.config.json`                               |

## Template variables

| Variable              | Default | Notes                                         |
| --------------------- | ------- | --------------------------------------------- |
| `{{DEFAULT_BRANCH}}`  | `main`  | Branch that triggers builds + deploys.        |
| `{{RUBY_VERSION}}`    | `3.3`   | Matches `ruby/setup-ruby` action input.       |

## Post-install steps

1. Create the Static Web App in the Azure portal (or via `az staticwebapp create`).
2. Copy the deployment token into the GitHub repository secret
   `AZURE_STATIC_WEB_APPS_API_TOKEN`.
3. Push to `main` to trigger the first deployment.

## Documentation

- <https://learn.microsoft.com/azure/static-web-apps/>
- <https://github.com/Azure/static-web-apps-deploy>
