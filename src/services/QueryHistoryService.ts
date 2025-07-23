// Disabled stub service
export class QueryHistoryService {
  constructor() {}
}

export const queryHistoryService = new QueryHistoryService();

export interface QuerySession {
  id: string;
  query: string;
  status: string;
  current_stage: number;
  total_stages: number;
  created_at: string;
  updated_at: string;
  completed_at: string;
  research_context: any;
  graph_data: any;
  stage_results: any;
  metadata: any;
  user_id: string;
  tags: string[];
  figures: any[];
  tables: any[];
}

export interface QueryFigure {
  id: string;
  title: string;
  type: string;
  data: any;
}

export interface QueryTable {
  id: string;
  title: string;
  data: any;
}