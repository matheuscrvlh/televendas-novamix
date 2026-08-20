import Logo from '../components/Logo'

export default function Catalogo() {
    return (
        <div className='flex min-h-screen w-full flex-col items-center justify-center gap-4 bg-gray px-6 text-center dark:bg-dark-bg'>
            <Logo />
            <h1 className='text-2xl font-semibold text-gray-text dark:text-dark-text'>Catálogo em breve</h1>
            <p className='max-w-md text-sm text-gray-dark dark:text-dark-text-muted'>
                Estamos preparando a loja online da Novamix. Em breve você poderá ver produtos e fazer pedidos por aqui.
            </p>
        </div>
    )
}
