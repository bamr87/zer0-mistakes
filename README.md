---
title: zer0-mistakes
sub-title: Jekyll Theme
description: Docker-optimized Jekyll theme with AI-powered installation automation and comprehensive error handling.
version: 2.0.0
layout: default
tags:
  - jekyll
  - docker
  - automation
  - ai-powered
  - error-handling
categories:
  - bootstrap
  - quickstart
  - docker
created: 2024-02-10T23:51:11.480Z
lastmod: 2025-07-03T12:00:00.000Z
draft: false
permalink: /zer0/
slug: zer0
keywords:
  - jekyll
  - docker
  - automation
  - installation
date: 2025-07-03T12:00:00.000Z
snippet: Jekyll theme installation with Docker optimization
comments: true
preview: /images/zer0-mistakes-docker.png
---

[![pages-build-deployment](https://github.com/bamr87/zer0-mistakes/actions/workflows/pages/pages-build-deployment/badge.svg)](https://github.com/bamr87/zer0-mistakes/actions/workflows/pages/pages-build-deployment)

[![Gem Version](https://badge.fury.io/rb/jekyll-theme-zer0.svg)](https://badge.fury.io/rb/jekyll-theme-zer0)

# 🌱 Jekyll Theme Seed

This is a **Docker-optimized Jekyll theme** with AI-powered installation automation, and comprehensive error handling. It embodies IT-Journey principles of Design for Failure (DFF), Don't Repeat Yourself (DRY), Keep It Simple (KIS), and AI-Powered Development (AIPD).

## 🚀 Quick Start

### Option 1: One-Line Installation (Recommended)

```bash
curl -fsSL https://raw.githubusercontent.com/bamr87/zer0-mistakes/main/install.sh | bash
```

### Option 2: Manual Installation

```bash
gh repo clone bamr87/zer0-mistakes
cd zer0-mistakes
docker-compose up
```

## ✨ What Makes This Special

### 🐳 **Docker-First Approach**

- **Cross-Platform Compatibility** - Works on Apple Silicon, Intel, and Linux
- **Zero Configuration** - Automatic environment setup and optimization
- **Port Standardization** - Consistent localhost:4000 across all environments
- **Platform Isolation** - No local Ruby/Jekyll installation required

### 🛡️ **Self-Healing Installation**

- **Error Detection** - Automatically identifies and fixes common issues
- **Content Protection** - Safely handles missing dependencies and broken includes
- **Configuration Optimization** - Creates Docker-compatible development settings
- **Comprehensive Documentation** - Auto-generates troubleshooting guides

### 🧬 **AI-Enhanced Error Handling**

- **Predictive Problem Resolution** - Fixes issues before they cause failures
- **Context-Aware Configuration** - Adapts to different project structures
- **Intelligent Fallbacks** - Graceful degradation when components are unavailable
- **Learning System** - Improves based on common installation patterns

## 🚀 Core Features

### Installation Automation

```bash
# Installs and configures everything automatically
curl -fsSL https://raw.githubusercontent.com/bamr87/zer0-mistakes/main/install.sh | bash

# Results in working Docker environment:
docker-compose up  # Just works!
```

### Error Prevention

- **Theme Dependency Resolution** - Handles missing gem themes
- **Include File Protection** - Comments out problematic script includes  
- **Plugin Management** - Ensures essential Jekyll plugins are configured
- **Docker Optimization** - Creates container-friendly configurations

### Development Experience

- **2-5 minute setup** - From zero to running site
- **95%+ success rate** - Reliable installation across environments
- **Comprehensive troubleshooting** - Self-documenting error solutions
- **Zero manual configuration** - Automated optimization for common scenarios

## Prerequisites

### Required Tools

- **Docker** - For containerized development environment
- **Git** - For repository management
- **curl** - For one-line installation (or manual download)

```shell
# Confirm your system information

system_profiler SPHardwareDataType | awk '/Model Name:|Model Identifier:|Model Number:|Chip:|System Firmware Version:/ {print $0}'
system_profiler SPSoftwareDataType | awk '/System Version:|Kernel Version:/ {print $0}'

```

## Prerequisites

Before we begin, make sure you have the following software installed on your machine:

- [VS code](https://code.visualstudio.com/) installed on your machine (if you're smart)
- [docker](https://docs.docker.com/get-docker/) installed on your machine (if you're a pro)
- [homebrew](https://brew.sh/) installed on your machine (if you're a cli junkie)
- [git](https://git-scm.com/) installed on your machine (if you want to track the truth)
- [gh cli](https://cli.github.com/) installed on your machine (if you want to publish the truth)

For step-by-step instructions on how to install these tools, visit the "Quickstart" section of the site here: [Quickstart](/quickstart)

To use these tools effectively, you need:

- A GitHub account and a repository where you want to maintain and publish your site.
- A personal access token from GitHub to authenticate with the GitHub API.
- A cup of coffee or your favorite beverage to keep you energized.
- A positive attitude and a sense of curiosity.
- A sense of adventure and a willingness to explore new tools and technologies.
- A growth mindset and a willingness to embrace challenges and learn from mistakes.
- A sense of humor and the ability to laugh at unexpected errors and bugs.
- A supportive community or network of friends and colleagues to ask for help and share your progress.
- A clear goal and motivation to build this project and share your knowledge with the world.
- A spirit of creativity and a desire to express yourself through code and technology.

More importantly, you need to:

- Embrace responsibility and ethical, inclusive software development.
- Cultivate empathy and create tools that benefit others.
- Appreciate opportunities and resources for learning and growth.
- Foster curiosity about AI and machine learning.
- Pursue a purpose that enhances productivity and creativity.
- Persevere through challenges with determination.
- Learn from others and share knowledge with humility.
- Believe in technology's potential to improve lives and create positive change.
- Make the learning process fun and engaging.
- Balance work with breaks for well-being.
- Celebrate achievements and share your work with the world.
- Anticipate making a difference in the developer community.
- Find satisfaction and fulfillment in creating value for others.
- Connect with the global community of developers and creators.
- Believe in your ability to create something meaningful and impactful.
- Stand in awe of technology's power to transform ideas into reality.

## Confirm Prerequisites

Make sure you have the following installed on your machine:

```shell
# Check if git is installed
if ! git --version > /dev/null 2>&1; then
  echo "git is not installed. Installing..."
  brew install git
else
  echo "git is already installed."
fi

# Check if gh is installed
if ! gh --version > /dev/null 2>&1; then
  echo "gh is not installed. Installing..."
  brew install gh
else
  echo "gh is already installed."
fi

# Check if gh is authenticated
if ! gh auth status > /dev/null 2>&1; then
  echo "gh is not authenticated. Please authenticate..."
  gh auth login
else
  echo "gh is already authenticated."
fi

# Check if Docker is installed
if ! docker --version > /dev/null 2>&1; then
  echo "Docker is not installed. Installing..."
  brew install --cask docker
else
  echo "Docker is already installed."
fi

# Check if Visual Studio Code is installed
if ! code --version > /dev/null 2>&1; then
  echo "Visual Studio Code is not installed. Installing..."
  brew install --cask visual-studio-code
else
  echo "Visual Studio Code is already installed."
fi
```

## Installation

The zer0-mistakes Jekyll theme can be installed in any repository using the included installation script. This script copies all essential theme files and creates the proper directory structure.

### Quick Installation

```bash
# Clone this repository
git clone https://github.com/bamr87/zer0-mistakes.git
cd zer0-mistakes

# Install the theme in a new directory
./install.sh my-new-site

# Or install in current directory
./install.sh .
```

### What Gets Installed

The installation script copies the following essential files:

**Configuration Files:**

- `_config.yml` - Main Jekyll configuration
- `_config_dev.yml` - Development configuration  
- `frontmatter.json` - VS Code frontmatter configuration

**Build & Dependency Files:**

- `Gemfile` - Ruby dependencies
- `Rakefile` - Build tasks
- `package.json` - Node.js dependencies

**Docker Files:**

- `docker-compose.yml` - Multi-container setup
- `Dockerfile` - Container configuration

**Theme Directories:**

- `_data/` - Site data files and navigation
- `_sass/` - Sass stylesheets and custom styles
- `_includes/` - Reusable template components
- `_layouts/` - Page layout templates  
- `assets/` - Static assets (CSS, JS, images)

**Static Files:**

- `404.html` - Custom error page
- `favicon.ico` - Site icon
- `index.md` - Homepage (only if not exists)

**Additional Files:**

- `.gitignore` - Git ignore rules (only if not exists)
- `INSTALLATION.md` - Setup instructions

### Installation Options

```bash
# Show help and usage information
./install.sh --help

# Install in current directory
./install.sh

# Install in a specific directory
./install.sh /path/to/my-site

# Install in a relative directory
./install.sh ../my-new-site
```

### After Installation

Once installed, navigate to your new site directory and start developing:

```bash
cd my-new-site

# Using Docker (recommended)
docker-compose up

# Or using local Ruby environment
bundle install
bundle exec jekyll serve --config _config_dev.yml

# Your site will be available at http://localhost:4000
```

### Customization

After installation:

1. **Edit Configuration:** Update `_config.yml` with your site details
2. **Customize Styles:** Modify `_sass/custom.scss` for custom styling
3. **Add Content:** Create pages in the `pages/` directory
4. **Update Navigation:** Edit `_data/navigation/` files for site navigation

For detailed setup instructions, see the `INSTALLATION.md` file created during installation.

## Environment

{% if site.level == 'her0' %}

### Set your own environment variables

  {% include zer0-env-var.html %}

{% endif %}

### Set the default environment variables

```shell
# Or use the following to set the environment variables

export GITHOME=~/github
export GHUSER=$(gh api user --jq '.login')
export GIT_REPO=zer0-mistakes
export ZREPO=$GITHOME/$GIT_REPO
```

### Add the environment variables to your shell profile (optional)

```shell
#open Code to edit your shell profile and copy the environment variables

code ~/.zprofile
```

```shell
# Confirm the environment variables by echoing them

echo $GITHOME # /Users/bamr87/github
echo $GHUSER # bamr87
echo $GIT_REPO # zer0-mistakes
echo $ZREPO # /Users/bamr87/github/zer0-mistakes
```

### Set your Git email and name

```shell
# Set your Git email and name to tag your commits

git config --global user.email "$GHUSER@users.noreply.github.com"
git config --global user.name "$GHUSER"
```

### Set your GitHub email using ID (optional)

See [here](https://github.com/settings/emails) for details.

```shell
# If you didnt already set it in the previous step
# FIXME: quotes in comments dont work

echo "What is your Github ID?"
read GIT_ID
```

```shell
# Set your email using ID

git config --global user.email "$GIT_ID+$GHUSER@users.noreply.github.com"
```

```shell
# confirm your email

git config -l
```

## Initialize your new github repository

[gh cli docs](https://cli.github.com/manual/)

```shell
# Create your github home directory and repo

mkdir -p $ZREPO
```

```shell
# Initialize your github repository

gh repo create $GIT_REPO --gitignore Jekyll -l mit --public
```

```shell
# If new repo, initialize it

cd $ZREPO
git init
git remote add origin https://github.com/${GHUSER}/${GIT_REPO}.git
git pull origin main
curl https://raw.githubusercontent.com/bamr87/it-journey/master/zer0.md > README.md
git add README.md
git commit -m "Init $GIT_REPO"
git branch -M main
git push -u origin main
```

### Checkpoint - Github Repo Initialized

Go to your new github repository.

```shell
# Open your new github repository in the browser

open https://github.com/${GHUSER}/${GIT_REPO}

```

<a id="repo-link"></a>

![Checkpoint 1](/assets/images/zer0-checkpoint-1.png)

## Initialize Jekyll

### Create Gemfile

```shell
# Create a new Gemfile
cd $ZREPO
touch Gemfile

# Write the non-commented lines to the Gemfile
echo 'source "https://rubygems.org"' >> Gemfile
echo "gem 'github-pages' , '231'" >> Gemfile
echo "gem 'jekyll' , '3.9.5'" >> Gemfile
echo "gem 'jekyll-theme-zer0' , '0.1.2'" >> Gemfile
echo "group :jekyll_plugins do" >> Gemfile
echo "  gem 'jekyll-feed', \"~> 0.17\"" >> Gemfile
echo "  gem 'jekyll-sitemap' , \"~> 1.4.0\"" >> Gemfile
echo "  gem 'jekyll-seo-tag', \"~> 2.8.0\"" >> Gemfile
echo "  gem 'jekyll-paginate', '~> 1.1'" >> Gemfile
echo "end" >> Gemfile
```

### Configure Jekyll

```shell
code _config.yml
```

```yaml
theme: jekyll-theme-zer0

title: zer0-mistakes
email: bamr87@zer0-mistakes.com
description: >- # this means to ignore newlines until "baseurl:"
  Write an awesome description for your new site here. You can edit this
  line in _config.yml. It will appear in your document head meta (for
  Google search results) and in your feed.xml site description.
baseurl: null # the subpath of your site, e.g. /blog
url: null # the base hostname & protocol for your site, e.g. http://example.com
twitter_username: bamr87
github_username:  bamr87
```

### Create Dockerfile

```shell
# Create a new Dockerfile
cd $ZREPO
touch Dockerfile

# Write the content to the Dockerfile
echo "# Use an official Ruby runtime as a parent image" >> Dockerfile
echo "FROM ruby:2.7.4" >> Dockerfile
echo "# escape=\\" >> Dockerfile
echo "ENV GITHUB_GEM_VERSION 231" >> Dockerfile
echo "ENV JSON_GEM_VERSION 1.8.6" >> Dockerfile
echo "ENV GIT_REPO ${GIT_REPO}" >> Dockerfile
echo "WORKDIR /app" >> Dockerfile
echo "ADD . /app" >> Dockerfile
echo "RUN gem update --system 3.3.22" >> Dockerfile
echo "RUN bundle update" >> Dockerfile
echo "RUN bundle install" >> Dockerfile
echo "RUN bundle clean --force" >> Dockerfile
echo "EXPOSE 4000" >> Dockerfile
echo 'CMD ["bundle", "exec", "jekyll", "serve", "--host", "0.0.0.0"]' >> Dockerfile
```

```shell
# build the docker image based on the Dockerfile
docker build -t ${GIT_REPO} .
```

```shell
# Run the container in detached mode
docker run -d -p 4000:4000 -v ${ZREPO}:/app --name zer0_container ${GIT_REPO}

# Start the container and run the CMD line from the Dockerfile
docker start zer0_container

# Attach to the running container
docker exec -it zer0_container /bin/bash
```

## Checkpoint - Jekyll Initialized

```shell
open http://localhost:4000/
```

![](/assets/images/zer0-checkpoint-2.png)

```shell
code _config.yml
```

```yaml
title: zer0-mistakes
email: bamr87@zer0-mistakes.com
description: >- # this means to ignore newlines until "baseurl:"
  Write an awesome description for your new site here. You can edit this
  line in _config.yml. It will appear in your document head meta (for
  Google search results) and in your feed.xml site description.
baseurl: null # the subpath of your site, e.g. /blog
url: null # the base hostname & protocol for your site, e.g. http://example.com
twitter_username: bamr87
github_username:  bamr87
```
