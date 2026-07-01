---
title: "Data Analysis with Pandas"
description: "Learn essential data analysis techniques using Python and Pandas. This tutorial covers loading data, exploration, filtering, grouping, and pivot tables using a real sales dataset."
layout: notebook
collection: notebooks
date: 2026-07-01T03:24:05.000Z
categories: [Notebooks]
tags: [jupyter, python]
comments: true
jupyter_metadata: true
lastmod: 2026-07-01T03:24:05.000Z
permalink: /notebooks/pandas-data-analysis/
---
# Data Analysis with Pandas

Learn essential data analysis techniques using Python and Pandas. This tutorial covers loading data, exploration, filtering, grouping, and pivot tables using a real sales dataset.

**Prerequisites:**
- Basic Python knowledge
- Pandas library installed

**What you'll learn:**
- Loading and exploring CSV data
- Filtering and querying DataFrames
- Group by operations and aggregations
- Creating pivot tables for analysis

## 1. Setup: Import Libraries

First, let's import the required libraries for data analysis.


```python
import pandas as pd
import numpy as np
from datetime import datetime

# Display settings for better output formatting
pd.set_option('display.max_columns', None)
pd.set_option('display.width', None)
pd.set_option('display.float_format', '{:.2f}'.format)

print("Libraries imported successfully!")
print(f"Pandas version: {pd.__version__}")
print(f"NumPy version: {np.__version__}")
```

    Libraries imported successfully!
    Pandas version: 3.0.0
    NumPy version: 2.4.2


## 2. Load and Explore Data

Let's load our sales dataset and take a first look at the data structure.


```python
# Load the sales data
df = pd.read_csv('/Users/bamr87/github/zer0-mistakes/assets/data/notebooks/sales_data.csv')

# Convert date column to datetime
df['date'] = pd.to_datetime(df['date'])

# Display first few rows
print("📊 Sales Data - First 10 rows:")
df.head(10)
```

    📊 Sales Data - First 10 rows:





<div>
<style scoped>
    .dataframe tbody tr th:only-of-type {
        vertical-align: middle;
    }

    .dataframe tbody tr th {
        vertical-align: top;
    }

    .dataframe thead th {
        text-align: right;
    }
</style>
<table border="1" class="dataframe">
  <thead>
    <tr style="text-align: right;">
      <th></th>
      <th>date</th>
      <th>product</th>
      <th>category</th>
      <th>quantity</th>
      <th>unit_price</th>
      <th>revenue</th>
      <th>region</th>
      <th>salesperson</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th>0</th>
      <td>2025-01-05</td>
      <td>Laptop Pro</td>
      <td>Electronics</td>
      <td>3</td>
      <td>1299.99</td>
      <td>3899.97</td>
      <td>North</td>
      <td>Alice Johnson</td>
    </tr>
    <tr>
      <th>1</th>
      <td>2025-01-07</td>
      <td>Wireless Mouse</td>
      <td>Electronics</td>
      <td>15</td>
      <td>29.99</td>
      <td>449.85</td>
      <td>South</td>
      <td>Bob Smith</td>
    </tr>
    <tr>
      <th>2</th>
      <td>2025-01-08</td>
      <td>Office Chair</td>
      <td>Furniture</td>
      <td>5</td>
      <td>249.99</td>
      <td>1249.95</td>
      <td>East</td>
      <td>Carol Davis</td>
    </tr>
    <tr>
      <th>3</th>
      <td>2025-01-10</td>
      <td>Standing Desk</td>
      <td>Furniture</td>
      <td>2</td>
      <td>599.99</td>
      <td>1199.98</td>
      <td>West</td>
      <td>David Wilson</td>
    </tr>
    <tr>
      <th>4</th>
      <td>2025-01-12</td>
      <td>Monitor 27inch</td>
      <td>Electronics</td>
      <td>8</td>
      <td>399.99</td>
      <td>3199.92</td>
      <td>North</td>
      <td>Alice Johnson</td>
    </tr>
    <tr>
      <th>5</th>
      <td>2025-01-15</td>
      <td>Keyboard Mechanical</td>
      <td>Electronics</td>
      <td>12</td>
      <td>149.99</td>
      <td>1799.88</td>
      <td>South</td>
      <td>Bob Smith</td>
    </tr>
    <tr>
      <th>6</th>
      <td>2025-01-17</td>
      <td>Desk Lamp</td>
      <td>Furniture</td>
      <td>20</td>
      <td>49.99</td>
      <td>999.80</td>
      <td>East</td>
      <td>Carol Davis</td>
    </tr>
    <tr>
      <th>7</th>
      <td>2025-01-20</td>
      <td>Webcam HD</td>
      <td>Electronics</td>
      <td>10</td>
      <td>79.99</td>
      <td>799.90</td>
      <td>West</td>
      <td>David Wilson</td>
    </tr>
    <tr>
      <th>8</th>
      <td>2025-01-22</td>
      <td>Laptop Pro</td>
      <td>Electronics</td>
      <td>5</td>
      <td>1299.99</td>
      <td>6499.95</td>
      <td>North</td>
      <td>Eve Martinez</td>
    </tr>
    <tr>
      <th>9</th>
      <td>2025-01-25</td>
      <td>Wireless Mouse</td>
      <td>Electronics</td>
      <td>25</td>
      <td>29.99</td>
      <td>749.75</td>
      <td>South</td>
      <td>Frank Brown</td>
    </tr>
  </tbody>
