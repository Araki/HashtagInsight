import { NextFunction, Request, Response } from 'express';
import { concatMap } from 'rxjs';
import { DataUserHashtag } from '../data/user-hashtag.data';
import { getDate } from '../helper/date';
import { TReportTerms } from '../interface/report';
import { ModelHashtag } from '../model/hashtag.model';

export class ReportController {

  constructor(
    private modelHashtag = new ModelHashtag(),
    private dataUserHashtag = new DataUserHashtag(),
  ) { }

  public getReportForPost = (
    req: Request,
    res: Response,
    next: NextFunction,
  ): void => {
    const uuid = req.headers.uuid as string;
    const name = req.query.name as string;
    // 過去7日, 過去30日, 過去90, all
    const terms = req.query.terms as TReportTerms;

    this.dataUserHashtag.findByName(name).pipe(
      concatMap((hashtag) => {
        return this.modelHashtag.getReportForPost(name, terms, getDate(hashtag!.created));
      }),
    ).subscribe({
      next: (results) => {
        res.status(200).json(results);
      },
      error: (err) => {
        console.error(err);
        res.status(500);
      },
    });
  }

  public getReportForLike = (
    req: Request,
    res: Response,
    next: NextFunction,
  ): void => {
    const uuid = req.headers.uuid as string;
    const name = req.query.name as string;
    // 過去7日, 過去30日, 過去90, all
    const terms = req.query.terms as TReportTerms;

    this.dataUserHashtag.findByName(name).pipe(
      concatMap((hashtag) => {
        return this.modelHashtag.getReportForLike(name, terms, getDate(hashtag!.created));
      }),
    ).subscribe({
      next: (results) => {
        res.status(200).json(results);
      },
      error: (err) => {
        console.error(err);
        res.status(500);
      },
    });
  }

  public getReportForComment = (
    req: Request,
    res: Response,
    next: NextFunction,
  ): void => {
    const uuid = req.headers.uuid as string;
    const name = req.query.name as string;
    // 過去7日, 過去30日, 過去90, all
    const terms = req.query.terms as TReportTerms;

    this.dataUserHashtag.findByName(name).pipe(
      concatMap((hashtag) => {
        return this.modelHashtag.getReportForComment(name, terms, getDate(hashtag!.created));
      }),
    ).subscribe({
      next: (results) => {
        res.status(200).json(results);
      },
      error: (err) => {
        console.error(err);
        res.status(500);
      },
    });
  }
}
