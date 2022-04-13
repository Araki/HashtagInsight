import { FieldInfo, MysqlError } from 'mysql';
import { Observable, Subscriber } from 'rxjs';
import { ulid } from 'ulid';

import Mysql from '../config/mysql';
import { snakeToCamel } from '../helper/data';
import { IDBHashtag } from '../interface/hashtag';

export class DataHashtag {
  public insert(
    name: string,
  ): Observable<void> {
    return new Observable<void>((observer: Subscriber<void>) => {
      const id = ulid();
      const pool = Mysql.pool();
      pool.query(
        `INSERT INTO hashtag
          (id, name)
          VALUES (?, ?)`,
        [id, name],
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

  public findByName(name: string): Observable<IDBHashtag | null> {
    return new Observable<IDBHashtag | null>((observer: Subscriber<IDBHashtag | null>) => {
      const pool = Mysql.pool();
      pool.query(
        `SELECT * FROM hashtag WHERE name = ?`,
        [name],
        (err: MysqlError | null, results?: any, _?: FieldInfo[]) => {
          if (err !== null) {
            console.error(err);
            observer.error(err);
            return;
          }

          console.log(results.length);
          if (results.length === 0) {
            observer.next(null);
          } else {
            observer.next(snakeToCamel(results[0]) as IDBHashtag);
          }
          observer.complete();
        },
      );
    },
    );
  }

  public update(
    hashtag: IDBHashtag,
  ): Observable<void> {
    return new Observable<void>((observer: Subscriber<void>) => {
      const pool = Mysql.pool();

      const postsPerHour = hashtag.postsPerHour < 0 ? 0 : hashtag.postsPerHour;

      pool.query(`
        UPDATE hashtag
          SET total_posts = ?, posts_per_hour = ?, average_likes = ?, lowest_likes = ?, average_likes_top_first = ?,
          average_likes_top_after = ?, average_comments = ?, average_comments_top_first = ?, average_comments_top_after = ?,
          difficulty_score = ?, viewer_score = ?,
          updated = SYSDATE()
        WHERE id = ?`,
        [hashtag.totalPosts, postsPerHour, hashtag.averageLikes, hashtag.lowestLikes, hashtag.averageLikesTopFirst,
        hashtag.averageLikesTopAfter, hashtag.averageComments, hashtag.averageCommentsTopFirst, hashtag.averageCommentsTopAfter,
        hashtag.difficultyScore, hashtag.viewerScore,
        hashtag.id],
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

  public findAll(): Observable<IDBHashtag[]> {
    return new Observable<IDBHashtag[]>((observer: Subscriber<IDBHashtag[]>) => {
      const pool = Mysql.pool();
      pool.query(
        // `SELECT * FROM hashtag WHERE deleted IS NULL AND EXISTS (SELECT * FROM user_hashtag WHERE deleted IS NULL AND hashtag.name = user_hashtag.name) `,
        `SELECT * FROM hashtag`,
        [],
        (err: MysqlError | null, results?: any, _?: FieldInfo[]) => {
          if (err !== null) {
            console.error(err);
            observer.error(err);
            return;
          }

          const list: IDBHashtag[] = [];
          results.forEach((row: any) => {
            list.push(snakeToCamel(row) as IDBHashtag);
          });
          observer.next(list);
          observer.complete();
        },
      );
    },
    );
  }

}
