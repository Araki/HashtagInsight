export type TReportTerms = '7' | '30' | '90' | 'all';

export interface IDBReportPost {
  date: string;
  sum: number;
  avg: number;
}

export interface IReportPost {
  summary: {
    total: number;
    average: number;
  };
  data: IReportDataItem[];
}

export interface IDBReportLikeFirst {
  date: string;
  sum: number;
  avg: number;
  count: number;
}

export interface IDBReportLikeAfter {
  date: string;
  sum: number;
  avg: number;
  count: number;
}

export interface IDBReportLikeTotal {
  // sum: number;
  avg: number;
}

export interface IReportLike {
  summary?: {
    total?: number;
    first?: number;
    after?: number;
  };
  dataFirst?: IReportDataItem[];
  dataAfter?: IReportDataItem[];
}

export interface IDBReportCommentFirst {
  date: string;
  sum: number;
  avg: number;
  count: number;
}

export interface IDBReportCommentAfter {
  date: string;
  sum: number;
  avg: number;
  count: number;
}

export interface IDBReportCommentTotal {
  // sum: number;
  avg: number;
}

export interface IReportComment {
  summary?: {
    total?: number;
    first?: number;
    after?: number;
  };
  dataFirst?: IReportDataItem[];
  dataAfter?: IReportDataItem[];
}

export interface IReportDataItem {
  date: string;
  count: number;
}
