import { Observable, of } from 'rxjs';
import { DataScrapper } from '../data/scrapper.data';
import { IDBSearchPost } from '../interface/hashtag';

export class ModelPost {
  constructor(private dataScrapper = new DataScrapper()) { }

  public getTopPost(tag: string, sort: number): Observable<IDBSearchPost[]> {
    // 1: 最新順
    if (sort === 1) {
      return this.dataScrapper.getLatestPost(tag);
      // 2: 長期間掲載順
    } else if (sort === 2) {
      return this.dataScrapper.getLongTermPost(tag);
      // 3: 最多獲得いいね数順
    } else if (sort === 3) {
      return this.dataScrapper.getMaxLike(tag);
      // 4: 最多獲得コメント数順"
    } else if (sort === 4) {
      return this.dataScrapper.getMaxComment(tag);
    } else {
      return of([]);
    }
  }

}
