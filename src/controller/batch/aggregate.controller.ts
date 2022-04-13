import { NextFunction, Request, Response } from 'express';
import { catchError, concatMap, from, map, Observable, of, Subscriber } from 'rxjs';
import { DataHashtag } from '../../data/hashtag.data';
import { DataLogPostCount } from '../../data/log-post-count.data';
import { DataScrapper } from '../../data/scrapper.data';
import { DataSummaryPostDaily } from '../../data/summary-post-daily.data';
import { DataUserHashtag } from '../../data/user-hashtag.data';
import { getDate, getDateAfter } from '../../helper/date';
import { IDBHashtag } from '../../interface/hashtag';
import { IDBSummaryPostDaily } from '../../interface/summary-post-daily';

export class BatchAggregateController {

  constructor(
    private dataScrapper = new DataScrapper(),
    private dataSummaryPostDaily = new DataSummaryPostDaily(),
    private dataUserHashtag = new DataUserHashtag(),
    private dataHashtag = new DataHashtag(),
    private dataLogPostCount = new DataLogPostCount(),
  ) { }

  public aggregateSummaryPostDaily = (
    req: Request,
    res: Response,
    next: NextFunction,
  ): void => {
    const targetDate = getDateAfter(-1);
    const dataList: IDBSummaryPostDaily[] = [];
    let codeCount = 0;
    this.dataScrapper.getCode(getDate(targetDate, 'YYMMDD')).pipe(
      concatMap((results) => {
        codeCount = results.length;
        return from(results);
      }),
      concatMap((code, i) => {
        return this.aggregateByCode(targetDate, code, dataList, i === codeCount - 1);
      }),
    ).subscribe({
      complete: () => {
        console.log('Complete!!');
      },
    });
    res.status(200).json();
  }

  public aggregateHashtag = (
    req: Request,
    res: Response,
    next: NextFunction,
  ): void => {

    let hashtags: IDBHashtag[] = [];
    this.updateHashtag().pipe(
      concatMap((reuslts) => {
        hashtags = reuslts;
        return this.dataUserHashtag.findAll();
      }),
      concatMap((results) => {
        return this.aggregateProcess1(results);
      }),
      concatMap((results) => {
        return this.aggregateProcess2(results);
      }),
    ).subscribe({
      complete: () => {
        console.log('Complete aggregateHashtag');
      },
    });
    res.status(200).json();
  }

  private updateHashtag(): Observable<IDBHashtag[]> {
    return this.dataHashtag.findAll().pipe(
      concatMap((tags) => {
        return this.updateHashtagProcess1(tags);
      }),
      concatMap((tags) => {
        return this.updateHashtagProcess2(tags);
      }),
    );
  }

  private updateHashtagProcess1(hashtags: IDBHashtag[]): Observable<IDBHashtag[]> {
    return new Observable<IDBHashtag[]>((observer: Subscriber<IDBHashtag[]>) => {
      const list: IDBHashtag[] = [];
      from(hashtags).pipe(
        concatMap((hashtag) => {
          return this.dataScrapper.aggregateLikeCount(hashtag.name, null).pipe(
            map((result) => {
              return Object.assign(hashtag, result);
            }),
          );
        }),
        // total_posts, posts_per_hour
        concatMap<IDBHashtag, Observable<any>>((hashtagMerged, i) => {
          return this.dataLogPostCount.aggregatePostCount(hashtags[i].name, null).pipe(
            map((result) => {
              return Object.assign(hashtagMerged, result);
            }),
          );
        }),
        catchError((err) => {
          console.error('catchError', err);
          return of(null);
        }),
      ).subscribe({
        next: (hashtag) => {
          console.log('next', hashtag?.name);
          if (hashtag !== null) {
            list.push(hashtag);
          }
        },
        complete: () => {
          console.log('Complete updateHashtagProcess1');
          observer.next(list);
        },
      });
    });
  }

  private updateHashtagProcess2(hashtags: IDBHashtag[]): Observable<IDBHashtag[]> {
    // S, A, B, C, D, E
    const boarder = hashtags.length / 6;

    // いいね数の昇順
    hashtags.sort((a, b) => {
      return a.averageLikesTopAfter - b.averageLikesTopAfter;
    });

    hashtags.forEach((hashtag, index) => {
      let rank = 'F';
      if (index < boarder) {
        rank = 'F';
      } else if (index < boarder * 2) {
        rank = 'E';
      } else if (index < boarder * 3) {
        rank = 'D';
      } else if (index < boarder * 4) {
        rank = 'C';
      } else if (index < boarder * 5) {
        rank = 'B';
      } else if (index >= boarder * 5) {
        rank = 'A';
      }
      hashtag.viewerScore = rank;
    });

    // 1時間投稿数の昇順
    hashtags.sort((a, b) => {
      return a.postsPerHour - b.postsPerHour;
    });
    hashtags.forEach((hashtag, index) => {
      let rank = 'F';
      if (index < boarder) {
        rank = 'F';
      } else if (index < boarder * 2) {
        rank = 'E';
      } else if (index < boarder * 3) {
        rank = 'D';
      } else if (index < boarder * 4) {
        rank = 'C';
      } else if (index < boarder * 5) {
        rank = 'B';
      } else if (index >= boarder * 5) {
        rank = 'A';
      }
      hashtag.difficultyScore = rank;
    });

    return new Observable<IDBHashtag[]>((observer: Subscriber<IDBHashtag[]>) => {
      from(hashtags).pipe(
        concatMap((hashtag, index) => {
          console.log(hashtag.difficultyScore, hashtag.viewerScore);

          return this.dataHashtag.update(hashtag);
        }),
        catchError((err) => {
          console.error('catchError', err);
          return of(void 0);
        }),
      ).subscribe({
        complete: () => {
          console.log('Complete updateHashtagProcess2');
          observer.next(hashtags);
          observer.complete();
        },
      });
    });
  }