</table>
</div>




```python
# Get basic information about the dataset
print("📋 Dataset Information:")
print(f"Shape: {df.shape[0]} rows × {df.shape[1]} columns")
print(f"\nColumn names: {list(df.columns)}")
print("\n" + "="*60)
df.info()
```

    📋 Dataset Information:
    Shape: 98 rows × 8 columns
    
    Column names: ['date', 'product', 'category', 'quantity', 'unit_price', 'revenue', 'region', 'salesperson']
    
    ============================================================
    <class 'pandas.DataFrame'>
    RangeIndex: 98 entries, 0 to 97
    Data columns (total 8 columns):
     #   Column       Non-Null Count  Dtype         
    ---  ------       --------------  -----         
     0   date         98 non-null     datetime64[us]
     1   product      98 non-null     str           
     2   category     98 non-null     str           
     3   quantity     98 non-null     int64         
     4   unit_price   98 non-null     float64       
     5   revenue      98 non-null     float64       
     6   region       98 non-null     str           
     7   salesperson  98 non-null     str           
    dtypes: datetime64[us](1), float64(2), int64(1), str(4)
    memory usage: 6.3 KB



```python
# Statistical summary of numeric columns
print("📈 Statistical Summary:")
df.describe()
```

    📈 Statistical Summary:





<div>
<style scoped>
    .dataframe tbody tr th:only-of-type {
        vertical-align: middle;
    }

    .dataframe tbody tr th {
        vertical-align: top;
    }

    .dataframe thead th {
        text-align: right;
    }
</style>
<table border="1" class="dataframe">
  <thead>
    <tr style="text-align: right;">
      <th></th>
      <th>date</th>
      <th>quantity</th>
      <th>unit_price</th>
      <th>revenue</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th>count</th>
      <td>98</td>
      <td>98.00</td>
      <td>98.00</td>
      <td>98.00</td>
    </tr>
    <tr>
      <th>mean</th>
      <td>2025-05-08 14:56:19.591836</td>
      <td>16.55</td>
      <td>324.99</td>
      <td>2840.04</td>
    </tr>
    <tr>
      <th>min</th>
      <td>2025-01-05 00:00:00</td>
      <td>2.00</td>
      <td>29.99</td>
      <td>449.85</td>
    </tr>
    <tr>
      <th>25%</th>
      <td>2025-03-08 12:00:00</td>
      <td>8.00</td>
      <td>49.99</td>
      <td>1199.74</td>
    </tr>
    <tr>
      <th>50%</th>
      <td>2025-05-09 00:00:00</td>
      <td>15.00</td>
      <td>174.99</td>
      <td>2124.89</td>
    </tr>
    <tr>
      <th>75%</th>
      <td>2025-07-09 12:00:00</td>
      <td>22.00</td>
      <td>399.99</td>
      <td>3862.44</td>
    </tr>
    <tr>
      <th>max</th>
      <td>2025-09-10 00:00:00</td>
      <td>50.00</td>
      <td>1299.99</td>
      <td>11699.91</td>
    </tr>
    <tr>
      <th>std</th>
      <td>NaN</td>
      <td>10.74</td>
      <td>389.56</td>
      <td>2236.43</td>
    </tr>
  </tbody>
