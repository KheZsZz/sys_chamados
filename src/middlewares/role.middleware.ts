import { FastifyReply, FastifyRequest } from 'fastify'
import { ROLE_HIERARCHY } from '@/libs/roles'


export function AccessMiddleware(allowedDepartments: string[], minimumRoleRequired?: string) {
  return async (req: FastifyRequest, res: FastifyReply) => {
    const user = req.user as { id: string; role: string; department: string } | undefined

    if (!user) {
      return res.status(401).send({ message: 'Not authenticated.' })
    }

    if (user.role === 'DEVELOPERMENT' || user.department === 'DEVELOPER') {
      return
    }

    if (!allowedDepartments.includes(user.department)) {
      return res.status(403).send({
        message: `Access denied: Your department does not have access to this resource.`
      })
    }

    if (minimumRoleRequired) {
      const userRoleLevel = ROLE_HIERARCHY[user.role] || 0
      const requiredRoleLevel = ROLE_HIERARCHY[minimumRoleRequired] || 0

      if (userRoleLevel < requiredRoleLevel) {
        return res.status(403).send({
          message: 'Access denied: Your role does not have the minimum required permission level.'
        })
      }
    }
  }
}
