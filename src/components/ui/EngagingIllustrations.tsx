/**
 * Engaging Illustrations Component
 * Provides SVG illustrations for key sections to enhance user experience
 */

import React from 'react';

interface IllustrationProps {
  className?: string;
  width?: number;
  height?: number;
}

// Welcome/Hero Illustration - Scientific Research Theme
export const ResearchHeroIllustration: React.FC<IllustrationProps> = ({ 
  className = "", 
  width = 400, 
  height = 300 
}) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 400 300"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Background gradient */}
    <defs>
      <linearGradient id="bg-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f0f9ff" />
        <stop offset="100%" stopColor="#e0e7ff" />
      </linearGradient>
      <linearGradient id="brain-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#3b82f6" />
        <stop offset="100%" stopColor="#1d4ed8" />
      </linearGradient>
      <linearGradient id="graph-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#06b6d4" />
        <stop offset="100%" stopColor="#0891b2" />
      </linearGradient>
    </defs>
    
    <rect width="400" height="300" fill="url(#bg-gradient)" rx="16" />
    
    {/* Central Brain/AI Node */}
    <circle cx="200" cy="150" r="45" fill="url(#brain-gradient)" opacity="0.9" />
    <circle cx="200" cy="150" r="35" fill="none" stroke="#ffffff" strokeWidth="2" opacity="0.7" />
    
    {/* Brain patterns */}
    <path d="M180 135 Q200 125 220 135 Q200 145 180 135" fill="#ffffff" opacity="0.6" />
    <path d="M180 165 Q200 155 220 165 Q200 175 180 165" fill="#ffffff" opacity="0.6" />
    
    {/* Knowledge Nodes */}
    <circle cx="100" cy="80" r="25" fill="url(#graph-gradient)" opacity="0.8" />
    <circle cx="300" cy="80" r="25" fill="url(#graph-gradient)" opacity="0.8" />
    <circle cx="80" cy="220" r="25" fill="url(#graph-gradient)" opacity="0.8" />
    <circle cx="320" cy="220" r="25" fill="url(#graph-gradient)" opacity="0.8" />
    <circle cx="320" cy="150" r="20" fill="url(#graph-gradient)" opacity="0.8" />
    <circle cx="80" cy="150" r="20" fill="url(#graph-gradient)" opacity="0.8" />
    
    {/* Connection lines */}
    <line x1="125" y1="95" x2="175" y2="135" stroke="#3b82f6" strokeWidth="2" opacity="0.6" />
    <line x1="275" y1="95" x2="225" y2="135" stroke="#3b82f6" strokeWidth="2" opacity="0.6" />
    <line x1="105" y1="205" x2="175" y2="165" stroke="#3b82f6" strokeWidth="2" opacity="0.6" />
    <line x1="295" y1="205" x2="225" y2="165" stroke="#3b82f6" strokeWidth="2" opacity="0.6" />
    <line x1="100" y1="150" x2="155" y2="150" stroke="#3b82f6" strokeWidth="2" opacity="0.6" />
    <line x1="245" y1="150" x2="300" y2="150" stroke="#3b82f6" strokeWidth="2" opacity="0.6" />
    
    {/* Floating elements */}
    <circle cx="60" cy="40" r="3" fill="#06b6d4" opacity="0.7">
      <animate attributeName="cy" values="40;30;40" dur="3s" repeatCount="indefinite" />
    </circle>
    <circle cx="340" cy="50" r="4" fill="#3b82f6" opacity="0.7">
      <animate attributeName="cy" values="50;35;50" dur="4s" repeatCount="indefinite" />
    </circle>
    <circle cx="370" cy="280" r="3" fill="#06b6d4" opacity="0.7">
      <animate attributeName="cy" values="280;270;280" dur="3.5s" repeatCount="indefinite" />
    </circle>
    
    {/* Research symbols */}
    <text x="100" y="87" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="bold">📊</text>
    <text x="300" y="87" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="bold">🔬</text>
    <text x="80" y="227" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="bold">📚</text>
    <text x="320" y="227" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="bold">🧬</text>
    <text x="320" y="157" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="bold">⚡</text>
    <text x="80" y="157" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="bold">💡</text>
    
    {/* Central AI symbol */}
    <text x="200" y="157" textAnchor="middle" fill="#ffffff" fontSize="16" fontWeight="bold">🧠</text>
  </svg>
);

