import { concatMap, from, map, Observable, of, pipe } from 'rxjs';
import { DataSummaryPostDaily } from '../data/summary-post-daily.data';
import { DataUserHashtag } from '../data/user-hashtag.data';
import { diffDays, getDateAfter, getDateAfterTarget } from '../helper/date';
import { THashtag } from '../interface/hashtag';
import { IDBReportCommentAfter, IDBReportLikeAfter, IDBReportLikeFirst, IDBReportPost, IReportComment, IReportDataItem, IReportLike, IReportPost, TReportTerms } from '../interface/report';

export class ModelHashtag {
  constructor(
    private dataUserHashtag = new DataUserHashtag(),
    private dataSummaryPostDaily = new DataSummaryPostDaily(),
  ) { }

  public getHashtagsByUUID(uuid: string): Observable<THashtag[]> {
    return this.dataUserHashtag.findByUUID(uuid).pipe(
      map((results) => {
        return results.map<THashtag>((row) => {
          delete row.uuid;
          delete row.deleted;
          return row;
        });
      }),
    );
  }

  public getReportForPost(tag: string, terms: TReportTerms, created: string): Observable<IReportPost> {

    let fromDate: string | null = null;
    let toDate: string | null = null;
    if (terms !== 'all') {
      toDate = getDateAfter(-1);
      fromDate = getDateAfter(Number(terms) * -1);
      if (diffDays(fromDate, created) > 0) {
        fromDate = created;
      }
    }
    if (fromDate === null) {
      fromDate = created;
    }
    return this.dataSummaryPostDaily.getPost(tag, fromDate, toDate).pipe(
      map((results) => {
        if (terms === 'all') {
          toDate = results[results.length - 1].date;
        }
        const days = diffDays(fromDate!, toDate!) + 1;
        const dic: { [key: string]: IDBReportPost } = {};
        results.forEach((row) => {
          dic[row.date] = row;
        });

        const reformData: IDBReportPost[] = [];
        for (let i = 0; i < days; i++) {
          const targetDate = getDateAfterTarget(fromDate!, i);
          if (dic[targetDate]) {
            reformData.push(dic[targetDate]);
          } else {
            reformData.push({
              date: targetDate,
              sum: 0,
              avg: 0,
            });
          }
        }

        let sum = 0;
        let avgSum = 0;
        const items: IReportDataItem[] = [];
        reformData.forEach((row) => {
          items.push({
            date: row.date,
            count: row.sum,
          });
          sum += row.sum;
          avgSum += row.avg;
        });
        const reportPost: IReportPost = {
          summary: {
            total: sum,
            // 1時間辺りの投稿数
            // avgSumはデータがある日だけで割るべき？
            average: avgSum / days,
          },
          data: items,
        };
        return reportPost;
      }),
    );
  }

  public getReportForLike(tag: string, terms: TReportTerms, created: string): Observable<IReportLike> {
    let fromDate: string | null = null;
    let toDate: string | null = null;
    if (terms !== 'all') {
      toDate = getDateAfter(-1);
      fromDate = getDateAfter(Number(terms) * -1);
      if (diffDays(fromDate, created) > 0) {
        fromDate = created;
      }
    }
    if (fromDate === null) {
      fromDate = created;
    }

    const reportLike: IReportLike = {};
    return this.getLikeFirst(tag, terms, fromDate, toDate).pipe(
      concatMap((res) => {
        reportLike.summary = {
          first: res.avg,
        };
        reportLike.dataFirst = res.items;
        return this.getLikeAfter(tag, terms, fromDate, toDate);
      }),
      concatMap((res) => {
        reportLike.summary!.after = res.avg;
        reportLike.dataAfter = res.items;
        return this.dataSummaryPostDaily.getLikeTotal(tag, fromDate, toDate);
      }),
      concatMap((res) => {
        reportLike.summary!.total = res.avg;
        return of(reportLike);
      }),
    );
  }

  public getReportForComment(tag: string, terms: TReportTerms, created: string): Observable<IReportComment> {
    let fromDate: string | null = null;
    let toDate: string | null = null;
    if (terms !== 'all') {
      toDate = getDateAfter(-1);
      fromDate = getDateAfter(Number(terms) * -1);
      if (diffDays(fromDate, created) > 0) {
        fromDate = created;
      }
    }
    if (fromDate === null) {
      fromDate = created;
    }

    const reportComment: IReportComment = {};
    return this.getCommentFirst(tag, terms, fromDate, toDate).pipe(
      concatMap((res) => {
        reportComment.summary = {
          first: res.avg,
        };
        reportComment.dataFirst = res.items;
        return this.getCommentAfter(tag, terms, fromDate, toDate);
      }),
      concatMap((res) => {
        reportComment.summary!.after = res.avg;
        reportComment.dataAfter = res.items;
        return this.dataSummaryPostDaily.getCommentTotal(tag, fromDate, toDate);
      }),
      concatMap((res) => {
        reportComment.summary!.total = res.avg;
        return of(reportComment);
      }),
    );
  }