</table>
</div>



## 3. Filtering and Querying Data

Learn different ways to filter and query your DataFrame.


```python
# Filter: Get all Electronics sales
electronics_sales = df[df['category'] == 'Electronics']
print(f"🔌 Electronics Sales: {len(electronics_sales)} transactions")
electronics_sales.head()
```

    🔌 Electronics Sales: 68 transactions





<div>
<style scoped>
    .dataframe tbody tr th:only-of-type {
        vertical-align: middle;
    }

    .dataframe tbody tr th {
        vertical-align: top;
    }

    .dataframe thead th {
        text-align: right;
    }
</style>
<table border="1" class="dataframe">
  <thead>
    <tr style="text-align: right;">
      <th></th>
      <th>date</th>
      <th>product</th>
      <th>category</th>
      <th>quantity</th>
      <th>unit_price</th>
      <th>revenue</th>
      <th>region</th>
      <th>salesperson</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th>0</th>
      <td>2025-01-05</td>
      <td>Laptop Pro</td>
      <td>Electronics</td>
      <td>3</td>
      <td>1299.99</td>
      <td>3899.97</td>
      <td>North</td>
      <td>Alice Johnson</td>
    </tr>
    <tr>
      <th>1</th>
      <td>2025-01-07</td>
      <td>Wireless Mouse</td>
      <td>Electronics</td>
      <td>15</td>
      <td>29.99</td>
      <td>449.85</td>
      <td>South</td>
      <td>Bob Smith</td>
    </tr>
    <tr>
      <th>4</th>
      <td>2025-01-12</td>
      <td>Monitor 27inch</td>
      <td>Electronics</td>
      <td>8</td>
      <td>399.99</td>
      <td>3199.92</td>
      <td>North</td>
      <td>Alice Johnson</td>
    </tr>
    <tr>
      <th>5</th>
      <td>2025-01-15</td>
      <td>Keyboard Mechanical</td>
      <td>Electronics</td>
      <td>12</td>
      <td>149.99</td>
      <td>1799.88</td>
      <td>South</td>
      <td>Bob Smith</td>
    </tr>
    <tr>
      <th>7</th>
      <td>2025-01-20</td>
      <td>Webcam HD</td>
      <td>Electronics</td>
      <td>10</td>
      <td>79.99</td>
      <td>799.90</td>
      <td>West</td>
      <td>David Wilson</td>
    </tr>
  </tbody>
</table>
</div>




```python
# Multiple conditions: High-value sales (revenue > $3000) in the North region
high_value_north = df[(df['revenue'] > 3000) & (df['region'] == 'North')]
print(f"💰 High-value North sales: {len(high_value_north)} transactions")
print(f"Total revenue: ${high_value_north['revenue'].sum():,.2f}")
high_value_north
```

    💰 High-value North sales: 14 transactions
    Total revenue: $75,348.48





<div>
<style scoped>
    .dataframe tbody tr th:only-of-type {
        vertical-align: middle;
    }

    .dataframe tbody tr th {
        vertical-align: top;
    }

    .dataframe thead th {
        text-align: right;
    }
