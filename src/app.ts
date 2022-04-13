import bodyParser from 'body-parser';
import express from 'express';

import { BatchRoute } from './route/batch';
import { DebugRoute } from './route/debug';
import { HashtagRoute } from './route/hashtag';
import noImpl from './route/noImpl';
import { PostRoute } from './route/post';
import { ReportRoute } from './route/report';

class App {
  public app: express.Application;

  constructor() {
    this.app = express();
    this.app.use(bodyParser.urlencoded({ extended: true }));
    this.app.use(bodyParser.json());

    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH');
      res.header(
        'Access-Control-Allow-Headers',
        'Content-Type, Authorization, access_token',
      );
      // intercept OPTIONS method
      if ('OPTIONS' === req.method) {
        res.send(200);
      } else {
        next();
      }
    });

    this.routes();
  }

  public routes() {
    const router = express.Router();
    router.get('/', (req, res, next) => {
      res.json();
    });
    this.app.use('/health', router);

    this.app.use(BatchRoute.router());
    this.app.use(DebugRoute.router());
    this.app.use(HashtagRoute.router());
    this.app.use(PostRoute.router());
    this.app.use(ReportRoute.router());

    this.app.use('/noImpl', noImpl);
    this.app.use((req: express.Request, res: express.Response) => {
      res.status(404);
      res.json({
        message: 'The specified endpoint cannot be found.',
        requestPath: req.path,
      });
    });
  }

  public start() {
    const server = this.app.listen(3002, () => console.log('listening on port 3002!'));
    // timeout5分
    server.timeout = 1000 * 60 * 5;
  }
}

export default App;
