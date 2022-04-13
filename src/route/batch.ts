import * as express from 'express';
import { BatchAggregateController } from '../controller/batch/aggregate.controller';
import { BatchCollectController } from '../controller/batch/collect.controller';

export class BatchRoute {
  public static router() {
    const router = express.Router();
    const batchCollectController: BatchCollectController = new BatchCollectController();
    const batchAggregateController: BatchAggregateController = new BatchAggregateController();

    /* 収集系 */
    router.get('/batch/scrapper/collect/', batchCollectController.getScrapperData);
    router.get('/batch/instagram/totalpost/', batchCollectController.getTotalPost);

    /* 集計系 */
    router.get('/batch/aggregate/hashtag/', batchAggregateController.aggregateHashtag);
    router.get('/batch/aggregate/post/', batchAggregateController.aggregateSummaryPostDaily);

    return router;
  }
}
