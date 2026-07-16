import { Router } from 'express';
import { MatchController } from '../controllers/MatchController';

const router = Router();

router.get('/live', MatchController.getLiveMatches);
router.get('/debug/snapshot', MatchController.debugSnapshot);
router.get('/debug/fixture/:id', MatchController.debugFixture);
router.get('/:id', MatchController.getMatchById);
router.get('/:id/timeline', MatchController.getMatchTimeline);
router.get('/:id/stats', MatchController.getMatchStats);
router.get('/:id/momentum', MatchController.getMatchMomentum);
router.get('/:id/pulse', MatchController.getMatchPulse);
router.get('/:id/recap', MatchController.getMatchRecap);
router.get('/:id/probability', MatchController.getMatchProbability);

export default router;
