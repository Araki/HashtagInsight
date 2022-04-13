import { FieldInfo, MysqlError } from 'mysql';
import { Observable, Subscriber } from 'rxjs';

import Mysql from '../config/mysql';
import { snakeToCamel } from '../helper/data';
import { getDate } from '../helper/date';
import { IDBReportCommentAfter, IDBReportCommentFirst, IDBReportCommentTotal, IDBReportLikeAfter, IDBReportLikeFirst, IDBReportLikeTotal, IDBReportPost } from '../interface/report';
import { IDBSummaryPostDaily } from '../interface/summary-post-daily';

export class DataSummaryPostDaily {

  public getPost(tag: string, fromDate: string | null, toDate: string | null): Observable<IDBReportPost[]> {
    return new Observable<IDBReportPost[]>((observer: Subscriber<IDBReportPost[]>) => {
      const pool = Mysql.pool();

      let query = `SELECT CAST(date AS DATE) AS date, SUM(diff_count) AS sum, AVG(diff_count) as avg FROM log_post_count WHERE tag = ?`;
      const values: any[] = [tag];
      if (fromDate && toDate) {
        query += ` AND date BETWEEN ? AND ?`;
        values.push(fromDate);
        values.push(toDate);
      } else if (fromDate) {
        query += ` AND date >= ?`;
        values.push(fromDate);
      }
      query += ` GROUP BY CAST(date AS DATE)`;

      pool.query(query, values,
        (err: MysqlError | null, results?: any, _?: FieldInfo[]) => {
          if (err !== null) {
            console.error(err);
            observer.error(err);
            return;
          }

          const list: IDBReportPost[] = [];
          results.forEach((row: any) => {
            const item = snakeToCamel(row) as IDBReportPost;
            item.date = getDate(item.date);
            list.push(item);
          });
          observer.next(list);
          observer.complete();
        },
      );
    },
    );
  }

  public getLikeFirst(tag: string, fromDate: string | null, toDate: string | null): Observable<IDBReportLikeFirst[]> {
    return new Observable<IDBReportLikeFirst[]>((observer: Subscriber<IDBReportLikeFirst[]>) => {
      const pool = Mysql.pool();

      let query = `SELECT DATE_FORMAT(date, '%Y-%m-%d') AS date, SUM(like_first) AS sum, AVG(like_first) AS avg,  COUNT(*) AS count FROM summary_post_daily WHERE name = ? AND like_first IS NOT NULL`;
      const values: any[] = [tag];
      if (fromDate && toDate) {
        query += ` AND date BETWEEN ? AND ?`;
        values.push(fromDate);
        values.push(toDate);
      } else if (fromDate) {
        query += ` AND date >= ?`;
        values.push(fromDate);
      }
      query += ` GROUP BY date`;

      pool.query(query, values,
        (err: MysqlError | null, results?: any, _?: FieldInfo[]) => {
          if (err !== null) {
            console.error(err);
            observer.error(err);
            return;
          }

          const list: IDBReportLikeFirst[] = [];
          results.forEach((row: any) => {
            list.push(snakeToCamel(row) as IDBReportLikeFirst);
          });
          observer.next(list);
          observer.complete();
        },
      );
    },
    );
  }

  public getLikeAfter(tag: string, fromDate: string | null, toDate: string | null): Observable<IDBReportLikeAfter[]> {
    return new Observable<IDBReportLikeAfter[]>((observer: Subscriber<IDBReportLikeAfter[]>) => {
      const pool = Mysql.pool();

      let query = `SELECT DATE_FORMAT(date, '%Y-%m-%d') AS date, SUM(like_diff) AS sum, AVG(like_diff) AS avg, COUNT(*) AS count FROM summary_post_daily WHERE name = ?`;
      const values: any[] = [tag];
      if (fromDate && toDate) {
        query += ` AND date BETWEEN ? AND ?`;
        values.push(fromDate);
        values.push(toDate);
      } else if (fromDate) {
        query += ` AND date >= ?`;
        values.push(fromDate);
      }
      query += ` GROUP BY date`;

      pool.query(query, values,
        (err: MysqlError | null, results?: any, _?: FieldInfo[]) => {
          if (err !== null) {
            console.error(err);
            observer.error(err);
            return;
          }

          const list: IDBReportLikeAfter[] = [];
          results.forEach((row: any) => {
            list.push(snakeToCamel(row) as IDBReportLikeAfter);
          });
          observer.next(list);
          observer.complete();
        },
      );
    },
    );
  }

  public getLikeTotal(tag: string, fromDate: string | null, toDate: string | null): Observable<IDBReportLikeTotal> {
    return new Observable<IDBReportLikeTotal>((observer: Subscriber<IDBReportLikeTotal>) => {
      const pool = Mysql.pool();

      let query = `SELECT SUM(count) AS sum, AVG(count) AS avg FROM (SELECT code, MAX(like_last) AS count FROM summary_post_daily WHERE name = ?`;
      const values: any[] = [tag];
      if (fromDate && toDate) {
        query += ` AND date BETWEEN ? AND ?`;
        values.push(fromDate);
        values.push(toDate);
      } else if (fromDate) {
        query += ` AND date >= ?`;
        values.push(fromDate);
      }
      query += ` GROUP BY code) temp`;

      pool.query(query, values,
        (err: MysqlError | null, results?: any, _?: FieldInfo[]) => {
          if (err !== null) {
            console.error(err);
            observer.error(err);
            return;
          }
          observer.next(snakeToCamel(results[0]) as IDBReportLikeTotal);
          observer.complete();
        },
      );
    },
    );
  }

