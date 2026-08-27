const API_URL = import.meta.env.VITE_API_URL

export class ApiError extends Error {
    status: number

    constructor(status: number, message: string) {
        super(message)
        this.status = status
    }
}

export async function apiGet<T>(path: string, params?: Record<string, string>): Promise<T> {
    const url = new URL(`${API_URL}${path}`)

    if (params) {
        Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value))
    }

    const res = await fetch(url, { credentials: 'include' })
    return handleResponse<T>(res)
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${API_URL}${path}`, {
        method: 'POST',
        credentials: 'include',
        ...(body !== undefined
            ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
            : {}),
    })
    return handleResponse<T>(res)
}

export async function apiPostForm<T>(path: string, formData: FormData): Promise<T> {
    const res = await fetch(`${API_URL}${path}`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
    })
    return handleResponse<T>(res)
}

export async function apiPatchForm<T>(path: string, formData: FormData): Promise<T> {
    const res = await fetch(`${API_URL}${path}`, {
        method: 'PATCH',
        credentials: 'include',
        body: formData,
    })
    return handleResponse<T>(res)
}

export async function apiPatch<T>(path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${API_URL}${path}`, {
        method: 'PATCH',
        credentials: 'include',
        ...(body !== undefined
            ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
            : {}),
    })
    return handleResponse<T>(res)
}

export async function apiDelete<T>(path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${API_URL}${path}`, {
        method: 'DELETE',
        credentials: 'include',
        ...(body !== undefined
            ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
            : {}),
    })
    return handleResponse<T>(res)
}

async function handleResponse<T>(res: Response): Promise<T> {
    if (res.status === 401) {
        window.location.href = 'https://hub.lojanovamix.com.br'
        throw new ApiError(401, 'Não autorizado')
    }

    if (res.status === 204) {
        return undefined as T
    }

    const data = await res.json()

    if (!res.ok) {
        throw new ApiError(res.status, data.error ?? 'Erro ao buscar dados')
    }

    return data as T
}
