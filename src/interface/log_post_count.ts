import { IDBHashtag } from './hashtag';

export interface IDBLogPostCount {
  tag: string;
  date: string;
  totalCount: number;
  diffCount: number;
}

export type TAggregatePostCount = Pick<IDBHashtag, 'totalPosts' | 'postsPerHour'>;
