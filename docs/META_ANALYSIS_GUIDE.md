# Meta-Analysis & Advanced Visualizations Guide

## Overview

The ASR-GoT framework now includes sophisticated meta-analysis capabilities that can collect datasets from scientific literature, harmonize data from multiple sources, and generate advanced biomedical visualizations. This feature is specifically designed for in-depth scientific research queries like chromosomal instabilities in cutaneous T-cell lymphoma (CTCL).

## Key Features

### 🔍 **Comprehensive Dataset Collection**
- **Literature Mining**: Automatically searches peer-reviewed scientific papers for relevant datasets
- **Repository Integration**: Identifies datasets from public repositories (GEO, ArrayExpress, SRA, etc.)
- **Supplementary File Detection**: Extracts data from supplementary materials, figures, and tables
- **Quality Assessment**: Evaluates dataset completeness, reliability, and relevance

### 🧬 **Advanced Data Processing**
- **Data Harmonization**: Standardizes variable names and formats across multiple datasets
- **Multi-source Integration**: Combines datasets from different studies and platforms
- **Quality Filtering**: Removes low-quality or irrelevant datasets automatically
- **Statistical Validation**: Performs quality checks and data integrity validation

### 📊 **Sophisticated Visualizations**
- **Box and Violin Plots**: Age-stratified chromosomal aberration analysis
- **Correlation Heatmaps**: Disease stage vs genomic features
- **Survival Analysis**: Kaplan-Meier curves by aberration load
- **Network Analysis**: Genomic feature correlation networks
- **Principal Component Analysis**: Dimensionality reduction of genomic data
- **Statistical Testing**: Integrated ANOVA, correlation tests, and log-rank tests

## How It Works

### 1. **Dataset Collection Pipeline**

```typescript
// Example query
const query = "chromosomal instabilities in cutaneous T-cell lymphoma staging progression";

// Collection process
1. Literature Search → Identifies papers with datasets
2. Data Extraction → Extracts tables, figures, supplementary files
3. Quality Assessment → Scores relevance, completeness, reliability
4. Data Download → Retrieves raw datasets from repositories
```

### 2. **Data Harmonization Process**

The system automatically maps variables across datasets:

```typescript
// Variable harmonization mapping
{
  'age': ['age', 'age_years', 'patient_age', 'age_at_diagnosis'],
  'stage': ['stage', 'disease_stage', 'clinical_stage', 'tumor_stage'],
  'survival_months': ['survival_months', 'overall_survival', 'os_months'],
  'chromosomal_losses': ['chromosomal_losses', 'chr_losses', 'deletion_count'],
  'chromosomal_gains': ['chromosomal_gains', 'chr_gains', 'amplification_count']
}
```

### 3. **Advanced Visualization Generation**

The system generates multiple visualization types based on available data:

#### **Age-Stratified Analysis**
- Creates age groups (< 30, 30-44, 45-59, 60-74, ≥ 75)
- Generates box plots for chromosomal losses and gains by age group
- Performs ANOVA testing for statistical significance

#### **Disease Progression Heatmaps**
- Correlates disease stage (I-IV) with genomic features
- Visualizes mean aberration counts per stage
- Includes statistical annotations and p-values

#### **Survival Analysis**
- Stratifies patients by aberration burden (high vs low)
- Generates Kaplan-Meier survival curves
- Performs log-rank tests for group comparisons

#### **Correlation Networks**
- Calculates Pearson correlations between genomic features
- Visualizes significant correlations (|r| > 0.3) as network graphs
- Color-codes positive (red) and negative (blue) correlations

## Usage Instructions

### **Step 1: Access Meta-Analysis**
1. Navigate to the "Advanced" tab in ASR-GoT
2. Click on "🧬 Meta-Analysis & Advanced Visualizations"
3. Ensure you have both Gemini and Perplexity API keys configured