  private aggregateProcess1(hashtags: IDBHashtag[]): Observable<IDBHashtag[]> {
    return new Observable<IDBHashtag[]>((observer: Subscriber<IDBHashtag[]>) => {

      const updatedTags: IDBHashtag[] = [];

      from(hashtags).pipe(
        concatMap((hashtag, i) => {
          return this.dataScrapper.aggregateLikeCount(hashtag.name, hashtag.created).pipe(
            map((result) => {
              return Object.assign(hashtag, result);
            }),
          );
        }),
        // total_posts, posts_per_hour
        concatMap<IDBHashtag, Observable<any>>((hashtagMerged, i) => {
          return this.dataLogPostCount.aggregatePostCount(hashtags[i].name, hashtags[i].created).pipe(
            map((result) => {
              return Object.assign(hashtagMerged, result);
            }),
          );
        }),
      ).subscribe({
        next: (result) => {
          updatedTags.push(result);
        },
        complete: () => {
          observer.next(updatedTags);
          observer.complete();
        },
      });
    });
  }

  private aggregateProcess2(hashtags: IDBHashtag[]): Observable<void> {
    return new Observable<void>((observer: Subscriber<void>) => {

      from(hashtags).pipe(
        concatMap((hashtag) => {
          // // 難易度スコア=1日の投稿数の平均の偏差値
          // const difficultyScore = this.getHensa(hashtag.postsPerHour * 24, hashtags.map((row) => row.postsPerHour * 24));
          // // 視聴者スコア=掲載後の獲得いいね数の偏差値
          // const viewerScore = this.getHensa(hashtag.averageLikesTopAfter, hashtags.map((row) => row.averageLikesTopAfter));
          // hashtag.difficultyScore = difficultyScore;
          // hashtag.viewerScore = viewerScore;

          return this.dataUserHashtag.update(hashtag);
        }),
        catchError((err) => {
          console.error('catchError', err);
          return of(void 0);
        }),
      ).subscribe({
        complete: () => {
          observer.next();
          observer.complete();
        },
      });
    });
  }

  private getHensa(data: number, allData: number[]): number {
    const avg = this.average(allData);
    const sd = this.standardDeviation(allData, avg);
    return (data - avg) * 10 / sd + 50;
  }

  private average(data: number[]): number {
    const n = data.length;
    let avg = 0;

    for (let i = 0; i < n; i++) {
      avg += data[i];
    }
    return avg / n; //  (1 / n * avg)
  }

  private standardDeviation(data: number[], avg: number): number {
    const n = data.length;
    let sum = 0;
    for (let i = 0; i < n; i++) {
      sum += Math.pow(data[i] - avg, 2);
    }
    return Math.sqrt(sum / n);
  }

  private aggregateByCode(date: string, code: string, dataList: IDBSummaryPostDaily[], isLastCode: boolean): Observable<void> {
    return new Observable<any>((observer: Subscriber<any>) => {
      this.dataScrapper.findByCodeAndDate(code, getDate(date, 'YYMMDD')).pipe(
        concatMap((results) => {
          const first = results[0];
          const last = results[results.length - 1];

          const isFirst = first.diffLikeCount === null ? true : false;
          let likeFirst: number | null = null;
          let commentFirst: number | null = null;
          if (isFirst) {
            likeFirst = first.likeCount;
            commentFirst = first.commentCount;
          }

          const data: IDBSummaryPostDaily = {
            name: first.tag,
            code,
            date,
            isFirst,
            likeFirst,
            likeLast: last.likeCount,
            likeDiff: last.likeCount - first.likeCount,
            commentFirst,
            commentLast: last.commentCount,
            commentDiff: last.commentCount - first.commentCount,
          };
          return of(data);
        }),
        concatMap((result) => {
          dataList.push(result);
          if (dataList.length === 200 || isLastCode) {
            return this.dataSummaryPostDaily.insertBulk(dataList).pipe(
              map(() => {
                dataList.length = 0;
                return;
              }),
            );
          }
          return of(void 0);
        }),
      ).subscribe({
        next: () => {
          observer.next();
          observer.complete();
        },
      });
    });
  }

}
