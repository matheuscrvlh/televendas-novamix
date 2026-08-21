import type { FastifyRequest, FastifyReply } from 'fastify'
import { verifyClienteToken } from '../utils/jwt'

export interface ClienteAuth {
    tipo: 'cliente'
    clienteId: string
}

declare module 'fastify' {
    interface FastifyRequest {
        cliente: ClienteAuth
    }
}

export async function authenticateCliente(req: FastifyRequest, res: FastifyReply) {
    const token = req.cookies.cliente_token

    if (!token) {
        return res.code(401).send({ error: 'Faça login para continuar.' })
    }

    try {
        const payload = await verifyClienteToken(token)
        if (payload.tipo !== 'cliente') throw new Error('token inválido')
        req.cliente = payload
    } catch {
        return res.code(401).send({ error: 'Sessão inválida ou expirada.' })
    }
}
