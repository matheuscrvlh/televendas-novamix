import { ApiError } from './api'

const API_URL = import.meta.env.VITE_API_URL

export async function clienteApiGet<T>(path: string): Promise<T> {
    const res = await fetch(`${API_URL}${path}`, { credentials: 'include' })
    return handleResponse<T>(res)
}

export async function clienteApiPost<T>(path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${API_URL}${path}`, {
        method: 'POST',
        credentials: 'include',
        ...(body !== undefined
            ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
            : {}),
    })
    return handleResponse<T>(res)
}

async function handleResponse<T>(res: Response): Promise<T> {
    if (res.status === 204) {
        return undefined as T
    }

    const data = await res.json().catch(() => ({}))

    if (!res.ok) {
        throw new ApiError(res.status, data.error ?? 'Erro ao falar com o servidor.')
    }

    return data as T
}
