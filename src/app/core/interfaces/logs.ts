// Interfaces
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface LogEntry {
  timestamp: Date;
  level: string;
  context: string;
  message: string;
  pid: number;
}

export interface GetLogsDto {
  page?: number;
  limit?: number;
  level?: 'LOG' | 'ERROR' | 'WARN' | 'DEBUG' | 'VERBOSE';
  context?: string;
  search?: string;
}

export interface LogsResponse {
  data: LogEntry[];
  meta: PaginationMeta;
}

export interface LogStats {
  total: number;
  byLevel: {
    LOG: number;
    ERROR: number;
    WARN: number;
    DEBUG: number;
    VERBOSE: number;
  };
  oldestLog: Date | null;
  newestLog: Date | null;
}

export interface ClearLogsResponse {
  message: string;
}
