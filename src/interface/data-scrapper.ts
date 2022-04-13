import { IDBHashtag } from './hashtag';

export interface IDBDataScrapper {
  id: string;
  tag: string;
  date: string;
  instaId: string;
  code: string;
  created: string;
  commentCount: number;
  likeCount: number;
  diffLikeCount: number | null;
  diffCommentCount: number | null;
}

export interface IOutputData {
  instaId: string;
  code: string;
  takenAt: number;
  commentCount: number | undefined;
  likeCount: number;
}

export interface IInsertData extends IOutputData {
  diffLikeCount: number | null;
  diffCommentCount: number | null;
}

export type TAggregateLikeCount = Pick<IDBHashtag, 'averageLikes' | 'lowestLikes' | 'averageComments' | 'averageLikesTopFirst' | 'averageLikesTopAfter' | 'averageCommentsTopFirst' | 'averageCommentsTopAfter'>;
