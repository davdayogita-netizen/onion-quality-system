export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Defect {
  id?: string;
  type: string;
  confidence: number;
  severity: 'low' | 'medium' | 'high' | 'none';
  bbox: BoundingBox;
}

export interface InspectionDetail {
  id: string;
  created_at: string;
  image_url: string;
  processed_image_url?: string;
  annotated_image_url?: string;
  quality_score?: number;
  grade?: string;
  overall_status: string;
  primary_defect?: string;
  defect_count: number;
  explanation?: string;
  classification_label?: string;
  model_version: string;
  inference_mode: string;
  defects: Defect[];
}

export interface InspectionListItem {
  id: string;
  created_at: string;
  image_url: string;
  annotated_image_url?: string;
  quality_score?: number;
  grade?: string;
  overall_status: string;
  primary_defect?: string;
  defect_count: number;
  inference_mode: string;
}

export interface PaginatedInspections {
  items: InspectionListItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface AnalysisResponse {
  inspection_id: string;
  status: string;
  quality_score: number;
  grade: string;
  overall_status: string;
  primary_defect?: string;
  defect_count: number;
  defects: Defect[];
  explanation: string;
  classification_label?: string;
  model_version: string;
  inference_mode: string;
  original_image_url: string;
  processed_image_url?: string;
  annotated_image_url?: string;
}

export interface TrendPoint {
  date: string;
  inspections: number;
  avg_score: number;
}

export interface DashboardStats {
  total_inspections: number;
  inspections_today: number;
  good_quality_count: number;
  defective_count: number;
  average_quality_score: number;
  grade_distribution: Record<string, number>;
  defect_distribution: Record<string, number>;
  recent_inspections: InspectionListItem[];
  trends: TrendPoint[];
}

export interface SettingsData {
  app_name: string;
  app_version: string;
  inference_mode: string;
  model_version: string;
  yolo_model_path: string;
  classifier_model_path: string;
  yolo_model_exists: boolean;
  classifier_model_exists: boolean;
  grade_a_min: number;
  grade_b_min: number;
  grade_c_min: number;
  grade_d_min: number;
  reject_max: number;
}
