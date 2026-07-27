import { FastifyInstance } from 'fastify';
import { cronAuthMiddleware } from '@/middlewares/cron.middleware';
import { slaCheckerService } from '@/services/checker.service';

export async function cronRoutes(routes: FastifyInstance) {
  routes.addHook('preHandler', cronAuthMiddleware);

  // Meant to be called by an external scheduler every few minutes
  // (e.g. Vercel Cron, Neon scheduled function, GitHub Actions, crontab).
  routes.post('/sla-check', async (_req, res) => {
    const breachedCount = await slaCheckerService.checkBreachedTickets();
    return res.status(200).send({ breachedCount });
  });
}
