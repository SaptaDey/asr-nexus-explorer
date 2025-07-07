/**
 * Code Execution Service for ASR-GoT
 * Handles Python/R code execution and figure generation
 */

import { toast } from 'sonner';

export interface CodeExecutionResult {
  success: boolean;
  output: string;
  error?: string;
  figures?: string[]; // Base64 encoded images
  execution_time: number;
  language: 'python' | 'r';
}

export interface FigureGenerationRequest {
  data: any;
  chart_type: 'scatter' | 'line' | 'bar' | 'histogram' | 'heatmap' | 'network';
  title: string;
  x_label?: string;
  y_label?: string;
  theme: 'scientific' | 'minimal' | 'publication';
}

export class CodeExecutionService {
  private geminiApiKey: string;

  constructor(geminiApiKey: string) {
    this.geminiApiKey = geminiApiKey;
  }

  async executePythonCode(code: string): Promise<CodeExecutionResult> {
    const startTime = Date.now();
    
    try {
      // Use Gemini's code execution capability
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent', {
        method: 'POST',
        headers: {
          'x-goog-api-key': this.geminiApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { 
                  text: `Execute this Python code and return the results:\n\n${code}\n\nProvide both the output and any generated plots as base64 encoded images.`
                }
              ]
            }
          ],
          tools: [
            {
              codeExecution: {}
            }
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 8192,
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      const executionTime = Date.now() - startTime;

      // Parse the response for code execution results
      const content = data.candidates[0]?.content?.parts[0]?.text || '';
      
      return {
        success: true,
        output: content,
        execution_time: executionTime,
        language: 'python',
        figures: [] // Will be populated by actual execution results
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.error('Python code execution failed:', error);
      
      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : 'Unknown execution error',
        execution_time: executionTime,
        language: 'python'
      };
    }
  }

  async generateScientificFigure(request: FigureGenerationRequest): Promise<CodeExecutionResult> {
    const pythonCode = this.generatePlottingCode(request);
    
    toast.info('Generating scientific figure...');
    const result = await this.executePythonCode(pythonCode);
    
    if (result.success) {
      toast.success('Figure generated successfully');
    } else {
      toast.error('Figure generation failed');
    }
    
    return result;
  }

  private generatePlottingCode(request: FigureGenerationRequest): string {
    const { data, chart_type, title, x_label, y_label, theme } = request;
    
    // Convert data to Python format
    const dataStr = JSON.stringify(data);
    
    let code = `
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns
import json
from io import BytesIO
import base64

# Set scientific theme
${this.getThemeCode(theme)}

# Load data
data = json.loads('${dataStr}')
df = pd.DataFrame(data)

# Create figure
fig, ax = plt.subplots(figsize=(10, 6))

`;

    switch (chart_type) {
      case 'scatter':
        code += `
ax.scatter(df.iloc[:, 0], df.iloc[:, 1], alpha=0.7, s=60)
`;
        break;
      
      case 'line':
        code += `
ax.plot(df.iloc[:, 0], df.iloc[:, 1], linewidth=2, marker='o', markersize=4)
`;
        break;
      
      case 'bar':
        code += `
ax.bar(range(len(df.iloc[:, 0])), df.iloc[:, 1])
ax.set_xticks(range(len(df.iloc[:, 0])))
ax.set_xticklabels(df.iloc[:, 0], rotation=45)
`;
        break;
      
      case 'histogram':
        code += `
ax.hist(df.iloc[:, 0], bins=20, alpha=0.7, edgecolor='black')
`;
        break;
      
      case 'heatmap':
        code += `
sns.heatmap(df.corr(), annot=True, cmap='viridis', ax=ax)
`;
        break;
      
      default:
        code += `
ax.plot(df.iloc[:, 0], df.iloc[:, 1])
`;
    }

    code += `
# Styling
ax.set_title('${title}', fontsize=14, fontweight='bold', pad=20)
${x_label ? `ax.set_xlabel('${x_label}', fontsize=12)` : ''}
${y_label ? `ax.set_ylabel('${y_label}', fontsize=12)` : ''}
ax.grid(True, alpha=0.3)
plt.tight_layout()

# Save as base64
buffer = BytesIO()
plt.savefig(buffer, format='png', dpi=300, bbox_inches='tight')
buffer.seek(0)
image_base64 = base64.b64encode(buffer.read()).decode()
plt.close()

print(f"Figure generated successfully. Base64 length: {len(image_base64)}")
print("FIGURE_DATA:" + image_base64)
`;

    return code;
  }

  private getThemeCode(theme: string): string {
    switch (theme) {
      case 'scientific':
        return `
plt.style.use('seaborn-v0_8-whitegrid')
sns.set_palette("husl")
plt.rcParams['font.family'] = 'serif'
plt.rcParams['font.size'] = 10
plt.rcParams['axes.linewidth'] = 1.2
`;
      
      case 'publication':
        return `
plt.style.use('seaborn-v0_8-white')
plt.rcParams['font.family'] = 'serif'
plt.rcParams['font.size'] = 12
plt.rcParams['axes.linewidth'] = 1.5
plt.rcParams['figure.dpi'] = 300
`;
      
      default: // minimal
        return `
plt.style.use('default')
sns.set_palette("muted")
`;
    }
  }

  // Generate statistical analysis code
  generateStatsCode(data: any[], analysis_type: 'correlation' | 'regression' | 'anova' | 'ttest'): string {
    const dataStr = JSON.stringify(data);
    
    let code = `
import pandas as pd
import numpy as np
from scipy import stats
import json

# Load data
data = json.loads('${dataStr}')
df = pd.DataFrame(data)

`;

    switch (analysis_type) {
      case 'correlation':
        code += `
# Correlation analysis
correlation_matrix = df.corr()
print("Correlation Matrix:")
print(correlation_matrix)

# Statistical significance
for i in range(len(df.columns)):
    for j in range(i+1, len(df.columns)):
        col1, col2 = df.columns[i], df.columns[j]
        corr, p_value = stats.pearsonr(df[col1], df[col2])
        print(f"{col1} vs {col2}: r={corr:.3f}, p={p_value:.3f}")
`;
        break;

      case 'regression':
        code += `
# Linear regression
from sklearn.linear_model import LinearRegression
from sklearn.metrics import r2_score

X = df.iloc[:, :-1]
y = df.iloc[:, -1]

model = LinearRegression()
model.fit(X, y)
y_pred = model.predict(X)

print(f"R-squared: {r2_score(y, y_pred):.3f}")
print(f"Coefficients: {model.coef_}")
print(f"Intercept: {model.intercept_}")
`;
        break;

      case 'anova':
        code += `
# ANOVA analysis
groups = [df[df.columns[0]] == val for val in df[df.columns[0]].unique()]
f_stat, p_value = stats.f_oneway(*[df[df.columns[1]][group] for group in groups])
print(f"F-statistic: {f_stat:.3f}")
print(f"P-value: {p_value:.3f}")
`;
        break;

      case 'ttest':
        code += `
# T-test analysis
group1 = df[df.columns[1]][df[df.columns[0]] == df[df.columns[0]].unique()[0]]
group2 = df[df.columns[1]][df[df.columns[0]] == df[df.columns[0]].unique()[1]]

t_stat, p_value = stats.ttest_ind(group1, group2)
print(f"T-statistic: {t_stat:.3f}")
print(f"P-value: {p_value:.3f}")
print(f"Group 1 mean: {group1.mean():.3f}")
print(f"Group 2 mean: {group2.mean():.3f}")
`;
        break;
    }

    return code;
  }
}