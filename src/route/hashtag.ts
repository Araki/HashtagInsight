import * as express from 'express';
import { HashtagController } from '../controller/hashtag.controller';

export class HashtagRoute {
  public static router() {
    const router = express.Router();
    const hashtagController: HashtagController = new HashtagController();

    router.post('/hashtag/', hashtagController.postHashtag);
    router.get('/hashtag/', hashtagController.getHashtag);
    router.patch('/hashtag/', hashtagController.deleteHashtag);

    return router;
  }
}
