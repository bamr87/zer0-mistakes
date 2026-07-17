---
title: "Matplotlib Visualization"
description: "---"
layout: notebook
collection: notebooks
date: 2026-07-01T03:24:10.000Z
categories: [Notebooks]
tags: [jupyter, python]
comments: true
jupyter_metadata: true
lastmod: 2026-07-01T03:24:10.000Z
permalink: /notebooks/matplotlib-visualization/
---
---
title: "Data Visualization with Matplotlib" description: "Create professional charts and visualizations from weather data using Python's Matplotlib library" date: 2025-01-27 lastmod: 2025-01-27 author: "Zer0-Mistakes Team" layout: notebook difficulty: intermediate tags: [python, matplotlib, visualization, data-science, charts] categories: [Notebooks, Tutorials] toc: true
comments: true
---

# Data Visualization with Matplotlib

Learn to create professional-quality charts and visualizations using Python's Matplotlib library. This tutorial uses real weather data to demonstrate various chart types including line plots, bar charts, scatter plots, and multi-panel figures.

**What you'll learn:**
- Basic line and bar charts
- Customizing colors, labels, and legends
- Creating subplots and multi-panel figures
- Scatter plots with color mapping
- Saving high-quality images for publication

## Setup and Imports


```python
# Import visualization libraries
import matplotlib.pyplot as plt
import pandas as pd
import numpy as np

# Configure matplotlib for better display
plt.rcParams['figure.figsize'] = [10, 6]  # Default figure size
plt.rcParams['figure.dpi'] = 100  # Display resolution
plt.rcParams['savefig.dpi'] = 150  # Save resolution
plt.rcParams['axes.grid'] = True
plt.rcParams['grid.alpha'] = 0.3

print("✅ Libraries imported successfully!")
print(f"Matplotlib version: {plt.matplotlib.__version__}")
```

## Load Weather Data


```python
# Load the weather dataset
weather = pd.read_csv('/Users/bamr87/github/zer0-mistakes/assets/data/notebooks/weather_data.csv', 
                      parse_dates=['date'])

print("🌤️ Weather Data Preview:")
print(f"Shape: {weather.shape[0]} days × {weather.shape[1]} columns\n")
weather.head(10)
```

## Basic Line Chart: Temperature Over Time


```python
# Create a simple line chart showing temperature trends
fig, ax = plt.subplots(figsize=(12, 5))

# Plot each city as a separate line
cities = weather['city'].unique()
colors = ['#e63946', '#457b9d', '#2a9d8f', '#e9c46a', '#264653']

for i, city in enumerate(cities):
    city_data = weather[weather['city'] == city]
    ax.plot(city_data['date'], city_data['temperature_f'], 
            label=city, color=colors[i], linewidth=2, marker='o', markersize=4)

# Customize the chart
ax.set_xlabel('Date', fontsize=12)
ax.set_ylabel('Temperature (°F)', fontsize=12)
ax.set_title('Daily Temperature by City', fontsize=14, fontweight='bold')
ax.legend(loc='upper right', frameon=True)
ax.grid(True, alpha=0.3)

# Rotate date labels for readability
plt.xticks(rotation=45)
plt.tight_layout()
plt.show()
```

## Bar Chart: Average Temperature by City


```python
# Calculate average temperature by city
avg_temp = weather.groupby('city')['temperature_f'].mean().sort_values(ascending=False)

# Create horizontal bar chart
fig, ax = plt.subplots(figsize=(10, 6))
bars = ax.barh(avg_temp.index, avg_temp.values, color=colors[:len(avg_temp)])

# Add value labels on bars
for bar, temp in zip(bars, avg_temp.values):
    ax.text(bar.get_width() + 1, bar.get_y() + bar.get_height()/2, 
            f'{temp:.1f}°F', va='center', fontsize=11)

ax.set_xlabel('Average Temperature (°F)', fontsize=12)
ax.set_title('Average Temperature by City', fontsize=14, fontweight='bold')
ax.set_xlim(0, max(avg_temp.values) + 15)

plt.tight_layout()
plt.show()
```

## Scatter Plot: Temperature vs. Humidity


```python
# Create scatter plot with color-coded precipitation
fig, ax = plt.subplots(figsize=(10, 7))

scatter = ax.scatter(weather['humidity'], weather['temperature_f'],
                     c=weather['precipitation'], cmap='Blues',
                     s=80, alpha=0.7, edgecolors='white', linewidth=0.5)

# Add colorbar
cbar = plt.colorbar(scatter, ax=ax)
cbar.set_label('Precipitation (inches)', fontsize=11)

ax.set_xlabel('Humidity (%)', fontsize=12)
ax.set_ylabel('Temperature (°F)', fontsize=12)
ax.set_title('Temperature vs. Humidity\n(Color = Precipitation)', fontsize=14, fontweight='bold')

plt.tight_layout()
plt.show()
```

