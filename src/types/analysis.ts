export interface AnalysisResult {
  risk_score: number;
  risk_level: "Safe" | "Suspicious" | "Dangerous";
  attack_type: string;
  attack_type_ar: string;
  clue_1: string;
  clue_2: string;
  clue_3: string;
  explanation: string;
  explanation_ar: string;
  is_threat: boolean;
}
