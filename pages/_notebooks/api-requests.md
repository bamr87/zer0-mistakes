---
title: "Api Requests"
description: "---"
layout: notebook
collection: notebooks
date: 2026-07-01T03:24:13.000Z
categories: [Notebooks]
tags: [jupyter, python]
comments: true
jupyter_metadata: true
lastmod: 2026-07-01T03:24:13.000Z
permalink: /notebooks/api-requests/
---
---
title: "Working with APIs in Python" description: "Learn to fetch, process, and analyze data from web APIs using Python's requests library" date: 2025-01-27 lastmod: 2025-01-27 author: "Zer0-Mistakes Team" layout: notebook difficulty: beginner tags: [python, api, requests, json, web-scraping] categories: [Notebooks, Tutorials] toc: true
comments: true
---

# Working with APIs in Python

Learn to fetch and process data from web APIs using Python's `requests` library. This tutorial covers HTTP methods, JSON parsing, error handling, and working with real public APIs.

**What you'll learn:**
- Making HTTP GET and POST requests
- Parsing JSON responses into Python objects
- Error handling and retry strategies
- Working with query parameters and headers
- Processing API data with Pandas

## Setup and Imports


```python
# Import required libraries
import requests
import json
import pandas as pd
from datetime import datetime

print("✅ Libraries imported successfully!")
print(f"Requests version: {requests.__version__}")
```

    ✅ Libraries imported successfully!
    Requests version: 2.32.5


## Basic GET Request

Let's start by fetching data from a simple, public API:


```python
# Make a simple GET request to JSONPlaceholder (free fake API)
url = "https://jsonplaceholder.typicode.com/posts/1"
response = requests.get(url)

print("🌐 Basic GET Request")
print("=" * 50)
print(f"URL: {url}")
print(f"Status Code: {response.status_code}")
print(f"Response Time: {response.elapsed.total_seconds():.3f}s")

# Parse JSON response
data = response.json()
print(f"\n📦 Response Data:")
print(f"  User ID: {data['userId']}")
print(f"  Post ID: {data['id']}")
print(f"  Title: {data['title'][:50]}...")
print(f"  Body: {data['body'][:100]}...")
```

## Query Parameters

Pass parameters to filter API responses:


```python
# Use query parameters to filter posts by user
base_url = "https://jsonplaceholder.typicode.com/posts"
params = {"userId": 1}  # Get posts from user 1 only

response = requests.get(base_url, params=params)
posts = response.json()

print(f"📝 Posts by User 1:")
print(f"Total posts: {len(posts)}\n")

# Display first 5 posts
for post in posts[:5]:
    print(f"  [{post['id']}] {post['title'][:60]}...")
```

## Error Handling

Properly handle API errors and edge cases:


```python
def safe_api_request(url, params=None, timeout=10):
    """Make an API request with proper error handling"""
    try:
        response = requests.get(url, params=params, timeout=timeout)
        response.raise_for_status()  # Raises HTTPError for bad status codes
        return {"success": True, "data": response.json(), "status": response.status_code}
    except requests.exceptions.Timeout:
        return {"success": False, "error": "Request timed out", "status": None}
    except requests.exceptions.HTTPError as e:
        return {"success": False, "error": f"HTTP Error: {e}", "status": response.status_code}
    except requests.exceptions.RequestException as e:
        return {"success": False, "error": f"Request failed: {e}", "status": None}
    except json.JSONDecodeError:
        return {"success": False, "error": "Invalid JSON response", "status": response.status_code}

# Test with valid URL
print("🔒 Safe API Requests with Error Handling")
print("=" * 60)

# Test 1: Valid request
result = safe_api_request("https://jsonplaceholder.typicode.com/posts/1")
print(f"\n✅ Valid request:")
print(f"   Success: {result['success']}")
print(f"   Status: {result['status']}")

# Test 2: Invalid endpoint (404)
result = safe_api_request("https://jsonplaceholder.typicode.com/posts/99999")
print(f"\n⚠️ Non-existent resource:")
print(f"   Success: {result['success']}")
print(f"   Status: {result['status']}")

# Test 3: Invalid domain
result = safe_api_request("https://this-domain-does-not-exist-12345.com/api", timeout=3)
print(f"\n❌ Invalid domain:")
print(f"   Success: {result['success']}")
print(f"   Error: {result['error'][:50]}...")
```

## Working with Public APIs: GitHub

Fetch data from GitHub's public API (no authentication required for basic requests):


