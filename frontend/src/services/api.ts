import {
  AnalysisResponse,
  DashboardStats,
  InspectionDetail,
  PaginatedInspections,
  SettingsData
} from '../types';

const API_BASE = '/api';

export async function getDashboardStats(): Promise<DashboardStats> {
  const res = await fetch(`${API_BASE}/dashboard/stats`);
  if (!res.ok) throw new Error(`Failed to load dashboard stats (${res.status})`);
  return res.json();
}

export async function getInspections(params?: {
  page?: number;
  page_size?: number;
  grade?: string;
  defect?: string;
  search?: string;
  start_date?: string;
  end_date?: string;
}): Promise<PaginatedInspections> {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', params.page.toString());
  if (params?.page_size) query.set('page_size', params.page_size.toString());
  if (params?.grade) query.set('grade', params.grade);
  if (params?.defect) query.set('defect', params.defect);
  if (params?.search) query.set('search', params.search);
  if (params?.start_date) query.set('start_date', params.start_date);
  if (params?.end_date) query.set('end_date', params.end_date);

  const res = await fetch(`${API_BASE}/inspections?${query.toString()}`);
  if (!res.ok) throw new Error(`Failed to load inspections (${res.status})`);
  return res.json();
}

export async function getInspection(id: string): Promise<InspectionDetail> {
  const res = await fetch(`${API_BASE}/inspections/${id}`);
  if (!res.ok) throw new Error(`Failed to load inspection ${id} (${res.status})`);
  return res.json();
}

export async function uploadImage(file: File): Promise<{ id: string; status: string; image_url: string }> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/inspections`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Upload failed with status ${res.status}`);
  }
  return res.json();
}

export async function createSampleInspection(sampleType: string): Promise<{ id: string; status: string; image_url: string }> {
  const res = await fetch(`${API_BASE}/inspections/sample/${sampleType}`, {
    method: 'POST',
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Sample creation failed (${res.status})`);
  }
  return res.json();
}

export async function analyzeInspection(id: string): Promise<AnalysisResponse> {
  const res = await fetch(`${API_BASE}/inspections/${id}/analyze`, {
    method: 'POST',
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Analysis failed (${res.status})`);
  }
  return res.json();
}

export async function deleteInspection(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/inspections/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error(`Failed to delete inspection (${res.status})`);
}

export function getReportDownloadUrl(id: string): string {
  return `${API_BASE}/inspections/${id}/report`;
}

export async function getSettings(): Promise<SettingsData> {
  const res = await fetch(`${API_BASE}/settings`);
  if (!res.ok) throw new Error(`Failed to fetch settings (${res.status})`);
  return res.json();
}

export async function updateSettings(data: Partial<SettingsData>): Promise<SettingsData> {
  const res = await fetch(`${API_BASE}/settings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Failed to update settings (${res.status})`);
  return res.json();
}
