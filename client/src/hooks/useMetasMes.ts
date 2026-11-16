import { useState } from 'react'
import { useTelevendas } from './useTelevendas'
import { apiPut } from '../lib/api'
import type { Metas, MetasMes, TipoMeta } from '../types/televendas'

/**
 * Metas do mês (faturamento, supermeta e clientes) + realizado no mês inteiro.
 * `salvar` grava uma ou mais metas de uma vez (null apaga) e já atualiza a tela com a resposta.
 */
export function useMetasMes(mes: string, habilitado: boolean) {
    const { data, loading, erro } = useTelevendas<MetasMes>('/televendas/meta', { mes }, habilitado)
    const [salvas, setSalvas] = useState<{ mes: string; metas: Metas } | null>(null)

    const metas = salvas?.mes === mes ? salvas.metas : (data?.metas ?? null)

    async function salvar(alteracoes: Partial<Record<TipoMeta, number | null>>) {
        const resposta = await apiPut<{ mes: string; metas: Metas }>('/televendas/meta', { mes, metas: alteracoes })
        setSalvas(resposta)
    }

    return { metas, realizado: data?.realizado ?? null, loading, erro, salvar }
}
