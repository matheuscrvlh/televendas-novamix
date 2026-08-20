import PageShell from '../components/PageShell'
import { useMe } from '../hooks/useMe'

export default function Home() {
    const { me, loading: loadingMe, error: meError } = useMe()

    return (
        <PageShell
            isAdmin={me?.isAdmin ?? false}
            loadingMe={loadingMe}
            meError={meError}
            autorizado={me !== null}
            titulo='Televendas Novamix'
            subtitulo='Estrutura base do módulo de televendas.'
        >
            <div className='rounded-xl border border-gray-base/30 bg-white p-6 shadow-sm dark:border-dark-border dark:bg-dark-surface'>
                <p className='text-sm text-gray-dark dark:text-dark-text-muted'>
                    Nenhum conteúdo ainda — comece a construir as páginas do módulo aqui.
                </p>
            </div>
        </PageShell>
    )
}