</style>
<table border="1" class="dataframe">
  <thead>
    <tr style="text-align: right;">
      <th></th>
      <th>date</th>
      <th>product</th>
      <th>category</th>
      <th>quantity</th>
      <th>unit_price</th>
      <th>revenue</th>
      <th>region</th>
      <th>salesperson</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th>0</th>
      <td>2025-01-05</td>
      <td>Laptop Pro</td>
      <td>Electronics</td>
      <td>3</td>
      <td>1299.99</td>
      <td>3899.97</td>
      <td>North</td>
      <td>Alice Johnson</td>
    </tr>
    <tr>
      <th>4</th>
      <td>2025-01-12</td>
      <td>Monitor 27inch</td>
      <td>Electronics</td>
      <td>8</td>
      <td>399.99</td>
      <td>3199.92</td>
      <td>North</td>
      <td>Alice Johnson</td>
    </tr>
    <tr>
      <th>8</th>
      <td>2025-01-22</td>
      <td>Laptop Pro</td>
      <td>Electronics</td>
      <td>5</td>
      <td>1299.99</td>
      <td>6499.95</td>
      <td>North</td>
      <td>Eve Martinez</td>
    </tr>
    <tr>
      <th>32</th>
      <td>2025-03-28</td>
      <td>Monitor 27inch</td>
      <td>Electronics</td>
      <td>12</td>
      <td>399.99</td>
      <td>4799.88</td>
      <td>North</td>
      <td>Eve Martinez</td>
    </tr>
    <tr>
      <th>36</th>
      <td>2025-04-08</td>
      <td>Laptop Pro</td>
      <td>Electronics</td>
      <td>6</td>
      <td>1299.99</td>
      <td>7799.94</td>
      <td>North</td>
      <td>Carol Davis</td>
    </tr>
    <tr>
      <th>52</th>
      <td>2025-05-18</td>
      <td>Monitor 27inch</td>
      <td>Electronics</td>
      <td>15</td>
      <td>399.99</td>
      <td>5999.85</td>
      <td>North</td>
      <td>Alice Johnson</td>
    </tr>
    <tr>
      <th>56</th>
      <td>2025-05-28</td>
      <td>Laptop Pro</td>
      <td>Electronics</td>
      <td>3</td>
      <td>1299.99</td>
      <td>3899.97</td>
      <td>North</td>
      <td>Eve Martinez</td>
    </tr>
    <tr>
      <th>68</th>
      <td>2025-06-28</td>
      <td>Headphones Wireless</td>
      <td>Electronics</td>
      <td>20</td>
      <td>199.99</td>
      <td>3999.80</td>
      <td>North</td>
      <td>Eve Martinez</td>
    </tr>
    <tr>
      <th>72</th>
      <td>2025-07-08</td>
      <td>Monitor 27inch</td>
      <td>Electronics</td>
      <td>14</td>
      <td>399.99</td>
      <td>5599.86</td>
      <td>North</td>
      <td>Carol Davis</td>
    </tr>
    <tr>
      <th>76</th>
      <td>2025-07-18</td>
      <td>Laptop Pro</td>
      <td>Electronics</td>
      <td>5</td>
      <td>1299.99</td>
      <td>6499.95</td>
      <td>North</td>
      <td>Alice Johnson</td>
    </tr>
    <tr>
      <th>80</th>
      <td>2025-07-28</td>
      <td>Office Chair</td>
      <td>Furniture</td>
      <td>15</td>
      <td>249.99</td>
      <td>3749.85</td>
      <td>North</td>
      <td>Eve Martinez</td>
    </tr>
    <tr>
      <th>88</th>
      <td>2025-08-18</td>
      <td>Headphones Wireless</td>
      <td>Electronics</td>
      <td>22</td>
      <td>199.99</td>
      <td>4399.78</td>
      <td>North</td>
      <td>Alice Johnson</td>
    </tr>
    <tr>
      <th>92</th>
      <td>2025-08-28</td>
      <td>Monitor 27inch</td>
      <td>Electronics</td>
      <td>18</td>
      <td>399.99</td>
      <td>7199.82</td>
      <td>North</td>
      <td>Eve Martinez</td>
    </tr>
    <tr>
      <th>96</th>
      <td>2025-09-08</td>
      <td>Laptop Pro</td>
      <td>Electronics</td>
      <td>6</td>
      <td>1299.99</td>
      <td>7799.94</td>
      <td>North</td>
      <td>Carol Davis</td>
    </tr>
  </tbody>
</table>
</div>




```python
# Using query() method - more readable for complex filters
q3_sales = df.query("date >= '2025-07-01' and date <= '2025-09-30'")
print(f"📅 Q3 2025 Sales: {len(q3_sales)} transactions")
print(f"Q3 Total Revenue: ${q3_sales['revenue'].sum():,.2f}")
q3_sales.head()
```

    📅 Q3 2025 Sales: 28 transactions
    Q3 Total Revenue: $107,193.76





<div>
<style scoped>
    .dataframe tbody tr th:only-of-type {
        vertical-align: middle;
    }

    .dataframe tbody tr th {
        vertical-align: top;
    }

    .dataframe thead th {
        text-align: right;
    }
