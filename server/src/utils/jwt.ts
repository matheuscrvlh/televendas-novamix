import jwt from 'jsonwebtoken';
import type { AuthUser } from '../middlewares/auth.middlewares';
import type { ClienteAuth } from '../middlewares/cliente.middlewares';

export async function verifyToken(token: string) {
    return jwt.verify(token, process.env.JWT_SECRET) as AuthUser
}

export function signClienteToken(payload: ClienteAuth) {
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '30d' })
}

export async function verifyClienteToken(token: string) {
    return jwt.verify(token, process.env.JWT_SECRET) as ClienteAuth
}