// Completion Celebration Illustration
export const CompletionCelebrationIllustration: React.FC<IllustrationProps> = ({ 
  className = "", 
  width = 300, 
  height = 200 
}) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 300 200"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="success-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ecfdf5" />
        <stop offset="100%" stopColor="#d1fae5" />
      </linearGradient>
    </defs>
    
    <rect width="300" height="200" fill="url(#success-gradient)" rx="12" />
    
    {/* Trophy */}
    <path d="M130 60 L170 60 L175 80 L180 100 L120 100 L125 80 Z" fill="#fbbf24" />
    <circle cx="150" cy="110" r="15" fill="#f59e0b" />
    <rect x="145" y="125" width="10" height="20" fill="#92400e" />
    <ellipse cx="150" cy="150" rx="25" ry="5" fill="#92400e" opacity="0.3" />
    
    {/* Sparkles */}
    <text x="100" y="40" fontSize="20">✨</text>
    <text x="200" y="45" fontSize="16">⭐</text>
    <text x="80" y="80" fontSize="14">🎉</text>
    <text x="220" y="75" fontSize="18">🎊</text>
    <text x="110" y="160" fontSize="12">💫</text>
    <text x="190" y="165" fontSize="15">🌟</text>
    
    {/* Success checkmark */}
    <circle cx="250" cy="50" r="20" fill="#10b981" opacity="0.2" />
    <path d="M240 50 L248 58 L260 42" stroke="#10b981" strokeWidth="3" fill="none" strokeLinecap="round" />
    
    {/* Floating elements with animation */}
    <circle cx="50" cy="120" r="2" fill="#f59e0b">
      <animate attributeName="cy" values="120;110;120" dur="2s" repeatCount="indefinite" />
    </circle>
    <circle cx="250" cy="140" r="3" fill="#3b82f6">
      <animate attributeName="cy" values="140;130;140" dur="2.5s" repeatCount="indefinite" />
    </circle>
  </svg>
);

// Analysis in Progress Illustration
export const AnalysisProgressIllustration: React.FC<IllustrationProps> = ({ 
  className = "", 
  width = 250, 
  height = 180 
}) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 250 180"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="progress-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fef3c7" />
        <stop offset="100%" stopColor="#fde68a" />
      </linearGradient>
    </defs>
    
    <rect width="250" height="180" fill="url(#progress-gradient)" rx="12" />
    
    {/* Central processing unit */}
    <rect x="100" y="70" width="50" height="40" fill="#3b82f6" rx="8" opacity="0.8" />
    
    {/* Data streams */}
    <path d="M20 90 Q60 70 100 90" stroke="#06b6d4" strokeWidth="2" fill="none">
      <animate attributeName="stroke-dasharray" values="0,100;50,50;100,0" dur="2s" repeatCount="indefinite" />
    </path>
    <path d="M150 90 Q190 70 230 90" stroke="#06b6d4" strokeWidth="2" fill="none">
      <animate attributeName="stroke-dasharray" values="0,100;50,50;100,0" dur="2s" repeatCount="indefinite" />
    </path>
    <path d="M125 50 Q125 30 125 10" stroke="#8b5cf6" strokeWidth="2" fill="none">
      <animate attributeName="stroke-dasharray" values="0,100;50,50;100,0" dur="1.5s" repeatCount="indefinite" />
    </path>
    <path d="M125 110 Q125 130 125 150" stroke="#8b5cf6" strokeWidth="2" fill="none">
      <animate attributeName="stroke-dasharray" values="0,100;50,50;100,0" dur="1.5s" repeatCount="indefinite" />
    </path>
    
    {/* Processing indicators */}
    <circle cx="30" cy="90" r="8" fill="#06b6d4" opacity="0.7">
      <animate attributeName="opacity" values="0.3;1;0.3" dur="1s" repeatCount="indefinite" />
    </circle>
    <circle cx="220" cy="90" r="8" fill="#06b6d4" opacity="0.7">
      <animate attributeName="opacity" values="0.3;1;0.3" dur="1.2s" repeatCount="indefinite" />
    </circle>
    <circle cx="125" cy="20" r="6" fill="#8b5cf6" opacity="0.7">
      <animate attributeName="opacity" values="0.3;1;0.3" dur="0.8s" repeatCount="indefinite" />
    </circle>
    <circle cx="125" cy="160" r="6" fill="#8b5cf6" opacity="0.7">
      <animate attributeName="opacity" values="0.3;1;0.3" dur="0.8s" repeatCount="indefinite" />
    </circle>
    
    {/* Central AI icon */}
    <text x="125" y="95" textAnchor="middle" fill="#ffffff" fontSize="16">🤖</text>
    
    {/* Progress indicators */}
    <text x="20" y="120" fontSize="12">📊</text>
    <text x="40" y="120" fontSize="12">📈</text>
    <text x="60" y="120" fontSize="12">🧮</text>
    <text x="190" y="120" fontSize="12">📋</text>
    <text x="210" y="120" fontSize="12">📝</text>
  </svg>
);

