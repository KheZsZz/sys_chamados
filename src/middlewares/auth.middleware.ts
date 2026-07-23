import { FastifyReply, FastifyRequest } from 'fastify'

export async function authMiddleware(request: FastifyRequest, reply: FastifyReply) {
  try {
    const authHeader = request.headers.authorization
    if (!authHeader) {
      return reply.status(401).send({ message: 'Token not found' })
    }


    const [scheme, token] = authHeader.split(' ')

    if (!/^Bearer$/i.test(scheme) || !token) {
        return reply.status(401).send({
          error: 'Unauthorized',
          message: 'format token invalid.'
        })
      }
      await request.jwtVerify()
  } catch (err) {
    return reply.status(401).send({ message: 'Token inválido ou ausente.' })
  }
}
