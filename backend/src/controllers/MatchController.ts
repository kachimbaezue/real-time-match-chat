import { Request, Response } from 'express';
import { matchEngine } from '../services/MatchEngine';
import { logger } from '../utils/logger';

export class MatchController {
  static getLiveMatches(_req: Request, res: Response) {
    try {
      const matches = matchEngine.getAllMatches();
      res.json({ matches });
    } catch (error) {
      logger.error('Error fetching live matches', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static getMatchById(req: Request, res: Response): void {
    try {
      const match = matchEngine.getMatch(req.params.id as string);
      if (!match) {
        res.status(404).json({ error: 'Match not found' });
        return;
      }
      res.json({ match });
    } catch (error) {
      logger.error('Error fetching match', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static getMatchTimeline(req: Request, res: Response): void {
    const match = matchEngine.getMatch(req.params.id as string);
    if (!match) {
      res.status(404).json({ error: 'Match not found' });
      return;
    }
    res.json({ timeline: match.timeline });
  }

  static getMatchStats(req: Request, res: Response): void {
    const match = matchEngine.getMatch(req.params.id as string);
    if (!match) {
      res.status(404).json({ error: 'Match not found' });
      return;
    }
    res.json({ stats: match.stats });
  }

  static getMatchMomentum(req: Request, res: Response): void {
    const match = matchEngine.getMatch(req.params.id as string);
    if (!match) {
      res.status(404).json({ error: 'Match not found' });
      return;
    }
    res.json({ momentum: match.momentum });
  }

  static getMatchPulse(req: Request, res: Response): void {
    const match = matchEngine.getMatch(req.params.id as string);
    if (!match) {
      res.status(404).json({ error: 'Match not found' });
      return;
    }
    res.json({ pulse: match.pulse });
  }

  static getMatchRecap(req: Request, res: Response): void {
    const match = matchEngine.getMatch(req.params.id as string);
    if (!match) {
      res.status(404).json({ error: 'Match not found' });
      return;
    }
    res.json({ recap: match.recap });
  }

  static getMatchProbability(req: Request, res: Response): void {
    const match = matchEngine.getMatch(req.params.id as string);
    if (!match) {
      res.status(404).json({ error: 'Match not found' });
      return;
    }
    res.json({ winProbability: match.winProbability || { home: 33, draw: 34, away: 33 } });
  }
}
