import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from "@fastify/type-provider-zod";
import { authService } from '@/services/auth.service';
import { loginBodySchema } from '@/schemas/auth.schema';


export async function authRoutes(routes: FastifyInstance) {
  const app = routes.withTypeProvider<ZodTypeProvider>();

  app.post('/login', {
      schema: {
        body: loginBodySchema
      }
    }, async (req, res) => {
    try {
      const { email, password } = req.body
      const { user, accessToken, refreshToken } = await authService.login(email, password, routes)

      res.setCookie('refreshToken', refreshToken, {
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7 // 7 dias
      })

      return res.status(200).send({ user, accessToken })
    } catch (error: any) {
      return res.status(401).send({ message: error.message })
    }
  });
  app.post('/refresh', async (req, res) => {
    const refreshToken = req.cookies.refreshToken

    if (!refreshToken) {
      return res.status(401).send({ message: 'Refresh token ausente. Faça login novamente.' })
    }

    try {
      const { newAccessToken, newRefreshToken } = await authService.refreshSession(refreshToken, routes)

      res.setCookie('refreshToken', newRefreshToken, {
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7
      })

      return res.status(200).send({ accessToken: newAccessToken })
    } catch (error) {
      return res.status(401).send({ message: 'Session invalid or expired.' })
    }
  });
  app.post('/logout', async (req, res) => {
    res.clearCookie('refreshToken', {
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'lax',
    })
    return res.status(200).send({ message: 'Logout realizado com sucesso.' })
  });
}

/*
* Implementado o token detroy quando o usuário faz logout.
*/