  public getCommentFirst(tag: string, fromDate: string | null, toDate: string | null): Observable<IDBReportCommentFirst[]> {
    return new Observable<IDBReportCommentFirst[]>((observer: Subscriber<IDBReportCommentFirst[]>) => {
      const pool = Mysql.pool();

      let query = `SELECT DATE_FORMAT(date, '%Y-%m-%d') AS date, SUM(comment_first) AS sum, AVG(comment_first) AS avg, COUNT(*) AS count FROM summary_post_daily WHERE name = ? AND comment_first IS NOT NULL`;
      const values: any[] = [tag];
      if (fromDate && toDate) {
        query += ` AND date BETWEEN ? AND ?`;
        values.push(fromDate);
        values.push(toDate);
      } else if (fromDate) {
        query += ` AND date >= ?`;
        values.push(fromDate);
      }
      query += ` GROUP BY date`;

      pool.query(query, values,
        (err: MysqlError | null, results?: any, _?: FieldInfo[]) => {
          if (err !== null) {
            console.error(err);
            observer.error(err);
            return;
          }

          const list: IDBReportCommentFirst[] = [];
          results.forEach((row: any) => {
            list.push(snakeToCamel(row) as IDBReportCommentFirst);
          });
          observer.next(list);
          observer.complete();
        },
      );
    },
    );
  }

  public getCommentAfter(tag: string, fromDate: string | null, toDate: string | null): Observable<IDBReportCommentAfter[]> {
    return new Observable<IDBReportCommentAfter[]>((observer: Subscriber<IDBReportCommentAfter[]>) => {
      const pool = Mysql.pool();

      let query = `SELECT DATE_FORMAT(date, '%Y-%m-%d') AS date, SUM(comment_diff) AS sum, AVG(comment_diff) AS avg, COUNT(*) AS count FROM summary_post_daily WHERE name = ?`;
      const values: any[] = [tag];
      if (fromDate && toDate) {
        query += ` AND date BETWEEN ? AND ?`;
        values.push(fromDate);
        values.push(toDate);
      } else if (fromDate) {
        query += ` AND date >= ?`;
        values.push(fromDate);
      }
      query += ` GROUP BY date`;

      pool.query(query, values,
        (err: MysqlError | null, results?: any, _?: FieldInfo[]) => {
          if (err !== null) {
            console.error(err);
            observer.error(err);
            return;
          }

          const list: IDBReportCommentAfter[] = [];
          results.forEach((row: any) => {
            list.push(snakeToCamel(row) as IDBReportCommentAfter);
          });
          observer.next(list);
          observer.complete();
        },
      );
    },
    );
  }

  public getCommentTotal(tag: string, fromDate: string | null, toDate: string | null): Observable<IDBReportCommentTotal> {
    return new Observable<IDBReportCommentTotal>((observer: Subscriber<IDBReportCommentTotal>) => {
      const pool = Mysql.pool();

      let query = `SELECT SUM(count) AS sum, AVG(count) AS avg FROM (SELECT code, MAX(comment_last) AS count FROM summary_post_daily WHERE name = ?`;
      const values: any[] = [tag];
      if (fromDate && toDate) {
        query += ` AND date BETWEEN ? AND ?`;
        values.push(fromDate);
        values.push(toDate);
      } else if (fromDate) {
        query += ` AND date >= ?`;
        values.push(fromDate);
      }
      query += ` GROUP BY code) temp`;

      pool.query(query, values,
        (err: MysqlError | null, results?: any, _?: FieldInfo[]) => {
          if (err !== null) {
            console.error(err);
            observer.error(err);
            return;
          }
          observer.next(snakeToCamel(results[0]) as IDBReportCommentTotal);
          observer.complete();
        },
      );
    },
    );
  }

  public insert(
    name: string,
    code: string,
    date: string,
    isFirst: boolean,
    likeFirst: number | null,
    likeLast: number,
    likeDiff: number,
    commentFirst: number | null,
    commentLast: number,
    commentDiff: number,
  ): Observable<void> {
    return new Observable<void>((observer: Subscriber<void>) => {
      const pool = Mysql.pool();
      pool.query(
        `INSERT INTO summary_post_daily
          (name, code, date, is_first, like_first, like_last, like_diff, comment_first, comment_last, comment_diff)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [name, code, date, isFirst, likeFirst, likeLast, likeDiff, commentFirst, commentLast, commentDiff],
        (err: MysqlError | null, results?: any, _?: FieldInfo[]) => {
          if (err !== null) {
            observer.error(err);
            return;
          }
          observer.next(void 0);
          observer.complete();
        },
      );
    },
    );
  }

  public insertBulk(
    dataList: IDBSummaryPostDaily[],
  ): Observable<void> {
    return new Observable<void>((observer: Subscriber<void>) => {
      const pool = Mysql.pool();

      const query = `
        INSERT INTO summary_post_daily
        (name, code, date, is_first, like_first, like_last, like_diff, comment_first, comment_last, comment_diff)
        VALUES ?`;

      const values = dataList.map((row) => {
        return [
          row.name,
          row.code,
          row.date,
          row.isFirst,
          row.likeFirst,
          row.likeLast,
          row.likeDiff,
          row.commentFirst,
          row.commentLast,
          row.commentDiff,
        ];
      });

      pool.query(query, [values],
        (err: MysqlError | null, results?: any, _?: FieldInfo[]) => {
          if (err !== null) {
            observer.error(err);
            return;
          }
          observer.next(void 0);
          observer.complete();
        },
      );
    },
    );
  }




}
