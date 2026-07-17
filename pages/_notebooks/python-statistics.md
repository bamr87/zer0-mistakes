---
title: "Python Statistics"
description: "---"
layout: notebook
collection: notebooks
date: 2026-07-01T03:24:08.000Z
categories: [Notebooks]
tags: [jupyter, python]
comments: true
jupyter_metadata: true
lastmod: 2026-07-01T03:24:08.000Z
permalink: /notebooks/python-statistics/
---
---
title: "Statistical Analysis with Python" description: "Learn statistical analysis using Python's scipy and pandas libraries with real survey data" date: 2025-01-27 lastmod: 2025-01-27 author: "Zer0-Mistakes Team" layout: notebook difficulty: intermediate tags: [python, statistics, scipy, data-analysis, surveys] categories: [Notebooks, Tutorials] toc: true
comments: true
---

# Statistical Analysis with Python

Learn to perform statistical analysis using Python's powerful libraries. This tutorial covers descriptive statistics, hypothesis testing, correlation analysis, and more using real survey response data.

**What you'll learn:**
- Descriptive statistics (mean, median, mode, variance)
- Correlation analysis
- Hypothesis testing (t-tests, chi-square)
- Normal distribution and normality testing
- Confidence intervals

## Setup and Imports


```python
# Import statistical and data libraries
import pandas as pd
import numpy as np
import scipy
from scipy import stats
from scipy.stats import ttest_ind, chi2_contingency, pearsonr, spearmanr
import warnings
warnings.filterwarnings('ignore')

print("✅ Libraries imported successfully!")
print(f"Pandas: {pd.__version__}")
print(f"NumPy: {np.__version__}")
print(f"SciPy: {scipy.__version__}")
```

    ✅ Libraries imported successfully!
    Pandas: 3.0.0
    NumPy: 2.4.2
    SciPy: 1.17.0


## Load Survey Data


