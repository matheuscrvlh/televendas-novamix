import { useEffect, useState } from 'react'
import { clienteApiGet } from '../lib/clienteApi'
import type { ClienteInfo } from '../types/cliente'

export function useClienteMe() {
    const [cliente, setCliente] = useState<ClienteInfo | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        clienteApiGet<ClienteInfo>('/cliente/me')
            .then(setCliente)
            .catch(() => setCliente(null))
            .finally(() => setLoading(false))
    }, [])

    return { cliente, loading, setCliente }
}
