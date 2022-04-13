import * as express from 'express';
import { PostController } from '../controller/post.controller';

export class PostRoute {
  public static router() {
    const router = express.Router();
    const postController: PostController = new PostController();

    router.get('/post/', postController.getTopPost);

    return router;
  }
}
