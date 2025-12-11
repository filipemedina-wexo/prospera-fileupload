import React from 'react';

interface ProgressBarProps {
  progress: number;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress, className = '' }) => {
  return (
    <div className={`w-full bg-slate-200 rounded-full h-2.5 dark:bg-slate-700 ${className}`}>
      <div 
        className="bg-brand-600 h-2.5 rounded-full transition-all duration-300 ease-out" 
        style={{ width: `${Math.max(5, progress)}%` }}
      ></div>
    </div>
  );
};