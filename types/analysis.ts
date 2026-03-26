export type HalalStatus = 'halal' | 'haram' | 'mashbooh';

export interface ScanResult {
  status: HalalStatus;
  confidence: number; // 0..1
  summary: string;
  reasons: string[];
  detectedIngredients: string[];
  source: 'gemini';
  scannedAt: string;
}

export interface HistoryItem {
  id: string;
  imageUri: string;
  result: ScanResult;
}