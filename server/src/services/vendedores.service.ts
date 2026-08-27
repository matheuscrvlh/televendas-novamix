import { querySupabase } from '../database/supabase.database'
import { loadQuery } from './query.service'

// Códigos de vendedor que compõem o time de televendas: cadastrados pelo admin em
// Configurações (televendas.config_vendedores), não fica fixo no .env.
export async function vendedoresTelevendas() {
    const config = await querySupabase<{ codigo_vendedor: number }>(
        'SELECT codigo_vendedor FROM televendas.config_vendedores'
    )
    return config.map((c) => c.codigo_vendedor)
}

export async function sqlComVendedores(modulo: string, arquivo: string) {
    const ids = await vendedoresTelevendas()
    // IN () é inválido no DB2 — sem vendedor configurado, usa um id impossível pra não dar erro.
    const lista = ids.length > 0 ? ids.join(',') : '-1'
    return loadQuery(modulo, arquivo).replaceAll('{{VENDEDORES}}', lista)
}