```python
# Load the survey response dataset
survey = pd.read_csv('/Users/bamr87/github/zer0-mistakes/assets/data/notebooks/survey_responses.csv')

print("📊 Survey Data Preview:")
print(f"Shape: {survey.shape[0]} respondents × {survey.shape[1]} questions\n")
survey.head(10)
```

    📊 Survey Data Preview:
    Shape: 75 respondents × 13 questions
    





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
      <th>respondent_id</th>
      <th>age</th>
      <th>gender</th>
      <th>education</th>
      <th>employment</th>
      <th>income_bracket</th>
      <th>product_satisfaction</th>
      <th>service_rating</th>
      <th>would_recommend</th>
      <th>purchase_frequency</th>
      <th>category_preference</th>
      <th>feedback_length</th>
      <th>response_date</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th>0</th>
      <td>1</td>
      <td>28</td>
      <td>Female</td>
      <td>Bachelor's</td>
      <td>Full-time</td>
      <td>50000-75000</td>
      <td>4</td>
      <td>5</td>
      <td>Yes</td>
      <td>Monthly</td>
      <td>Electronics</td>
      <td>142</td>
      <td>2025-01-15</td>
    </tr>
    <tr>
      <th>1</th>
      <td>2</td>
      <td>35</td>
      <td>Male</td>
      <td>Master's</td>
      <td>Full-time</td>
      <td>75000-100000</td>
      <td>5</td>
      <td>4</td>
      <td>Yes</td>
      <td>Weekly</td>
      <td>Electronics</td>
      <td>89</td>
      <td>2025-01-16</td>
    </tr>
    <tr>
      <th>2</th>
      <td>3</td>
      <td>42</td>
      <td>Female</td>
      <td>Bachelor's</td>
      <td>Part-time</td>
      <td>25000-50000</td>
      <td>3</td>
      <td>3</td>
      <td>Maybe</td>
      <td>Quarterly</td>
      <td>Furniture</td>
      <td>156</td>
      <td>2025-01-17</td>
    </tr>
    <tr>
      <th>3</th>
      <td>4</td>
      <td>23</td>
      <td>Male</td>
      <td>High School</td>
      <td>Student</td>
      <td>Under 25000</td>
      <td>4</td>
      <td>4</td>
      <td>Yes</td>
      <td>Monthly</td>
      <td>Electronics</td>
      <td>45</td>
      <td>2025-01-18</td>
    </tr>
    <tr>
      <th>4</th>
      <td>5</td>
      <td>51</td>
      <td>Female</td>
      <td>Doctorate</td>
      <td>Full-time</td>
      <td>100000+</td>
      <td>5</td>
      <td>5</td>
      <td>Yes</td>
      <td>Weekly</td>
      <td>Electronics</td>
      <td>203</td>
      <td>2025-01-19</td>
    </tr>
    <tr>
      <th>5</th>
      <td>6</td>
      <td>31</td>
      <td>Non-binary</td>
      <td>Bachelor's</td>
      <td>Full-time</td>
      <td>50000-75000</td>
      <td>4</td>
      <td>4</td>
      <td>Yes</td>
      <td>Monthly</td>
      <td>Furniture</td>
      <td>78</td>
      <td>2025-01-20</td>
    </tr>
    <tr>
      <th>6</th>
      <td>7</td>
      <td>45</td>
      <td>Male</td>
      <td>Master's</td>
      <td>Self-employed</td>
      <td>75000-100000</td>
      <td>3</td>
      <td>2</td>
      <td>No</td>
      <td>Rarely</td>
      <td>Electronics</td>
      <td>312</td>
      <td>2025-01-21</td>
    </tr>
    <tr>
      <th>7</th>
      <td>8</td>
      <td>27</td>
      <td>Female</td>
      <td>Bachelor's</td>
      <td>Full-time</td>
      <td>50000-75000</td>
      <td>5</td>
      <td>5</td>
      <td>Yes</td>
      <td>Monthly</td>
      <td>Electronics</td>
      <td>67</td>
      <td>2025-01-22</td>
    </tr>
    <tr>
      <th>8</th>
      <td>9</td>
      <td>38</td>
      <td>Male</td>
      <td>Bachelor's</td>
      <td>Full-time</td>
      <td>75000-100000</td>
      <td>4</td>
      <td>4</td>
      <td>Yes</td>
      <td>Quarterly</td>
      <td>Furniture</td>
      <td>95</td>
      <td>2025-01-23</td>
    </tr>
    <tr>
      <th>9</th>
      <td>10</td>
      <td>56</td>
      <td>Female</td>
      <td>High School</td>
      <td>Retired</td>
      <td>25000-50000</td>
      <td>4</td>
      <td>5</td>
      <td>Yes</td>
      <td>Monthly</td>
      <td>Furniture</td>
      <td>124</td>
      <td>2025-01-24</td>
    </tr>
  </tbody>
</table>
</div>



## Descriptive Statistics

Let's calculate key descriptive statistics for our numerical columns:


```python
# Calculate comprehensive descriptive statistics
numeric_cols = ['age', 'product_satisfaction', 'service_rating', 'feedback_length']

print("📈 Descriptive Statistics for Survey Responses:")
print("=" * 70)

for col in numeric_cols:
    data = survey[col]
    print(f"\n{col.upper().replace('_', ' ')}:")
    print(f"  Mean:     {data.mean():.2f}")
    print(f"  Median:   {data.median():.2f}")
    print(f"  Mode:     {data.mode().values[0]}")
    print(f"  Std Dev:  {data.std():.2f}")
    print(f"  Variance: {data.var():.2f}")
    print(f"  Range:    {data.min()} - {data.max()}")
    print(f"  IQR:      {data.quantile(0.75) - data.quantile(0.25):.2f}")
```

    📈 Descriptive Statistics for Survey Responses:
    ======================================================================
    
    AGE:
      Mean:     38.28
      Median:   37.00
      Mode:     26
      Std Dev:  11.24
      Variance: 126.31
      Range:    20 - 62
      IQR:      18.00
    
    PRODUCT SATISFACTION:
      Mean:     4.16
      Median:   4.00
      Mode:     4
      Std Dev:  0.74
      Variance: 0.54
      Range:    2 - 5
      IQR:      1.00
    
    SERVICE RATING:
      Mean:     4.07
      Median:   4.00
      Mode:     4
      Std Dev:  0.86
      Variance: 0.74
      Range:    2 - 5
      IQR:      1.00
    
    FEEDBACK LENGTH:
      Mean:     130.56
      Median:   112.00
      Mode:     98
      Std Dev:  71.89
      Variance: 5167.84
      Range:    32 - 312
      IQR:      97.50


