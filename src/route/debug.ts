import * as express from 'express';
import { DebugController } from '../controller/debug.controller';

export class DebugRoute {
  public static router() {
    const router = express.Router();
    const debugController: DebugController = new DebugController();

    router.get('/debug/scrapper/collect/', debugController.getScrapperData);
    router.get('/debug/scrapper/fix/', debugController.fixScrapperData);


    return router;
  }
}
