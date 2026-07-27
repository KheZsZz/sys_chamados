import { prisma } from '@/libs/prisma';
import { Prisma } from '@/generated/prisma';
import { conflictError, notFoundError } from '@/libs/errors';
import { CreateSlaPolicyInput, UpdateSlaPolicyInput } from '@/schemas/sla.schema';

export const slaService = {
  create: async (orgId: string, input: CreateSlaPolicyInput) => {
    try {
      return await prisma.slaPolicy.create({
        data: {
          orgId,
          priority: input.priority,
          responseTimeMinutes: input.responseTimeMinutes,
          resolutionTimeMinutes: input.resolutionTimeMinutes,
        },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw conflictError('An SLA policy for this priority already exists.');
      }
      throw err;
    }
  },

  list: async (orgId: string) => {
    return prisma.slaPolicy.findMany({
      where: { orgId },
      orderBy: { priority: 'asc' },
    });
  },

  getById: async (orgId: string, id: string) => {
    const policy = await prisma.slaPolicy.findFirst({ where: { id, orgId } });
    if (!policy) {
      throw notFoundError('SLA policy not found.');
    }
    return policy;
  },

  update: async (orgId: string, id: string, input: UpdateSlaPolicyInput) => {
    await slaService.getById(orgId, id);

    return prisma.slaPolicy.update({
      where: { id },
      data: {
        responseTimeMinutes: input.responseTimeMinutes,
        resolutionTimeMinutes: input.resolutionTimeMinutes,
      },
    });
  },

  remove: async (orgId: string, id: string) => {
    await slaService.getById(orgId, id);

    try {
      await prisma.slaPolicy.delete({ where: { id } });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2003') {
        throw conflictError('This SLA policy is in use by existing tickets and cannot be deleted.');
      }
      throw err;
    }
  },
};
