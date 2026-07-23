import { prisma } from '@/libs/prisma'
import { compare } from 'bcrypt'

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


export const authService = {
  login: async (email: string, password: string, fastify: any): Promise<LoginResponse> => {
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      throw new Error('E-mail or password invalid.')
    }

    const isPasswordValid = await compare(password, user.password)

    if (!isPasswordValid) {
      throw new Error('E-mail or password invalid.')
    }

    const accessToken = fastify.jwt.sign(
      { id: user.id, role: user.role },
      { sign: { sub: user.id, expiresIn: '5m' } }
    )

    const refreshTokenString = fastify.jwt.sign(
      { id: user.id },
      { sign: { sub: user.id, expiresIn: '7d' } }
    )
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

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

  refreshSession: async (currentRefreshToken: string, fastify: any): Promise<RefreshResponse> => {
    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { token: currentRefreshToken },
      include: { user: true }
    })

    if (!tokenRecord) {
      throw new Error('Sessão inválida ou revogada.')
    }

    if (new Date() > tokenRecord.expiresAt) {
      await prisma.refreshToken.delete({ where: { id: tokenRecord.id } })
      throw new Error('Sessão expirada. Faça login novamente.')
    }

    await prisma.refreshToken.delete({ where: { id: tokenRecord.id } }) // trava de segurança.

    const newAccessToken = fastify.jwt.sign(
      { id: tokenRecord.user.id, role: tokenRecord.user.role },
      { sign: { sub: tokenRecord.user.id, expiresIn: '30m' } }
    )

    const newRefreshToken = fastify.jwt.sign(
      { id: tokenRecord.user.id },
      { sign: { sub: tokenRecord.user.id, expiresIn: '7d' } }
    )

    const newExpiresAt = new Date()
    newExpiresAt.setDate(newExpiresAt.getDate() + 7)

    await prisma.refreshToken.create({
      data: {
        token: newRefreshToken,
        user_id: tokenRecord.user.id,
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
