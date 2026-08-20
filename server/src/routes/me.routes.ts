import { authenticate, checkPermission, checkBranch } from '../middlewares/auth.middlewares'

const ADMIN_ACCESS = 'admin'

export function meRoutes(fastify) {
    fastify.get('/me', { preHandler: [authenticate] }, async (req, res) => {
        const permission = await checkPermission(req, res)
        if (!permission) return

        const branches = await checkBranch(req, res)
        if (!branches) return

        res.send({ permission, branches, isAdmin: permission === ADMIN_ACCESS })
    })
}