## Multi-Panel Figure: Weather Dashboard


```python
# Create a 2x2 dashboard with multiple visualizations
fig, axes = plt.subplots(2, 2, figsize=(14, 10))
fig.suptitle('Weather Analysis Dashboard', fontsize=16, fontweight='bold', y=1.02)

# 1. Temperature distribution (histogram)
ax1 = axes[0, 0]
ax1.hist(weather['temperature_f'], bins=15, color='#e63946', edgecolor='white', alpha=0.7)
ax1.axvline(weather['temperature_f'].mean(), color='#264653', linestyle='--', 
            linewidth=2, label=f'Mean: {weather["temperature_f"].mean():.1f}°F')
ax1.set_xlabel('Temperature (°F)')
ax1.set_ylabel('Frequency')
ax1.set_title('Temperature Distribution')
ax1.legend()

# 2. Weather conditions pie chart
ax2 = axes[0, 1]
condition_counts = weather['condition'].value_counts()
colors_pie = ['#ffd166', '#06d6a0', '#118ab2', '#073b4c', '#ef476f']
wedges, texts, autotexts = ax2.pie(condition_counts.values, labels=condition_counts.index,
                                    autopct='%1.1f%%', colors=colors_pie[:len(condition_counts)],
                                    explode=[0.05] * len(condition_counts))
ax2.set_title('Weather Conditions')

# 3. Wind speed by city (box plot)
ax3 = axes[1, 0]
city_wind_data = [weather[weather['city'] == city]['wind_speed'].values for city in cities]
bp = ax3.boxplot(city_wind_data, labels=cities, patch_artist=True)
for patch, color in zip(bp['boxes'], colors):
    patch.set_facecolor(color)
    patch.set_alpha(0.7)
ax3.set_xlabel('City')
ax3.set_ylabel('Wind Speed (mph)')
ax3.set_title('Wind Speed Distribution by City')

# 4. Precipitation by city (grouped bar)
ax4 = axes[1, 1]
city_precip = weather.groupby('city')['precipitation'].agg(['mean', 'max']).reset_index()
x = np.arange(len(city_precip))
width = 0.35
bars1 = ax4.bar(x - width/2, city_precip['mean'], width, label='Average', color='#457b9d')
bars2 = ax4.bar(x + width/2, city_precip['max'], width, label='Maximum', color='#1d3557')
ax4.set_xlabel('City')
ax4.set_ylabel('Precipitation (inches)')
ax4.set_title('Precipitation by City')
ax4.set_xticks(x)
ax4.set_xticklabels(city_precip['city'], rotation=45, ha='right')
ax4.legend()

plt.tight_layout()
plt.show()
```

## Saving Figures

Save your visualizations as high-quality images for reports and presentations:


```python
# Create a publication-ready figure and save it
import os

# Create output directory if it doesn't exist
output_dir = '/Users/bamr87/github/zer0-mistakes/assets/images/notebooks/matplotlib-visualization_files'
os.makedirs(output_dir, exist_ok=True)

# Create a clean, professional chart
fig, ax = plt.subplots(figsize=(10, 6))

# Group data by city and calculate daily averages
for i, city in enumerate(cities):
    city_data = weather[weather['city'] == city]
    ax.plot(city_data['date'], city_data['temperature_c'], 
            label=city, color=colors[i], linewidth=2.5)

ax.set_xlabel('Date', fontsize=12)
ax.set_ylabel('Temperature (°C)', fontsize=12)
ax.set_title('Temperature Trends Across Cities', fontsize=14, fontweight='bold')
ax.legend(loc='upper right', frameon=True, fancybox=True, shadow=True)
ax.grid(True, alpha=0.3)
plt.xticks(rotation=45)

# Save in multiple formats
fig.savefig(f'{output_dir}/temperature_trends.png', dpi=150, bbox_inches='tight',
            facecolor='white', edgecolor='none')
fig.savefig(f'{output_dir}/temperature_trends.svg', bbox_inches='tight',
            facecolor='white', edgecolor='none')

print(f"✅ Figures saved to: {output_dir}")
print("   - temperature_trends.png (150 DPI)")
print("   - temperature_trends.svg (vector format)")

plt.show()
```

## Summary

In this tutorial, you learned:

1. **Line charts** - Show trends over time with `plt.plot()`
2. **Bar charts** - Compare categories with `plt.bar()` and `plt.barh()`
3. **Scatter plots** - Visualize relationships with color mapping using `plt.scatter()`
4. **Subplots** - Create multi-panel dashboards with `plt.subplots()`
5. **Saving figures** - Export high-quality images with `fig.savefig()`

**Next steps:**
- Try [Seaborn](https://seaborn.pydata.org/) for statistical visualizations
- Explore [Plotly](https://plotly.com/python/) for interactive charts
- Check out our [Python Statistics](/notebooks/python-statistics/) tutorial
