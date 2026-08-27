import ClienteShell from '../../components/cliente/ClienteShell'
import ProdutoCard from '../../components/cliente/ProdutoCard'
import { HeartIcon } from '../../components/icons'
import { useFavoritos } from '../../contexts/FavoritosContext'

export default function Favoritos() {
    const { produtos, loading } = useFavoritos()

    return (
        <ClienteShell>
            <h1 className='text-2xl font-semibold text-gray-text dark:text-dark-text'>Meus favoritos</h1>

            {loading && <p className='mt-6 text-sm text-gray-dark dark:text-dark-text-muted'>Carregando...</p>}

            {!loading && produtos.length === 0 && (
                <div className='mt-10 flex flex-col items-center gap-3 text-center'>
                    <HeartIcon className='h-10 w-10 text-gray-dark/30 dark:text-dark-text-muted/30' />
                    <p className='text-sm text-gray-dark dark:text-dark-text-muted'>
                        Você ainda não favoritou nenhum produto. Clique no coração do card pra guardar aqui.
                    </p>
                </div>
            )}

            {!loading && produtos.length > 0 && (
                <div className='mt-6 grid grid-cols-[repeat(auto-fill,15rem)] justify-center gap-4 sm:justify-start'>
                    {produtos.map((produto) => (
                        <ProdutoCard key={produto.CODIGO_PRODUTO} produto={produto} />
                    ))}
                </div>
            )}
        </ClienteShell>
    )
}