</style>
<table border="1" class="dataframe">
  <thead>
    <tr style="text-align: right;">
      <th></th>
      <th>date</th>
      <th>product</th>
      <th>category</th>
      <th>quantity</th>
      <th>unit_price</th>
      <th>revenue</th>
      <th>region</th>
      <th>salesperson</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th>70</th>
      <td>2025-07-02</td>
      <td>Office Chair</td>
      <td>Furniture</td>
      <td>11</td>
      <td>249.99</td>
      <td>2749.89</td>
      <td>East</td>
      <td>Alice Johnson</td>
    </tr>
    <tr>
      <th>71</th>
      <td>2025-07-05</td>
      <td>Standing Desk</td>
      <td>Furniture</td>
      <td>8</td>
      <td>599.99</td>
      <td>4799.92</td>
      <td>West</td>
      <td>Bob Smith</td>
    </tr>
    <tr>
      <th>72</th>
      <td>2025-07-08</td>
      <td>Monitor 27inch</td>
      <td>Electronics</td>
      <td>14</td>
      <td>399.99</td>
      <td>5599.86</td>
      <td>North</td>
      <td>Carol Davis</td>
    </tr>
    <tr>
      <th>73</th>
      <td>2025-07-10</td>
      <td>Keyboard Mechanical</td>
      <td>Electronics</td>
      <td>28</td>
      <td>149.99</td>
      <td>4199.72</td>
      <td>South</td>
      <td>David Wilson</td>
    </tr>
    <tr>
      <th>74</th>
      <td>2025-07-12</td>
      <td>Desk Lamp</td>
      <td>Furniture</td>
      <td>35</td>
      <td>49.99</td>
      <td>1749.65</td>
      <td>East</td>
      <td>Eve Martinez</td>
    </tr>
  </tbody>
</table>
</div>



## 4. Group By Operations

Group data by one or more columns and perform aggregations.


```python
# Group by category and calculate total revenue
category_revenue = df.groupby('category')['revenue'].sum().sort_values(ascending=False)
print("💵 Revenue by Category:")
category_revenue
```

    💵 Revenue by Category:





    category
    Electronics   208677.93
    Furniture      69645.85
    Name: revenue, dtype: float64




```python
# Group by region and calculate multiple metrics
region_stats = df.groupby('region').agg({
    'revenue': ['sum', 'mean', 'count'],
    'quantity': 'sum'
}).round(2)

# Flatten column names
region_stats.columns = ['total_revenue', 'avg_revenue', 'num_transactions', 'total_units']
region_stats = region_stats.sort_values('total_revenue', ascending=False)

print("🌍 Sales Statistics by Region:")
region_stats
```

    🌍 Sales Statistics by Region:





<div>
<style scoped>
    .dataframe tbody tr th:only-of-type {
        vertical-align: middle;
    }

    .dataframe tbody tr th {
        vertical-align: top;
    }

    .dataframe thead th {
        text-align: right;
    }
</style>
<table border="1" class="dataframe">
  <thead>
    <tr style="text-align: right;">
      <th></th>
      <th>total_revenue</th>
      <th>avg_revenue</th>
      <th>num_transactions</th>
      <th>total_units</th>
    </tr>
    <tr>
      <th>region</th>
      <th></th>
      <th></th>
      <th></th>
      <th></th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th>North</th>
      <td>96996.70</td>
      <td>3879.87</td>
      <td>25</td>
      <td>330</td>
    </tr>
    <tr>
      <th>East</th>
      <td>85646.80</td>
      <td>3568.62</td>
      <td>24</td>
      <td>320</td>
    </tr>
    <tr>
      <th>South</th>
      <td>48294.72</td>
      <td>1931.79</td>
      <td>25</td>
      <td>528</td>
    </tr>
    <tr>
      <th>West</th>
      <td>47385.56</td>
      <td>1974.40</td>
      <td>24</td>
      <td>444</td>
    </tr>
  </tbody>
</table>
</div>




```python
# Top salespeople by revenue
salesperson_revenue = df.groupby('salesperson')['revenue'].sum().sort_values(ascending=False)
print("🏆 Top Salespeople by Total Revenue:")
salesperson_revenue
```

    🏆 Top Salespeople by Total Revenue:





    salesperson
    Eve Martinez    62347.93
    Alice Johnson   61397.89
    Carol Davis     58897.68
    David Wilson    34786.65
    Bob Smith       33356.65
    Frank Brown     27536.98
    Name: revenue, dtype: float64