// Stage Navigation Illustration
export const StageNavigationIllustration: React.FC<IllustrationProps> = ({ 
  className = "", 
  width = 350, 
  height = 100 
}) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 350 100"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="stage-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#3b82f6" />
        <stop offset="50%" stopColor="#06b6d4" />
        <stop offset="100%" stopColor="#10b981" />
      </linearGradient>
    </defs>
    
    {/* Progress line */}
    <line x1="25" y1="50" x2="325" y2="50" stroke="url(#stage-gradient)" strokeWidth="4" />
    
    {/* Stage nodes */}
    {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((stage, index) => {
      const x = 25 + (index * 37.5);
      const completed = index < 4; // Example: first 4 stages completed
      const current = index === 4; // Example: currently on stage 5
      
      return (
        <g key={stage}>
          <circle
            cx={x}
            cy="50"
            r="12"
            fill={completed ? "#10b981" : current ? "#f59e0b" : "#e5e7eb"}
            stroke={current ? "#f97316" : "#ffffff"}
            strokeWidth="2"
          />
          <text
            x={x}
            y="55"
            textAnchor="middle"
            fill={completed || current ? "#ffffff" : "#6b7280"}
            fontSize="10"
            fontWeight="bold"
          >
            {stage + 1}
          </text>
          
          {/* Stage icons */}
          <text x={x} y="75" textAnchor="middle" fontSize="8">
            {['🎯', '🔧', '🔬', '📚', '✂️', '🔍', '📝', '🤔', '📊'][stage]}
          </text>
        </g>
      );
    })}
  </svg>
);

// Empty State Illustration
export const EmptyStateIllustration: React.FC<IllustrationProps> = ({ 
  className = "", 
  width = 200, 
  height = 150 
}) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 200 150"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="empty-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f8fafc" />
        <stop offset="100%" stopColor="#f1f5f9" />
      </linearGradient>
    </defs>
    
    <rect width="200" height="150" fill="url(#empty-gradient)" rx="8" />
    
    {/* Central document icon */}
    <rect x="70" y="40" width="60" height="70" fill="#e2e8f0" rx="4" />
    <rect x="75" y="45" width="50" height="4" fill="#cbd5e1" rx="2" />
    <rect x="75" y="55" width="40" height="3" fill="#cbd5e1" rx="1.5" />
    <rect x="75" y="65" width="35" height="3" fill="#cbd5e1" rx="1.5" />
    <rect x="75" y="75" width="45" height="3" fill="#cbd5e1" rx="1.5" />
    
    {/* Search magnifier */}
    <circle cx="140" cy="60" r="8" fill="none" stroke="#94a3b8" strokeWidth="2" />
    <line x1="146" y1="66" x2="152" y2="72" stroke="#94a3b8" strokeWidth="2" />
    
    {/* Floating question marks */}
    <text x="50" y="30" fontSize="16" fill="#cbd5e1">?</text>
    <text x="160" y="35" fontSize="12" fill="#cbd5e1">?</text>
    <text x="40" y="120" fontSize="14" fill="#cbd5e1">?</text>
  </svg>
);

export default {
  ResearchHeroIllustration,
  CompletionCelebrationIllustration,
  AnalysisProgressIllustration,
  StageNavigationIllustration,
  EmptyStateIllustration
};