```python
# Fetch repository information from GitHub API
repo_url = "https://api.github.com/repos/jekyll/jekyll"
headers = {"Accept": "application/vnd.github.v3+json"}

response = requests.get(repo_url, headers=headers)
repo = response.json()

print("🐙 GitHub Repository Info: Jekyll/Jekyll")
print("=" * 60)
print(f"\n📌 Repository Details:")
print(f"   Name: {repo['full_name']}")
print(f"   Description: {repo['description'][:70]}...")
print(f"   ⭐ Stars: {repo['stargazers_count']:,}")
print(f"   🍴 Forks: {repo['forks_count']:,}")
print(f"   👁️ Watchers: {repo['watchers_count']:,}")
print(f"   📝 Open Issues: {repo['open_issues_count']:,}")
print(f"   📄 License: {repo.get('license', {}).get('name', 'N/A')}")
print(f"   🔧 Language: {repo['language']}")
print(f"   📅 Created: {repo['created_at'][:10]}")
print(f"   📅 Last Updated: {repo['updated_at'][:10]}")
```

## Converting API Data to DataFrame

Process API responses into Pandas DataFrames for analysis:


```python
# Fetch multiple users and create a DataFrame
users_url = "https://jsonplaceholder.typicode.com/users"
response = requests.get(users_url)
users = response.json()

# Convert to DataFrame
df = pd.DataFrame(users)

# Extract nested data (address)
df['city'] = df['address'].apply(lambda x: x['city'])
df['company_name'] = df['company'].apply(lambda x: x['name'])

# Select relevant columns
df_clean = df[['id', 'name', 'username', 'email', 'city', 'company_name']]

print("👥 Users Data as DataFrame:")
print(f"Shape: {df_clean.shape}\n")
df_clean
```

## POST Request: Creating Data

Send data to an API using POST requests:


```python
# Create a new post using POST request
post_url = "https://jsonplaceholder.typicode.com/posts"

# Data to send
new_post = {
    "title": "Learning Python APIs",
    "body": "This tutorial teaches you how to work with REST APIs in Python using the requests library.",
    "userId": 1
}

# Send POST request
response = requests.post(
    post_url,
    json=new_post,  # Automatically serializes to JSON and sets Content-Type
    headers={"Content-Type": "application/json"}
)

print("📮 POST Request - Create New Resource")
print("=" * 60)
print(f"Status Code: {response.status_code}")
print(f"Response Time: {response.elapsed.total_seconds():.3f}s")

created = response.json()
print(f"\n✅ Created Post:")
print(f"   ID: {created['id']} (assigned by server)")
print(f"   Title: {created['title']}")
print(f"   User ID: {created['userId']}")
```

## Summary Statistics from API Data


```python
# Fetch all posts and analyze
all_posts_url = "https://jsonplaceholder.typicode.com/posts"
response = requests.get(all_posts_url)
all_posts = response.json()

# Create DataFrame and analyze
posts_df = pd.DataFrame(all_posts)
posts_df['title_length'] = posts_df['title'].str.len()
posts_df['body_length'] = posts_df['body'].str.len()

print("📊 API DATA ANALYSIS SUMMARY")
print("=" * 60)

print(f"\n📋 Dataset Overview:")
print(f"   Total Posts: {len(posts_df)}")
print(f"   Unique Users: {posts_df['userId'].nunique()}")

print(f"\n📏 Content Statistics:")
print(f"   Avg Title Length: {posts_df['title_length'].mean():.1f} characters")
print(f"   Avg Body Length: {posts_df['body_length'].mean():.1f} characters")
print(f"   Shortest Post: {posts_df['body_length'].min()} chars")
print(f"   Longest Post: {posts_df['body_length'].max()} chars")

print(f"\n👤 Posts per User:")
user_posts = posts_df.groupby('userId').size()
print(f"   Min: {user_posts.min()} posts")
print(f"   Max: {user_posts.max()} posts")
print(f"   Avg: {user_posts.mean():.1f} posts")

print("\n" + "=" * 60)
```

## Next Steps

This tutorial covered the basics of working with APIs in Python. To continue learning:

1. **Analyze your data** - Check out the [Pandas Data Analysis](/notebooks/pandas-data-analysis/) tutorial
2. **Visualize API data** - See the [Matplotlib Visualization](/notebooks/matplotlib-visualization/) tutorial
3. **Statistical analysis** - Learn more in the [Python Statistics](/notebooks/python-statistics/) tutorial

**Key Takeaways:**
- Use `requests.get()` for fetching data, `requests.post()` for sending data
- Always handle errors with try/except blocks
- Set timeouts to prevent hanging requests
- Use `response.json()` to parse JSON responses
- Convert API data to DataFrames for powerful analysis

**Useful Public APIs to Practice With:**
- [JSONPlaceholder](https://jsonplaceholder.typicode.com/) - Fake REST API
- [GitHub API](https://docs.github.com/en/rest) - Repository data
- [Open Weather Map](https://openweathermap.org/api) - Weather data
- [REST Countries](https://restcountries.com/) - Country information
