import { FieldInfo, MysqlError } from 'mysql';
import { Observable, Subscriber } from 'rxjs';

import Mysql from '../config/mysql';
import { snakeToCamel } from '../helper/data';
import { IDBDataScrapper, TAggregateLikeCount } from '../interface/data-scrapper';
import { IDBSearchPost } from '../interface/hashtag';

export class DataScrapper {

  public insert(
    tag: string,
    date: string,
    instaId: string,
    code: string,
    created: string,
    commentCount: number,
    likeCount: number,
    diffLikeCount: number | null,
    diffCommentCount: number | null,
  ): Observable<void> {
    return new Observable<void>((observer: Subscriber<void>) => {
      const pool = Mysql.pool();
      pool.query(
        `INSERT INTO data_scrapper
          (tag, date, insta_id, code, created, comment_count, like_count, diff_like_count, diff_comment_count)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [tag, date, instaId, code, created, commentCount, likeCount, diffLikeCount, diffCommentCount],
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

  public findByTag(tag: string): Observable<IDBDataScrapper[]> {
    return new Observable<IDBDataScrapper[]>((observer: Subscriber<IDBDataScrapper[]>) => {
      const pool = Mysql.pool();
      pool.query(
        `SELECT * FROM data_scrapper WHERE tag = ? ORDER BY id ASC`,
        [tag],
        (err: MysqlError | null, results?: any, _?: FieldInfo[]) => {
          if (err !== null) {
            console.error(err);
            observer.error(err);
            return;
          }

          const list: IDBDataScrapper[] = [];
          results.forEach((row: any) => {
            list.push(snakeToCamel(row) as IDBDataScrapper);
          });
          observer.next(list);
          observer.complete();
        },
      );
    },
    );
  }

  public findByCode(code: string): Observable<IDBDataScrapper[]> {
    return new Observable<IDBDataScrapper[]>((observer: Subscriber<IDBDataScrapper[]>) => {
      const pool = Mysql.pool();
      pool.query(
        `SELECT * FROM data_scrapper WHERE code = ? ORDER BY id ASC`,
        [code],
        (err: MysqlError | null, results?: any, _?: FieldInfo[]) => {
          if (err !== null) {
            console.error(err);
            observer.error(err);
            return;
          }

          const list: IDBDataScrapper[] = [];
          results.forEach((row: any) => {
            list.push(snakeToCamel(row) as IDBDataScrapper);
          });
          observer.next(list);
          observer.complete();
        },
      );
    },
    );
  }

  public findByCodeAndDate(code: string, date: string): Observable<IDBDataScrapper[]> {
    return new Observable<IDBDataScrapper[]>((observer: Subscriber<IDBDataScrapper[]>) => {
      const pool = Mysql.pool();
      pool.query(
        `SELECT * FROM data_scrapper WHERE code = ? AND date LIKE ? ORDER BY id ASC`,
        [code, `${date}%`],
        (err: MysqlError | null, results?: any, _?: FieldInfo[]) => {
          if (err !== null) {
            console.error(err);
            observer.error(err);
            return;
          }

          const list: IDBDataScrapper[] = [];
          results.forEach((row: any) => {
            list.push(snakeToCamel(row) as IDBDataScrapper);
          });
          observer.next(list);
          observer.complete();
        },
      );
    },
    );
  }

  public aggregateLikeCount(tag: string, created: string | null): Observable<TAggregateLikeCount> {
    return new Observable<TAggregateLikeCount>((observer: Subscriber<TAggregateLikeCount>) => {
      const pool = Mysql.pool();

      const values: any[] = [tag];
      let query = `
        SELECT
          AVG(max_like_count) AS average_likes,
          AVG(min_like_count) AS average_likes_top_first,
          AVG(max_like_count - min_like_count) AS average_likes_top_after,
          MIN(min_like_count) AS lowest_likes,
          AVG(max_comment_count) AS average_comments,
          AVG(min_comment_count) AS average_comments_top_first,
          AVG(max_comment_count - min_comment_count) AS average_comments_top_after
        FROM (
          SELECT
            code,
            MAX(like_count) AS max_like_count,
            MIN(like_count) AS min_like_count,
            MAX(comment_count) AS max_comment_count,
            MIN(comment_count) AS min_comment_count 
          FROM data_scrapper
          WHERE tag = ?`;

      if (created !== null) {
        query += ` AND STR_TO_DATE(date, '%y%m%d%H%i') > ?`
        values.push(created);
      }
      query += ` GROUP BY code) t1`;

      pool.query(query,
        values,
        (err: MysqlError | null, results?: any, _?: FieldInfo[]) => {
          if (err !== null) {
            console.error(err);
            observer.error(err);
            return;
          }

          observer.next(snakeToCamel(results[0]) as TAggregateLikeCount);
          observer.complete();
        },
      );
    },
    );
  }

  public findCodeByTag(tag: string): Observable<string[]> {
    return new Observable<string[]>((observer: Subscriber<string[]>) => {
      const pool = Mysql.pool();
      pool.query(`
        SELECT code FROM(
        SELECT code, COUNT(*) AS count, MIN(id), MAX(id) FROM instagram.data_scrapper
          WHERE tag = ? GROUP BY code) t1
        WHERE t1.count > 1`,
        [tag],
        (err: MysqlError | null, results?: any, _?: FieldInfo[]) => {
          if (err !== null) {
            console.error(err);
            observer.error(err);
            return;
          }

          const list: string[] = [];
          results.forEach((row: any) => {
            list.push(row.code);
          });
          observer.next(list);
          observer.complete();
        },
      );
    },
    );
  }

  public updateDiffLikeCount(id: string, diffLikeCount: number, diffCommentCount: number): Observable<void> {
    return new Observable<void>((observer: Subscriber<void>) => {
      const pool = Mysql.pool();
      pool.query(
        `UPDATE data_scrapper SET diff_like_count = ?, diff_comment_count = ? WHERE id = ? `,
        [diffLikeCount, diffCommentCount, id],
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

  public getLatestPost(tag: string): Observable<IDBSearchPost[]> {
    return new Observable<IDBSearchPost[]>((observer: Subscriber<IDBSearchPost[]>) => {
      const pool = Mysql.pool();
      pool.query(
        `SELECT code FROM(
          SELECT * FROM data_scrapper WHERE tag = ? ORDER BY created DESC
        ) temp1
        GROUP BY code LIMIT 50; `,
        [tag],
        (err: MysqlError | null, results?: any, _?: FieldInfo[]) => {
          if (err !== null) {
            observer.error(err);
            return;
          }
          const list: IDBSearchPost[] = [];
          results.forEach((row: any) => {
            list.push(snakeToCamel(row) as IDBSearchPost);
          });
          observer.next(list);
          observer.complete();
        },
      );
    },
    );
  }

  public getLongTermPost(tag: string): Observable<IDBSearchPost[]> {
    return new Observable<IDBSearchPost[]>((observer: Subscriber<IDBSearchPost[]>) => {
      const pool = Mysql.pool();
      pool.query(
        `SELECT code FROM data_scrapper WHERE tag = ? GROUP BY code ORDER BY MAX(date) - MIN(date) DESC LIMIT 50`,
        [tag],
        (err: MysqlError | null, results?: any, _?: FieldInfo[]) => {
          if (err !== null) {
            observer.error(err);
            return;
          }
          const list: IDBSearchPost[] = [];
          results.forEach((row: any) => {
            list.push(snakeToCamel(row) as IDBSearchPost);
          });
          observer.next(list);
          observer.complete();
        },
      );
    },
    );
  }

  public getMaxLike(tag: string): Observable<IDBSearchPost[]> {
    return new Observable<IDBSearchPost[]>((observer: Subscriber<IDBSearchPost[]>) => {
      const pool = Mysql.pool();
      pool.query(
        `SELECT code FROM data_scrapper WHERE tag = ? GROUP BY code ORDER BY MAX(diff_like_count) DESC LIMIT 50`,
        [tag],
        (err: MysqlError | null, results?: any, _?: FieldInfo[]) => {
          if (err !== null) {
            observer.error(err);
            return;
          }
          const list: IDBSearchPost[] = [];
          results.forEach((row: any) => {
            list.push(snakeToCamel(row) as IDBSearchPost);
          });
          observer.next(list);
          observer.complete();
        },
      );
    },
    );
  }

  public getMaxComment(tag: string): Observable<IDBSearchPost[]> {
    return new Observable<IDBSearchPost[]>((observer: Subscriber<IDBSearchPost[]>) => {
      const pool = Mysql.pool();
      pool.query(
        `SELECT code FROM data_scrapper WHERE tag = ? GROUP BY code ORDER BY MAX(diff_comment_count) DESC LIMIT 50`,
        [tag],
        (err: MysqlError | null, results?: any, _?: FieldInfo[]) => {
          if (err !== null) {
            observer.error(err);
            return;
          }
          const list: IDBSearchPost[] = [];
          results.forEach((row: any) => {
            list.push(snakeToCamel(row) as IDBSearchPost);
          });
          observer.next(list);
          observer.complete();
        },
      );
    },
    );
  }

  public getCode(date: string): Observable<string[]> {
    console.log('getCode', date);
    return new Observable<string[]>((observer: Subscriber<string[]>) => {
      const pool = Mysql.pool();
      pool.query(
        `SELECT DISTINCT(code) FROM data_scrapper WHERE date LIKE ? `,
        [`${date}% `],
        (err: MysqlError | null, results?: any, _?: FieldInfo[]) => {
          console.log(err);
          if (err !== null) {
            observer.error(err);
            return;
          }
          const list: string[] = [];
          results.forEach((row: any) => {
            list.push(row.code);
          });
          console.log(list);
          observer.next(list);
          observer.complete();
        },
      );
    },
    );
  }

  // デバック用なので後で消す
  public getDebugs(): Observable<IDBDataScrapper[]> {
    return new Observable<IDBDataScrapper[]>((observer: Subscriber<IDBDataScrapper[]>) => {
      const pool = Mysql.pool();
      pool.query(`
      SELECT * FROM data_scrapper
        WHERE code IN(
        SELECT code FROM(
          SELECT code, MIN(date) AS min, MAX(date) AS max FROM data_scrapper WHERE diff_comment_count IS NULL GROUP BY code) temp
          WHERE min != max)
        AND diff_comment_count IS NULL
        ORDER BY code, date LIMIT 5000`,
        [],
        (err: MysqlError | null, results?: any, _?: FieldInfo[]) => {
          if (err !== null) {
            observer.error(err);
            return;
          }
          const list: IDBDataScrapper[] = [];
          results.forEach((row: any) => {
            list.push(snakeToCamel(row) as IDBDataScrapper);
          });
          observer.next(list);
          observer.complete();
        },
      );
    },
    );
  }

}
