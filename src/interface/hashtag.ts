export interface IDBHashtag {
  id: string;
  uuid?: string;
  name: string;
  totalPosts: number;
  postsPerHour: number;
  averageLikes: number;
  lowestLikes: number;
  averageLikesTopFirst: number;
  averageLikesTopAfter: number;
  averageComments: number;
  averageCommentsTopFirst: number;
  averageCommentsTopAfter: number;
  difficultyScore: string;
  viewerScore: string;
  created: string;
  deleted?: string;
}

export type THashtag = Omit<IDBHashtag, 'uuid'>;

export interface IDBSearchPost {
  code: string;
}