### **Step 2: Start Analysis**
1. Enter your research query (e.g., "chromosomal copy number aberrations in CTCL staging")
2. Click "⚡ Start Meta-Analysis"
3. Monitor progress through the collection and analysis phases

### **Step 3: Explore Results**
- **Visualizations Tab**: Interactive advanced plots with statistical tests
- **Datasets Tab**: View collected datasets with quality metrics
- **Summary Tab**: Key findings and study limitations
- **Sources Tab**: Breakdown of tables, figures, and supplementary files

## Supported Analysis Types

### **Genomic Analysis**
- Chromosomal aberration patterns
- Copy number variation analysis
- Mutation burden assessment
- Genomic instability scoring

### **Clinical Analysis**
- Disease staging correlation
- Survival outcome analysis
- Treatment response patterns
- Patient demographic stratification

### **Statistical Methods**
- ANOVA for group comparisons
- Correlation analysis (Pearson, Spearman)
- Log-rank tests for survival analysis
- Principal component analysis (PCA)

## Example Research Queries

### **CTCL Chromosomal Instability**
```
"What is the role of chromosomal instabilities, particularly chromosomal copy number aberrations, in the staging and progression of cutaneous T-cell lymphoma"
```

**Expected Results:**
- Age-stratified box plots of chromosomal losses/gains
- Disease stage correlation heatmaps
- Survival analysis by aberration burden
- Network analysis of genomic features

### **Cancer Biomarker Analysis**
```
"Correlation between specific genetic mutations and disease aggressiveness in lymphoma patients"
```

**Expected Results:**
- Mutation frequency heatmaps
- Survival curves by mutation status
- Correlation networks of genetic alterations
- Statistical significance testing

## Data Quality Metrics

### **Dataset Quality Scoring**
- **Completeness**: Percentage of non-missing data points
- **Reliability**: Based on study design and methodology
- **Relevance**: Match to research query and context

### **Statistical Validation**
- Sample size adequacy assessment
- Effect size calculations
- Confidence interval reporting
- Multiple testing corrections

## Limitations and Considerations

### **Data Heterogeneity**
- Different measurement platforms may introduce batch effects
- Varying follow-up times across studies
- Inconsistent variable definitions between datasets

### **Sample Size Variations**
- Some datasets may have limited sample sizes
- Statistical power may vary across analyses
- Results should be interpreted with appropriate caution

### **Technical Limitations**
- Dependent on publicly available datasets
- Limited by API rate limits for data collection
- May require manual verification for critical findings

## Export Capabilities

### **Visualization Export**
- High-resolution PNG images (1200x800)
- Interactive HTML reports with embedded figures
- Statistical results and p-values included

### **Data Export**
- Combined harmonized datasets (CSV format)
- Individual dataset downloads
- Statistical analysis results

## Future Enhancements

### **Planned Features**
- Direct repository API integration (GEO, ArrayExpress)
- Machine learning-based data quality assessment
- Automated bias detection in meta-analyses
- Real-time collaboration features
- Advanced statistical modeling (mixed-effects, Bayesian)

### **Additional Visualization Types**
- Forest plots for meta-analysis results
- Sankey diagrams for patient flow
- Volcano plots for differential analysis
- Pathway enrichment visualizations

## Technical Implementation

### **Architecture**
- **DatasetCollectionService**: Handles literature search and data extraction
- **AdvancedVisualizationService**: Generates sophisticated scientific plots
- **MetaAnalysisVisualAnalytics**: Main UI component with tabbed interface

### **API Integration**
- **Gemini 2.5 Pro**: Advanced reasoning and data analysis
- **Perplexity Sonar**: Literature search and dataset identification
- **Plotly.js**: Interactive scientific visualizations

### **Data Pipeline**
```
Literature Search → Data Extraction → Quality Assessment → 
Harmonization → Statistical Analysis → Visualization Generation
```

This meta-analysis system transforms the ASR-GoT framework into a comprehensive research intelligence platform capable of synthesizing evidence from multiple sources and generating publication-ready scientific visualizations.