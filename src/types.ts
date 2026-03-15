// src/types.ts
import { ReactNode } from 'react';

export interface AppLogoProps {
  size?: number;
  className?: string;
  id?: string;
  isScanning?: boolean;
}

export interface GenericTableParserProps {
  content?: string;
  rows?: any[];
  title: string;
  icon: React.ElementType;
  colorClass: string;
  idPrefix?: string;
  isLoading?: boolean;
}

export interface AnalysisProgressBarProps {
  progress: number;
  status: string;
}