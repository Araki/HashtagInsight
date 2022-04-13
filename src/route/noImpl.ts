// noImpl.ts
import * as express from 'express';

export default function noImpl(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) {
  res.status(501).json({
    message: 'Not Implemented.',
  });
}
