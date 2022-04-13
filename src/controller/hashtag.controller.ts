import { NextFunction, Request, Response } from 'express';
import { concatMap, of } from 'rxjs';
import { DataHashtag } from '../data/hashtag.data';
import { DataUserHashtag } from '../data/user-hashtag.data';
import { ModelHashtag } from '../model/hashtag.model';

export class HashtagController {

  constructor(
    private dataHashtag = new DataHashtag(),
    private dataUserHashtag = new DataUserHashtag(),
    private modelHashtag = new ModelHashtag(),
  ) { }

  public postHashtag = (
    req: Request,
    res: Response,
    next: NextFunction,
  ): void => {
    const uuid = req.headers.uuid as string;
    const name = req.body.name;

    this.dataUserHashtag.insert(uuid, name).pipe(
      concatMap(() => {
        return this.dataHashtag.findByName(name);
      }),
      concatMap((hashtag) => {
        if (hashtag === null) {
          return this.dataHashtag.insert(name);
        } else {
          return of(void 0);
        }
      }),
      concatMap(() => {
        return this.modelHashtag.getHashtagsByUUID(uuid);
      }),
    ).subscribe({
      next: (results) => {
        res.status(200).json(results);
      },
      error: (error) => {
        console.error(error);
        res.status(500).json();
      },
    },
    );
  }

  public getHashtag = (
    req: Request,
    res: Response,
    next: NextFunction,
  ): void => {
    const uuid = req.headers.uuid as string;

    this.modelHashtag.getHashtagsByUUID(uuid).subscribe({
      next: (results) => {
        res.status(200).json(results);
      },
      error: (err) => {
        console.error(err);
        res.status(500);
      }
    });
  }

  public deleteHashtag = (
    req: Request,
    res: Response,
    next: NextFunction,
  ): void => {
    const uuid = req.headers.uuid as string;
    const tagId = req.body.tagId as string;

    this.dataUserHashtag.delete(tagId, uuid).subscribe({
      next: () => {
        res.status(200).json();
      },
      error: (err) => {
        console.error(err);
        res.status(500);
      }
    });
  }

}
