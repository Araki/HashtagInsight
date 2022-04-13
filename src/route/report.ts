import * as express from 'express';
import { ReportController } from '../controller/report.controller';

export class ReportRoute {
  public static router() {
    const router = express.Router();
    const reportController: ReportController = new ReportController();

    router.get('/report/post/', reportController.getReportForPost);
    router.get('/report/like/', reportController.getReportForLike);
    router.get('/report/comment/', reportController.getReportForComment);

    return router;
  }
}
