import { FieldInfo, MysqlError } from 'mysql';
import { Observable, Subscriber } from 'rxjs';
import { ulid } from 'ulid';

import Mysql from '../config/mysql';
import { snakeToCamel } from '../helper/data';
import { IDBHashtag } from '../interface/hashtag';

export class DataUserHashtag {

  public insert(
    uuid: string,
    name: string,
  ): Observable<void> {
    return new Observable<void>((observer: Subscriber<void>) => {
      const id = ulid();
      const pool = Mysql.pool();
      pool.query(
        `INSERT INTO user_hashtag
          (id, uuid, name)
          VALUES (?, ?, ?)`,
        [id, uuid, name],
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

  public update(
    hashtag: IDBHashtag,
  ): Observable<void> {
    return new Observable<void>((observer: Subscriber<void>) => {
      const pool = Mysql.pool();

      const postsPerHour = hashtag.postsPerHour < 0 ? 0 : hashtag.postsPerHour;

      pool.query(`
        UPDATE user_hashtag
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

  public findByUUID(uuid: string): Observable<IDBHashtag[]> {
    return new Observable<IDBHashtag[]>((observer: Subscriber<IDBHashtag[]>) => {
      const pool = Mysql.pool();
      pool.query(`
        SELECT
          uh.id, uh.name, uh.total_posts, uh.posts_per_hour,
          uh.average_likes, uh.lowest_likes, uh.average_likes_top_first, uh.average_likes_top_after,
          uh.average_comments, uh.average_comments_top_first, uh.average_comments_top_after,
          uh.created,
          h.difficulty_score, h.viewer_score
        FROM user_hashtag uh
        INNER JOIN hashtag h ON uh.name = h.name
        WHERE uuid = ? AND uh.deleted IS NULL ORDER BY uh.id ASC`,
        [uuid],
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

  public findByName(name: string): Observable<IDBHashtag | null> {
    return new Observable<IDBHashtag | null>((observer: Subscriber<IDBHashtag | null>) => {
      const pool = Mysql.pool();
      pool.query(`
        SELECT * FROM user_hashtag WHERE name = ?`,
        [name],
        (err: MysqlError | null, results?: any, _?: FieldInfo[]) => {
          if (err !== null) {
            console.error(err);
            observer.error(err);
            return;
          }

          if (results.length === 0) {
            return observer.next(null);
          }
          return observer.next(snakeToCamel(results[0]) as IDBHashtag);
        },
      );
    },
    );
  }

  public findAll(): Observable<IDBHashtag[]> {
    return new Observable<IDBHashtag[]>((observer: Subscriber<IDBHashtag[]>) => {
      const pool = Mysql.pool();
      pool.query(`
        SELECT * FROM user_hashtag WHERE deleted IS NULL`,
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

  public delete(tagId: string, uuid: string): Observable<void> {
    return new Observable<void>((observer: Subscriber<void>) => {
      const pool = Mysql.pool();
      pool.query(
        `UPDATE user_hashtag SET deleted = SYSDATE() WHERE id = ? AND uuid = ?`,
        [tagId, uuid],
        (err: MysqlError | null, results?: any, _?: FieldInfo[]) => {
          if (err !== null) {
            console.error(err);
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
