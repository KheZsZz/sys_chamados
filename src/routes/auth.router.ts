import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from "@fastify/type-provider-zod";
import { authService } from '@/services/auth.service';
import { loginBodySchema } from '@/schemas/auth.schema';
import { unauthorizedError } from '@/libs/errors';

export async function authRoutes(routes: FastifyInstance) {
  const app = routes.withTypeProvider<ZodTypeProvider>();

  app.post('/login', {
      schema: {
        body: loginBodySchema
      }
    }, async (req, res) => {
    const { email, password } = req.body
    const { user, accessToken, refreshToken } = await authService.login(email, password, routes)

    res.setCookie('refreshToken', refreshToken, {
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })

    return res.status(200).send({ user, accessToken })
  });

  app.post('/refresh', async (req, res) => {
    const refreshToken = req.cookies.refreshToken

    if (!refreshToken) {
      throw unauthorizedError('Refresh token missing. Please log in again.')
    }

    const { newAccessToken, newRefreshToken } = await authService.refreshSession(refreshToken, routes)

    res.setCookie('refreshToken', newRefreshToken, {
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7
    })

    return res.status(200).send({ accessToken: newAccessToken })
  });

  app.post('/logout', async (req, res) => {
    const refreshToken = req.cookies.refreshToken

    if (refreshToken) {
      await authService.logout(refreshToken)
    }

    res.clearCookie('refreshToken', {
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'lax',
    })
    return res.status(200).send({ message: 'Logout successful.' })
  });
}

/*
* Token destroy implemented on user logout.
*/
