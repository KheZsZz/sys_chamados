import { prisma } from '@/libs/prisma'
import { compare } from 'bcrypt'
import { FastifyInstance } from 'fastify'
import { unauthorizedError } from '@/libs/errors'

interface LoginResponse {
  user: {
    id: string
    name: string
    email: string
    role: string
    department: string
  }
  accessToken: string
  refreshToken: string
}
interface RefreshResponse {
  newAccessToken: string
  newRefreshToken: string
}

const ACCESS_TOKEN_EXPIRES_IN = '30m'
const REFRESH_TOKEN_EXPIRES_IN = '7d'
const REFRESH_TOKEN_EXPIRES_IN_DAYS = 7

export const authService = {
  login: async (email: string, password: string, fastify: FastifyInstance): Promise<LoginResponse> => {
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      throw unauthorizedError('Invalid email or password.')
    }

    const isPasswordValid = await compare(password, user.password)

    if (!isPasswordValid) {
      throw unauthorizedError('Invalid email or password.')
    }

    const accessToken = fastify.jwt.sign(
      { id: user.id, orgId: user.orgId, email: user.email, role: user.role, department: user.department },
      { sign: { sub: user.id, expiresIn: ACCESS_TOKEN_EXPIRES_IN } }
    )

    const refreshTokenString = fastify.jwt.sign(
      { id: user.id },
      { sign: { sub: user.id, expiresIn: REFRESH_TOKEN_EXPIRES_IN } }
    )
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRES_IN_DAYS)

    await prisma.refreshToken.create({
      data: {
        token: refreshTokenString,
        user: {
          connect: {
            id: user.id
          }
        },
        expiresAt
      }
    })

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        department: user.department,
        role: user.role
      },
      accessToken,
      refreshToken: refreshTokenString
    }
  },

  refreshSession: async (currentRefreshToken: string, fastify: FastifyInstance): Promise<RefreshResponse> => {
    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { token: currentRefreshToken },
      include: { user: true }
    })

    if (!tokenRecord) {
      throw unauthorizedError('Invalid or revoked session.')
    }

    if (new Date() > tokenRecord.expiresAt) {
      await prisma.refreshToken.delete({ where: { id: tokenRecord.id } })
      throw unauthorizedError('Session expired. Please log in again.')
    }

    await prisma.refreshToken.delete({ where: { id: tokenRecord.id } }) // security lock: invalidate the token being used before issuing a new one.

    const newAccessToken = fastify.jwt.sign(
      {
        id: tokenRecord.user.id,
        orgId: tokenRecord.user.orgId,
        email: tokenRecord.user.email,
        role: tokenRecord.user.role,
        department: tokenRecord.user.department
      },
      { sign: { sub: tokenRecord.user.id, expiresIn: ACCESS_TOKEN_EXPIRES_IN } }
    )

    const newRefreshToken = fastify.jwt.sign(
      { id: tokenRecord.user.id },
      { sign: { sub: tokenRecord.user.id, expiresIn: REFRESH_TOKEN_EXPIRES_IN } }
    )

    const newExpiresAt = new Date()
    newExpiresAt.setDate(newExpiresAt.getDate() + REFRESH_TOKEN_EXPIRES_IN_DAYS)

    await prisma.refreshToken.create({
      data: {
        token: newRefreshToken,
        user: {
          connect: {
            id: tokenRecord.user.id
          }
        },
        expiresAt: newExpiresAt
      }
    })

    return {
      newAccessToken,
      newRefreshToken
    }
  },

  logout: async (currentRefreshToken: string) => {
    await prisma.refreshToken.deleteMany({
      where: { token: currentRefreshToken }
    })
  }
}
