import pg from 'pg'

const pool = new pg.Pool({
    connectionString: process.env.SUPABASE_DATABASE_URL,
    ssl: { rejectUnauthorized: false },
})

export function querySupabase<T>(sql: string, params: unknown[] = []) {
    return pool.query<T>(sql, params).then((res) => res.rows)
}

export async function withTransaction<T>(fn: (query: typeof querySupabase) => Promise<T>) {
    const client = await pool.connect()
    const query = <R>(sql: string, params: unknown[] = []) =>
        client.query<R>(sql, params).then((res) => res.rows)

    try {
        await client.query('BEGIN')
        const result = await fn(query)
        await client.query('COMMIT')
        return result
    } catch (err) {
        await client.query('ROLLBACK')
        throw err
    } finally {
        client.release()
    }
}