  private getLikeFirst(tag: string, terms: TReportTerms, fromDate: string | null, toDate: string | null) {
    console.log();
    return this.dataSummaryPostDaily.getLikeFirst(tag, fromDate, toDate).pipe(
      map((results) => {
        console.log(results, fromDate, toDate);
        if (terms === 'all') {
          toDate = results[results.length - 1].date;
        }
        let sum = 0;
        let sumAvg = 0;
        let sumCount = 0;
        const days = diffDays(fromDate!, toDate!) + 1;
        const dic: { [key: string]: IDBReportLikeFirst } = {};
        results.forEach((row) => {
          dic[row.date] = row;
          sum += row.sum;
          sumAvg += row.avg * row.count;
          sumCount += row.count;
        });

        const reformData: IDBReportLikeFirst[] = [];
        for (let i = 0; i < days; i++) {
          const targetDate = getDateAfterTarget(fromDate!, i);
          if (dic[targetDate]) {
            reformData.push(dic[targetDate]);
          }
        }


        const items: IReportDataItem[] = [];
        reformData.forEach((row) => {
          items.push({
            date: row.date,
            count: row.avg,
          });
        });
        return { items, avg: sum / results.length };
      }),
    );
  }

  private getLikeAfter(tag: string, terms: TReportTerms, fromDate: string | null, toDate: string | null) {
    return this.dataSummaryPostDaily.getLikeAfter(tag, fromDate, toDate).pipe(
      map((results) => {
        if (terms === 'all') {
          toDate = results[results.length - 1].date;
        }
        const days = diffDays(fromDate!, toDate!) + 1;
        const dic: { [key: string]: IDBReportLikeAfter } = {};

        let sum = 0;
        let sumAvg = 0;
        let sumCount = 0;
        results.forEach((row) => {
          dic[row.date] = row;
          sum += row.sum;
          sumAvg += row.avg * row.count;
          sumCount += row.count;
        });

        const reformData: IDBReportLikeAfter[] = [];
        for (let i = 0; i < days; i++) {
          const targetDate = getDateAfterTarget(fromDate!, i);
          if (dic[targetDate]) {
            reformData.push(dic[targetDate]);
          }
        }

        const items: IReportDataItem[] = [];
        reformData.forEach((row) => {
          items.push({
            date: row.date,
            count: row.sum,
          });
        });
        return { items, avg: sum / results.length };
      }),
    );
  }

  private getCommentFirst(tag: string, terms: TReportTerms, fromDate: string | null, toDate: string | null) {
    return this.dataSummaryPostDaily.getCommentFirst(tag, fromDate, toDate).pipe(
      map((results) => {
        if (terms === 'all') {
          toDate = results[results.length - 1].date;
        }
        let sum = 0;
        let sumAvg = 0;
        let sumCount = 0;
        const days = diffDays(fromDate!, toDate!) + 1;
        const dic: { [key: string]: IDBReportLikeFirst } = {};
        results.forEach((row) => {
          dic[row.date] = row;
          sum += row.sum;
          sumAvg += row.avg * row.count;
          sumCount += row.count;
        });

        const reformData: IDBReportLikeFirst[] = [];
        for (let i = 0; i < days; i++) {
          const targetDate = getDateAfterTarget(fromDate!, i);
          if (dic[targetDate]) {
            reformData.push(dic[targetDate]);
          }
        }

        const items: IReportDataItem[] = [];
        reformData.forEach((row) => {
          items.push({
            date: row.date,
            count: row.avg,
          });
        });
        return { items, avg: sum / results.length };
      }),
    );
  }

  private getCommentAfter(tag: string, terms: TReportTerms, fromDate: string | null, toDate: string | null) {
    return this.dataSummaryPostDaily.getCommentAfter(tag, fromDate, toDate).pipe(
      map((results) => {
        if (terms === 'all') {
          toDate = results[results.length - 1].date;
        }
        let sum = 0;
        let sumAvg = 0;
        let sumCount = 0;
        const days = diffDays(fromDate!, toDate!) + 1;
        const dic: { [key: string]: IDBReportCommentAfter } = {};
        results.forEach((row) => {
          dic[row.date] = row;
          sum += row.sum;
          sumAvg += row.avg * row.count;
          sumCount += row.count;
        });

        const reformData: IDBReportCommentAfter[] = [];
        for (let i = 0; i < days; i++) {
          const targetDate = getDateAfterTarget(fromDate!, i);
          if (dic[targetDate]) {
            reformData.push(dic[targetDate]);
          }
        }

        const items: IReportDataItem[] = [];
        reformData.forEach((row) => {
          items.push({
            date: row.date,
            count: row.sum,
          });
        });
        return { items, avg: sum / results.length };
      }),
    );
  }

}
