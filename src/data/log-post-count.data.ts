import { FieldInfo, MysqlError } from 'mysql';
import { Observable, Subscriber } from 'rxjs';

import Mysql from '../config/mysql';
import { snakeToCamel } from '../helper/data';
import { IDBLogPostCount, TAggregatePostCount } from '../interface/log_post_count';

export class DataLogPostCount {

  public insert(
    tag: string,
    date: string,
    totalCount: number,
    diffCount: number,
  ): Observable<void> {
    return new Observable<void>((observer: Subscriber<void>) => {
      const pool = Mysql.pool();
      pool.query(
        `INSERT INTO log_post_count
          (tag, date, total_count, diff_count)
          VALUES (?, ?, ?, ?)`,
        [tag, date, totalCount, diffCount],
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

  public findLatestByTag(tag: string): Observable<IDBLogPostCount | null> {
    return new Observable<IDBLogPostCount | null>((observer: Subscriber<IDBLogPostCount | null>) => {
      const pool = Mysql.pool();
      pool.query(
        `SELECT * FROM log_post_count WHERE tag = ? ORDER BY date DESC LIMIT 1`,
        [tag],
        (err: MysqlError | null, results?: any, _?: FieldInfo[]) => {
          if (err !== null) {
            console.error(err);
            observer.error(err);
            return;
          }

          if (results.length === 0) {
            observer.next(null);
          } else {
            observer.next(snakeToCamel(results[0]) as IDBLogPostCount);
          }
          observer.complete();
        },
      );
    },
    );
  }

  public aggregatePostCount(tag: string, created: string | null): Observable<TAggregatePostCount> {
    return new Observable<TAggregatePostCount>((observer: Subscriber<TAggregatePostCount>) => {
      const pool = Mysql.pool();

      const vals: any[] = [tag];
      let query = `SELECT MAX(total_count) AS total_posts, AVG(diff_count) AS posts_per_hour FROM log_post_count WHERE tag = ?`;
      if (created !== null) {
        query += ` AND date > ? ;`;
        vals.push(created);
      }

      pool.query(
        query,
        vals,
        (err: MysqlError | null, results?: any, _?: FieldInfo[]) => {
          if (err !== null) {
            console.error(err);
            observer.error(err);
            return;
          }
          observer.next(snakeToCamel(results[0]) as TAggregatePostCount);
          observer.complete();
        },
      );
    },
    );
  }

}
