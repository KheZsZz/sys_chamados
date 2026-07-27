import { prisma } from '@/libs/prisma';
import { Prisma } from '@/generated/prisma';
import { conflictError, notFoundError } from '@/libs/errors';
import { CreateCategoryInput, UpdateCategoryInput } from '@/schemas/categories.schema';

export const categoriesService = {
  create: async (orgId: string, input: CreateCategoryInput) => {
    try {
      return await prisma.category.create({
        data: { orgId, name: input.name },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw conflictError('A category with this name already exists.');
      }
      throw err;
    }
  },

  list: async (orgId: string) => {
    return prisma.category.findMany({
      where: { orgId },
      orderBy: { name: 'asc' },
    });
  },

  getById: async (orgId: string, id: string) => {
    const category = await prisma.category.findFirst({ where: { id, orgId } });
    if (!category) {
      throw notFoundError('Category not found.');
    }
    return category;
  },

  update: async (orgId: string, id: string, input: UpdateCategoryInput) => {
    await categoriesService.getById(orgId, id);

    try {
      return await prisma.category.update({
        where: { id },
        data: { name: input.name },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw conflictError('A category with this name already exists.');
      }
      throw err;
    }
  },

  remove: async (orgId: string, id: string) => {
    await categoriesService.getById(orgId, id);

    try {
      await prisma.category.delete({ where: { id } });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2003') {
        throw conflictError('This category is in use by existing tickets and cannot be deleted.');
      }
      throw err;
    }
  },
};