## 5. Pivot Tables

Create pivot tables for multi-dimensional analysis.


```python
# Pivot table: Revenue by Region and Category
pivot_region_category = pd.pivot_table(
    df,
    values='revenue',
    index='region',
    columns='category',
    aggfunc='sum',
    fill_value=0
)

print("📊 Revenue by Region and Category:")
pivot_region_category
```

    📊 Revenue by Region and Category:





<div>
<style scoped>
    .dataframe tbody tr th:only-of-type {
        vertical-align: middle;
    }

    .dataframe tbody tr th {
        vertical-align: top;
    }

    .dataframe thead th {
        text-align: right;
    }
</style>
<table border="1" class="dataframe">
  <thead>
    <tr style="text-align: right;">
      <th>category</th>
      <th>Electronics</th>
      <th>Furniture</th>
    </tr>
    <tr>
      <th>region</th>
      <th></th>
      <th></th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th>East</th>
      <td>63798.81</td>
      <td>21847.99</td>
    </tr>
    <tr>
      <th>North</th>
      <td>81598.30</td>
      <td>15398.40</td>
    </tr>
    <tr>
      <th>South</th>
      <td>35094.94</td>
      <td>13199.78</td>
    </tr>
    <tr>
      <th>West</th>
      <td>28185.88</td>
      <td>19199.68</td>
    </tr>
  </tbody>
</table>
</div>




```python
# Add month column for time-based analysis
df['month'] = df['date'].dt.to_period('M')

# Pivot table: Monthly revenue by product
pivot_monthly = pd.pivot_table(
    df,
    values='revenue',
    index='product',
    columns='month',
    aggfunc='sum',
    fill_value=0
)

print("📅 Monthly Revenue by Product:")
pivot_monthly
```

    📅 Monthly Revenue by Product:





<div>
<style scoped>
    .dataframe tbody tr th:only-of-type {
        vertical-align: middle;
    }

    .dataframe tbody tr th {
        vertical-align: top;
    }

    .dataframe thead th {
        text-align: right;
    }
</style>
<table border="1" class="dataframe">
  <thead>
    <tr style="text-align: right;">
      <th>month</th>
      <th>2025-01</th>
      <th>2025-02</th>
      <th>2025-03</th>
      <th>2025-04</th>
      <th>2025-05</th>
      <th>2025-06</th>
      <th>2025-07</th>
      <th>2025-08</th>
      <th>2025-09</th>
    </tr>
    <tr>
      <th>product</th>
      <th></th>
      <th></th>
      <th></th>
      <th></th>
      <th></th>
      <th></th>
      <th></th>
      <th></th>
      <th></th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th>Desk Lamp</th>
      <td>999.80</td>
      <td>749.85</td>
      <td>1249.75</td>
      <td>2399.52</td>
      <td>1099.78</td>
      <td>1399.72</td>
      <td>1749.65</td>
      <td>1999.60</td>
      <td>1599.68</td>
    </tr>
    <tr>
      <th>Headphones Wireless</th>
      <td>0.00</td>
      <td>1399.93</td>
      <td>1999.90</td>
      <td>2399.88</td>
      <td>2999.85</td>
      <td>5599.72</td>
      <td>3599.82</td>
      <td>4399.78</td>
      <td>0.00</td>
    </tr>
    <tr>
      <th>Keyboard Mechanical</th>
      <td>1799.88</td>
      <td>2699.82</td>
      <td>5249.65</td>
      <td>3299.78</td>
      <td>3749.75</td>
      <td>2399.84</td>
      <td>4199.72</td>
      <td>9749.35</td>
      <td>0.00</td>
    </tr>
    <tr>
      <th>Laptop Pro</th>
      <td>10399.92</td>
      <td>2599.98</td>
      <td>5199.96</td>
      <td>7799.94</td>
      <td>14299.89</td>
      <td>9099.93</td>
      <td>6499.95</td>
      <td>11699.91</td>
      <td>7799.94</td>
    </tr>
    <tr>
      <th>Monitor 27inch</th>
      <td>3199.92</td>
      <td>2399.94</td>
      <td>8799.78</td>
      <td>3599.91</td>
      <td>5999.85</td>
      <td>4399.89</td>
      <td>5599.86</td>
      <td>13599.66</td>
      <td>0.00</td>
    </tr>
    <tr>
      <th>Office Chair</th>
      <td>1249.95</td>
      <td>3499.86</td>
      <td>2499.90</td>
      <td>1749.93</td>
      <td>2999.88</td>
      <td>2249.91</td>
      <td>6499.74</td>
      <td>3249.87</td>
      <td>0.00</td>
    </tr>
    <tr>
      <th>Standing Desk</th>
      <td>1199.98</td>
      <td>4199.93</td>
      <td>2999.95</td>
      <td>3599.94</td>
      <td>2399.96</td>
      <td>4199.93</td>
      <td>8399.86</td>
      <td>5399.91</td>
      <td>0.00</td>
    </tr>
    <tr>
      <th>USB Hub</th>
      <td>0.00</td>
      <td>879.78</td>
      <td>719.82</td>
      <td>999.75</td>
      <td>1199.70</td>
      <td>1399.65</td>
      <td>1399.65</td>
      <td>1119.72</td>
      <td>0.00</td>
    </tr>
    <tr>
      <th>Webcam HD</th>
      <td>799.90</td>
      <td>959.88</td>
      <td>639.92</td>
      <td>1199.85</td>
      <td>2319.71</td>
      <td>1119.86</td>
      <td>1599.80</td>
      <td>1279.84</td>
      <td>1759.78</td>
    </tr>
    <tr>
      <th>Wireless Mouse</th>
      <td>1199.60</td>
      <td>899.70</td>
      <td>599.80</td>
      <td>1049.65</td>
      <td>2039.32</td>
      <td>959.68</td>
      <td>1349.55</td>
      <td>1499.50</td>
      <td>1139.62</td>
    </tr>
  </tbody>