## Correlation Analysis

Examine relationships between satisfaction metrics:


```python
# Calculate correlation matrix for satisfaction metrics
satisfaction_cols = ['product_satisfaction', 'service_rating', 'feedback_length', 'age']
correlation_matrix = survey[satisfaction_cols].corr()

print("🔗 Correlation Matrix (Pearson):")
print(correlation_matrix.round(3))

# Detailed pairwise correlations with significance
print("\n\n📊 Detailed Correlation Analysis:")
print("=" * 60)

pairs = [
    ('product_satisfaction', 'service_rating'),
    ('age', 'product_satisfaction'),
    ('age', 'service_rating'),
    ('feedback_length', 'product_satisfaction')
]

for col1, col2 in pairs:
    r, p_value = pearsonr(survey[col1], survey[col2])
    significance = "***" if p_value < 0.001 else "**" if p_value < 0.01 else "*" if p_value < 0.05 else "ns"
    print(f"\n{col1} vs {col2}:")
    print(f"  Pearson r = {r:.4f} ({significance})")
    print(f"  p-value   = {p_value:.4f}")
    if abs(r) >= 0.7:
        strength = "strong"
    elif abs(r) >= 0.4:
        strength = "moderate"
    else:
        strength = "weak"
    direction = "positive" if r > 0 else "negative"
    print(f"  → {strength.capitalize()} {direction} correlation")
```

    🔗 Correlation Matrix (Pearson):
                          product_satisfaction  service_rating  feedback_length  \
    product_satisfaction                 1.000           0.709           -0.309   
    service_rating                       0.709           1.000           -0.233   
    feedback_length                     -0.309          -0.233            1.000   
    age                                 -0.218          -0.005            0.647   
    
                            age  
    product_satisfaction -0.218  
    service_rating       -0.005  
    feedback_length       0.647  
    age                   1.000  
    
    
    📊 Detailed Correlation Analysis:
    ============================================================
    
    product_satisfaction vs service_rating:
      Pearson r = 0.7093 (***)
      p-value   = 0.0000
      → Strong positive correlation
    
    age vs product_satisfaction:
      Pearson r = -0.2179 (ns)
      p-value   = 0.0604
      → Weak negative correlation
    
    age vs service_rating:
      Pearson r = -0.0048 (ns)
      p-value   = 0.9677
      → Weak negative correlation
    
    feedback_length vs product_satisfaction:
      Pearson r = -0.3092 (**)
      p-value   = 0.0069
      → Weak negative correlation


## Hypothesis Testing: T-Tests

Compare satisfaction scores between different groups:


```python
# Independent samples t-test: Compare satisfaction between genders
male_satisfaction = survey[survey['gender'] == 'Male']['product_satisfaction']
female_satisfaction = survey[survey['gender'] == 'Female']['product_satisfaction']

t_stat, p_value = ttest_ind(male_satisfaction, female_satisfaction)

print("🧪 Independent Samples T-Test: Product Satisfaction by Gender")
print("=" * 60)
print(f"\nGroup Statistics:")
print(f"  Male   (n={len(male_satisfaction)}):   M = {male_satisfaction.mean():.2f}, SD = {male_satisfaction.std():.2f}")
print(f"  Female (n={len(female_satisfaction)}): M = {female_satisfaction.mean():.2f}, SD = {female_satisfaction.std():.2f}")
print(f"\nTest Results:")
print(f"  t-statistic = {t_stat:.4f}")
print(f"  p-value     = {p_value:.4f}")
print(f"\nConclusion at α = 0.05:")
if p_value < 0.05:
    print("  ✓ REJECT null hypothesis - significant difference exists")
else:
    print("  ✗ FAIL TO REJECT null hypothesis - no significant difference")
```

    🧪 Independent Samples T-Test: Product Satisfaction by Gender
    ============================================================
    
    Group Statistics:
      Male   (n=35):   M = 4.00, SD = 0.77
      Female (n=36): M = 4.28, SD = 0.70
    
    Test Results:
      t-statistic = -1.5932
      p-value     = 0.1157
    
    Conclusion at α = 0.05:
      ✗ FAIL TO REJECT null hypothesis - no significant difference


## Chi-Square Test

Test for association between categorical variables:


```python
# Chi-square test: Association between purchase frequency and category preference
contingency_table = pd.crosstab(survey['purchase_frequency'], survey['category_preference'])

print("📋 Contingency Table: Purchase Frequency × Category Preference")
print(contingency_table)

chi2, p_value, dof, expected = chi2_contingency(contingency_table)

print("\n\n🧪 Chi-Square Test of Independence")
print("=" * 60)
print(f"\nResults:")
print(f"  Chi-square statistic = {chi2:.4f}")
print(f"  Degrees of freedom   = {dof}")
print(f"  p-value             = {p_value:.4f}")
print(f"\nConclusion at α = 0.05:")
if p_value < 0.05:
    print("  ✓ REJECT null hypothesis - variables are DEPENDENT")
    print("  → Purchase frequency IS associated with category preference")
else:
    print("  ✗ FAIL TO REJECT null hypothesis - variables are INDEPENDENT")
    print("  → No significant association between purchase frequency and category")
```

    📋 Contingency Table: Purchase Frequency × Category Preference
    category_preference  Electronics  Furniture
    purchase_frequency                         
    Monthly                       23         19
    Quarterly                      4          8
    Rarely                         3          4
    Weekly                        14          0
    
    
    🧪 Chi-Square Test of Independence
    ============================================================
    
    Results:
      Chi-square statistic = 14.0252
      Degrees of freedom   = 3
      p-value             = 0.0029
    
    Conclusion at α = 0.05:
      ✓ REJECT null hypothesis - variables are DEPENDENT
      → Purchase frequency IS associated with category preference


## Normality Testing

Check if satisfaction scores follow a normal distribution:


```python
# Test normality of satisfaction scores using multiple methods
data = survey['product_satisfaction']

print("📐 Normality Tests for Product Satisfaction Scores")
print("=" * 60)

# Shapiro-Wilk Test (best for n < 5000)
shapiro_stat, shapiro_p = stats.shapiro(data)
print(f"\n1. Shapiro-Wilk Test:")
print(f"   W-statistic = {shapiro_stat:.4f}")
print(f"   p-value     = {shapiro_p:.4f}")

# D'Agostino's K-squared Test
dagostino_stat, dagostino_p = stats.normaltest(data)
print(f"\n2. D'Agostino-Pearson Test:")
print(f"   K² statistic = {dagostino_stat:.4f}")
print(f"   p-value      = {dagostino_p:.4f}")

# Skewness and Kurtosis
skew = stats.skew(data)
kurt = stats.kurtosis(data)
print(f"\n3. Distribution Shape:")
print(f"   Skewness = {skew:.4f} ({'right-skewed' if skew > 0 else 'left-skewed' if skew < 0 else 'symmetric'})")
print(f"   Kurtosis = {kurt:.4f} ({'leptokurtic' if kurt > 0 else 'platykurtic' if kurt < 0 else 'mesokurtic'})")

print(f"\n📊 Conclusion:")
if shapiro_p > 0.05:
    print("   Data appears to be normally distributed (p > 0.05)")
else:
    print("   Data deviates significantly from normal distribution (p < 0.05)")
```

    📐 Normality Tests for Product Satisfaction Scores
    ============================================================
    
    1. Shapiro-Wilk Test:
       W-statistic = 0.8159
       p-value     = 0.0000
    
    2. D'Agostino-Pearson Test:
       K² statistic = 3.1266
       p-value      = 0.2094
    
    3. Distribution Shape:
       Skewness = -0.4623 (left-skewed)
       Kurtosis = -0.3638 (platykurtic)
    
    📊 Conclusion:
       Data deviates significantly from normal distribution (p < 0.05)


## Confidence Intervals

Calculate confidence intervals for key metrics:


```python
# Calculate 95% confidence intervals for satisfaction metrics
def confidence_interval(data, confidence=0.95):
    """Calculate confidence interval for mean"""
    n = len(data)
    mean = np.mean(data)
    se = stats.sem(data)  # Standard error of the mean
    h = se * stats.t.ppf((1 + confidence) / 2, n - 1)  # Margin of error
    return mean, mean - h, mean + h

print("📏 95% Confidence Intervals")
print("=" * 60)

metrics = {
    'Product Satisfaction': survey['product_satisfaction'],
    'Service Rating': survey['service_rating'],
    'Feedback Length': survey['feedback_length'],
    'Age': survey['age']
}

for name, data in metrics.items():
    mean, lower, upper = confidence_interval(data)
    print(f"\n{name}:")
    print(f"  Sample Mean: {mean:.2f}")
    print(f"  95% CI: [{lower:.2f}, {upper:.2f}]")
    print(f"  → We are 95% confident the true population mean")
    print(f"    falls between {lower:.2f} and {upper:.2f}")
```

    📏 95% Confidence Intervals
    ============================================================
    
    Product Satisfaction:
      Sample Mean: 4.16
      95% CI: [3.99, 4.33]
      → We are 95% confident the true population mean
        falls between 3.99 and 4.33
    
    Service Rating:
      Sample Mean: 4.07
      95% CI: [3.87, 4.26]
      → We are 95% confident the true population mean
        falls between 3.87 and 4.26
    
    Feedback Length:
      Sample Mean: 130.56
      95% CI: [114.02, 147.10]
      → We are 95% confident the true population mean
        falls between 114.02 and 147.10
    
    Age:
      Sample Mean: 38.28
      95% CI: [35.69, 40.87]
      → We are 95% confident the true population mean
        falls between 35.69 and 40.87


## Summary Statistics by Group


```python
# Generate comprehensive summary statistics by demographic groups
print("📊 SURVEY ANALYSIS SUMMARY")
print("=" * 70)

# Overall statistics
print(f"\n📋 Dataset Overview:")
print(f"   Total Respondents: {len(survey)}")
print(f"   Average Age: {survey['age'].mean():.1f} years")
print(f"   Gender Distribution: {dict(survey['gender'].value_counts())}")

# Key findings
print(f"\n🎯 Key Satisfaction Metrics:")
print(f"   Product Satisfaction: {survey['product_satisfaction'].mean():.2f}/5")
print(f"   Service Rating: {survey['service_rating'].mean():.2f}/5")
recommend_yes = (survey['would_recommend'] == 'Yes').sum()
print(f"   Would Recommend: {recommend_yes}/{len(survey)} ({100*recommend_yes/len(survey):.1f}%)")

# Category preferences
print(f"\n💻 Category Preferences:")
category_counts = survey['category_preference'].value_counts()
for category, count in category_counts.items():
    pct = (count / len(survey)) * 100
    print(f"   {category}: {count} ({pct:.1f}%)")

# Purchase patterns
print(f"\n⏱️ Purchase Frequency:")
frequency_counts = survey['purchase_frequency'].value_counts()
for freq, count in frequency_counts.items():
    pct = (count / len(survey)) * 100
    print(f"   {freq}: {count} ({pct:.1f}%)")

print("\n" + "=" * 70)
```

    📊 SURVEY ANALYSIS SUMMARY
    ======================================================================
    
    📋 Dataset Overview:
       Total Respondents: 75
       Average Age: 38.3 years
       Gender Distribution: {'Female': np.int64(36), 'Male': np.int64(35), 'Non-binary': np.int64(4)}
    
    🎯 Key Satisfaction Metrics:
       Product Satisfaction: 4.16/5
       Service Rating: 4.07/5
       Would Recommend: 58/75 (77.3%)
    
    💻 Category Preferences:
       Electronics: 44 (58.7%)
       Furniture: 31 (41.3%)
    
    ⏱️ Purchase Frequency:
       Monthly: 42 (56.0%)
       Weekly: 14 (18.7%)
       Quarterly: 12 (16.0%)
       Rarely: 7 (9.3%)
    
    ======================================================================


## Next Steps

This tutorial covered the fundamentals of statistical analysis with Python. To continue learning:

1. **Visualize your statistics** - Check out the [Matplotlib Visualization](/notebooks/matplotlib-visualization/) tutorial
2. **Analyze larger datasets** - See the [Pandas Data Analysis](/notebooks/pandas-data-analysis/) tutorial
3. **Fetch external data** - Learn about APIs in the [API Requests](/notebooks/api-requests/) tutorial

**Key Takeaways:**
- Use `describe()` for quick descriptive statistics
- `scipy.stats` provides comprehensive hypothesis testing tools
- Always check assumptions (normality, equal variances) before parametric tests
- Correlation ≠ causation - always interpret results carefully
- Report confidence intervals alongside point estimates
