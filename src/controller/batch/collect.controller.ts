import { NextFunction, Request, Response } from 'express';
import { catchError, concatMap, delay, from, map, Observable, of, Subscriber } from 'rxjs';
import { DataHashtag } from '../../data/hashtag.data';
import { DataLogPostCount } from '../../data/log-post-count.data';
import { getNowStr } from '../../helper/date';
import { IOutputData } from '../../interface/data-scrapper';
import { ModelScrapper } from '../../model/scrapper.model';

export class BatchCollectController {

  constructor(
    private modelScrapper = new ModelScrapper(),
    private dataHashtag = new DataHashtag(),
    private dataLogPostCount = new DataLogPostCount(),
  ) { }

  public getScrapperData = (
    req: Request,
    res: Response,
    next: NextFunction,
  ): void => {
    this.dataHashtag.findAll().pipe(
      concatMap((results) => {
        const tags = results.map((row) => row.name);
        return from(Array.from(new Set(tags)));
      }),
      concatMap((hashtag) => {
        return this.getScrapperDataByTag(hashtag);
      }),
    ).subscribe({
      complete: () => {
        console.log('Complete!!');
      },
    });
    res.status(200).json();
  }

  public getTotalPost = (
    req: Request,
    res: Response,
    next: NextFunction,
  ): void => {
    const date = getNowStr('YYYY-MM-DD HH') + ':00:00';

    this.dataHashtag.findAll().pipe(
      concatMap((results) => {
        const tags = results.map((row) => row.name);
        return from(Array.from(new Set(tags)));
      }),
      concatMap((hashtag) => {
        return this.getTotalPostByTag(hashtag, date);
      }),
    ).subscribe({
      complete: () => {
        console.log('Complete!!');
      },
    });
    res.status(200).json();
  }

  private getTotalPostByTag(tag: string, date: string) {
    console.log('getTotalPostByTag', tag, date);
    return new Observable<void>((observer: Subscriber<void>) => {
      let totalCount = 0;
      this.requestInstagram(tag).pipe(
        concatMap((response) => {
          totalCount = response.meta.total;
          // 直近のデータを取得
          return this.dataLogPostCount.findLatestByTag(tag);
        }),
        concatMap((logPostCount) => {
          let diffCount = 0;
          if (logPostCount !== null) {
            diffCount = totalCount - logPostCount.totalCount;
          }
          console.log(totalCount, diffCount);
          return this.dataLogPostCount.insert(tag, date, totalCount, diffCount);
        }),
        catchError((err) => {
          console.error('catchError', err);
          return of(void 0);
        }),
      ).subscribe({
        complete: () => {
          observer.complete();
        },
      });
    });
  }

  private getList(data: any[]): IOutputData[] {
    const list = data.filter((row) => row !== null)
      .filter((row) => row.caption && row.caption.text)
      .map((row: any) => {
        const item: IOutputData = {
          instaId: row.id,
          code: row.code,
          takenAt: row.taken_at,
          commentCount: row.comment_count,
          likeCount: row.like_count,
        };
        return item;
      });
    return list;
  }

  private requestScrapper(tag: string, nextMaxId: string | null): Observable<any> {
    const unirest = require('unirest');
    const req = unirest('GET', 'https://instagram-bulk-profile-scrapper.p.rapidapi.com/clients/api/ig/media_by_tag');
    req.query({
      tag,
      feed_type: 'top',
      corsEnabled: true,
      nextMaxId,
    });
    req.headers({
      'x-rapidapi-key': '9c35b728ccmshf52698df0e67bfcp1eaf5cjsn9bcf8383426b',
      'x-rapidapi-host': 'instagram-bulk-profile-scrapper.p.rapidapi.com',
      'useQueryString': true,
    });
    return new Observable<any>((observer: Subscriber<any>) => {
      req.end((response: any) => {
        if (response.error) {
          observer.error(response.error);
        } else {
          observer.next(response.body);
        }
        observer.complete();
      });
    });
  }

  private getScrapperDataByTag(tag: string): Observable<void> {
    console.log('getScrapperDataByTag', tag);
    return new Observable<void>((observer: Subscriber<void>) => {
      this.requestScrapper(tag, null).pipe(
        concatMap((response) => {
          const list: IOutputData[] = this.getList(response.data);
          return this.requestScrapper(tag, response.nextMaxId).pipe(
            map((body2) => {
              return list.concat(this.getList(body2.data));
            }),
          );
        }),
        catchError((err) => {
          console.error('catchError', err);
          return of([]);
        }),
        concatMap((results) => {
          if (results.length === 0) {
            return of(void 0);
          }
          // codeをキーにユニークにする
          const dic: { [key: string]: IOutputData } = {};
          results.forEach((row) => {
            dic[row.code] = row;
          });
          // DBへ保存
          return this.modelScrapper.insert(tag, Object.values(dic));
        }),
        // API上限のために遅延
        delay(5000),
      ).subscribe({
        complete: () => {
          observer.complete();
        }
      });

    });
  }

  private requestInstagram(tag: string): Observable<any> {
    // return of({
    //   meta: {
    //     total: 12345,
    //   }
    // });
    const unirest = require('unirest');
    const req = unirest('GET', `https://instagram85.p.rapidapi.com/tag/${encodeURI(tag)}/feed`);
    req.headers({
      "x-rapidapi-key": "9c35b728ccmshf52698df0e67bfcp1eaf5cjsn9bcf8383426b",
      "x-rapidapi-host": "instagram85.p.rapidapi.com",
      "useQueryString": true
    });

    return new Observable<any>((observer: Subscriber<any>) => {
      req.end((response: any) => {
        if (response.error) {
          observer.error(response.error);
        } else {
          observer.next(response.body);
        }
        observer.complete();
      });
    });
  }

}
