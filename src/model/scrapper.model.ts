import { concatMap, from, map, Observable, of, Subscriber } from 'rxjs';

import { DataScrapper } from '../data/scrapper.data';
import { getNowStr, getStrByTimestamp } from '../helper/date';
import { IInsertData, IOutputData } from '../interface/data-scrapper';

export class ModelScrapper {
  constructor(private dataScrapper = new DataScrapper()) { }

  public insert(tag: string, list: IOutputData[]): Observable<void> {

    return new Observable<void>((observer: Subscriber<void>) => {
      const date = getNowStr('YYMMDDHHmm');

      from(list).pipe(
        concatMap((data) => {
          return this.dataScrapper.findByCode(data.code).pipe(
            map((results) => {
              let diffLikeCount: number | null = null;
              let diffCommentCount: number | null = null;
              if (results.length > 0) {
                // 一番最初のlikeとの差分
                diffLikeCount = data.likeCount - results[0].likeCount;
                if (data.commentCount) {
                  diffCommentCount = data.commentCount - results[0].commentCount;
                } else {
                  diffCommentCount = 0;
                }
              }
              return Object.assign(data, { diffLikeCount, diffCommentCount }) as IInsertData;
            }),
          );
        }),
        concatMap((data) => {
          return this.dataScrapper.insert(
            tag,
            date,
            data.instaId,
            data.code,
            getStrByTimestamp(data.takenAt),
            data.commentCount ? data.commentCount : 0,
            data.likeCount,
            data.diffLikeCount,
            data.diffCommentCount);
        }),
      ).subscribe({
        complete: () => {
          observer.next();
          observer.complete();
        },
      });

    });
  }

}
