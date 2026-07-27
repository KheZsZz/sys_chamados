import { hash } from 'bcrypt';
import { prisma } from '@/libs/prisma';
import { Prisma } from '@/generated/prisma';
import { conflictError, notFoundError, badRequestError } from '@/libs/errors';
import { CreateUserInput, UpdateUserInput, ListUsersQuery } from '@/schemas/users.schema';

const SALT_ROUNDS = 10;

const userSafeSelect = {
  id: true,
  orgId: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  department: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

export const usersService = {
  create: async (orgId: string, input: CreateUserInput) => {
    const passwordHash = await hash(input.password, SALT_ROUNDS);

    try {
      const user = await prisma.user.create({
        data: {
          orgId,
          name: input.name,
          email: input.email,
          password: passwordHash,
          phone: input.phone,
          role: input.role,
          department: input.department,
        },
        select: userSafeSelect,
      });
      return user;
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        const target = (err.meta?.target as string[])?.join(', ') ?? 'field';
        throw conflictError(`A user with this ${target} already exists.`);
      }
      throw err;
    }
  },

  list: async (orgId: string, query: ListUsersQuery) => {
    const where: Prisma.UserWhereInput = {
      orgId,
      role: query.role,
      department: query.department,
    };

    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: userSafeSelect,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      items,
      meta: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.ceil(total / query.pageSize),
      },
    };
  },

  getById: async (orgId: string, id: string) => {
    const user = await prisma.user.findFirst({
      where: { id, orgId },
      select: userSafeSelect,
    });

    if (!user) {
      throw notFoundError('User not found.');
    }

    return user;
  },

  update: async (orgId: string, id: string, input: UpdateUserInput) => {
    await usersService.getById(orgId, id);

    try {
      const user = await prisma.user.update({
        where: { id },
        data: {
          name: input.name,
          phone: input.phone,
          role: input.role,
          department: input.department,
        },
        select: userSafeSelect,
      });
      return user;
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw conflictError('This phone number is already in use.');
      }
      throw err;
    }
  },

  changePassword: async (orgId: string, id: string, newPassword: string) => {
    await usersService.getById(orgId, id);
    const passwordHash = await hash(newPassword, SALT_ROUNDS);

    await prisma.user.update({
      where: { id },
      data: { password: passwordHash },
    });
  },

  remove: async (orgId: string, id: string, requestingUserId: string) => {
    if (id === requestingUserId) {
      throw badRequestError('You cannot delete your own account.');
    }

    await usersService.getById(orgId, id);

    try {
      await prisma.user.delete({ where: { id } });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2003') {
        throw conflictError('This user has related records (tickets, comments, etc.) and cannot be deleted.');
      }
      throw err;
    }
  },
};