</table>
</div>



## 6. Summary Statistics and Key Insights

Generate a comprehensive summary of the sales data.


```python
# Generate key business insights
print("=" * 60)
print("📊 SALES ANALYSIS SUMMARY")
print("=" * 60)

# Overall metrics
total_revenue = df['revenue'].sum()
avg_transaction = df['revenue'].mean()
total_units = df['quantity'].sum()
num_transactions = len(df)

print(f"\n💰 Total Revenue: ${total_revenue:,.2f}")
print(f"📦 Total Units Sold: {total_units:,}")
print(f"🧾 Number of Transactions: {num_transactions:,}")
print(f"💵 Average Transaction Value: ${avg_transaction:,.2f}")

# Best performing
best_product = df.groupby('product')['revenue'].sum().idxmax()
best_region = df.groupby('region')['revenue'].sum().idxmax()
best_salesperson = df.groupby('salesperson')['revenue'].sum().idxmax()

print(f"\n🏆 Best Selling Product: {best_product}")
print(f"🌍 Top Region: {best_region}")
print(f"⭐ Top Salesperson: {best_salesperson}")

# Time range
print(f"\n📅 Date Range: {df['date'].min().date()} to {df['date'].max().date()}")
print("=" * 60)
```

    ============================================================
    📊 SALES ANALYSIS SUMMARY
    ============================================================
    
    💰 Total Revenue: $278,323.78
    📦 Total Units Sold: 1,622
    🧾 Number of Transactions: 98
    💵 Average Transaction Value: $2,840.04
    
    🏆 Best Selling Product: Laptop Pro
    🌍 Top Region: North
    ⭐ Top Salesperson: Eve Martinez
    
    📅 Date Range: 2025-01-05 to 2025-09-10
    ============================================================


## Next Steps

Now that you've learned the basics of Pandas data analysis, you can:

1. **Visualize your data** - Check out the [Matplotlib Visualization](/notebooks/matplotlib-visualization/) tutorial
2. **Perform statistical analysis** - See the [Python Statistics](/notebooks/python-statistics/) tutorial
3. **Work with APIs** - Learn to fetch data in the [API Requests](/notebooks/api-requests/) tutorial

**Key Takeaways:**
- Use `head()`, `info()`, and `describe()` for initial data exploration
- Filter with boolean indexing or the `query()` method
- Use `groupby()` for aggregations by category
- Create `pivot_table()` for multi-dimensional analysis
