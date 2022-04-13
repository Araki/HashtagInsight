import { NextFunction, Request, Response } from 'express';
import { concatMap, delay, from, map, Observable, of, Subscriber } from 'rxjs';
import { DataScrapper } from '../data/scrapper.data';
import { IDBDataScrapper, IOutputData } from '../interface/data-scrapper';
import { ModelScrapper } from '../model/scrapper.model';

export class DebugController {

  constructor(
    private modelScrapper = new ModelScrapper(),
    private dataScrapper = new DataScrapper(),
  ) { }

  public getScrapperData = (
    req: Request,
    res: Response,
    next: NextFunction,
  ): void => {

    this.getScrapperDataByTag('ヨガ').subscribe();
    res.status(200).json();
  }

  public fixScrapperData = (
    req: Request,
    res: Response,
    next: NextFunction,
  ): void => {
    console.log('fixScrapperData');

    let list: IDBDataScrapper[] = [];
    this.dataScrapper.getDebugs().pipe(
      concatMap((results) => {
        list = results;
        return from(results);
      }),
      concatMap((data, index) => {
        if (index % 2 === 1) {
          if (data.code !== list[index - 1].code) {
            console.log('Oh My Goooooood', index, data.code, list[index - 1].code);
            return of(void 0);
          }

          data.diffLikeCount = data.likeCount - list[index - 1].likeCount;
          data.diffCommentCount = data.commentCount - list[index - 1].commentCount;
          // console.log(index, data.id, data.diffLikeCount, data.diffCommentCount);

          // return this.dataScrapper.updateDiffLikeCount(data.id, data.diffLikeCount, data.diffCommentCount);
        }
        return of(void 0);
      }),
    ).subscribe();
    res.status(200).json();
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
        concatMap((results) => {
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

}
