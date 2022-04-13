export interface IDBSummaryPostDaily {
  name: string;
  code: string;
  date: string;
  isFirst: boolean;
  likeFirst: number | null;
  likeLast: number;
  likeDiff: number;
  commentFirst: number | null;
  commentLast: number;
  commentDiff: number;
}
