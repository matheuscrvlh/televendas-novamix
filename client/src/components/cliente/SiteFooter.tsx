import { Link } from 'react-router-dom'
import { BuildingIcon, MapPinIcon, MessageCircleIcon, WhatsAppIcon } from '../icons'
import { useCarrinho } from '../../contexts/CarrinhoContext'
import { WHATSAPP_DISPLAY, WHATSAPP_LINK } from '../../lib/contato'

const navLinks = [
    { label: 'Catálogo', to: '/' },
    { label: 'Favoritos', to: '/favoritos' },
    { label: 'Minha conta', to: '/conta' },
]

export default function SiteFooter() {
    const { abrir: abrirCarrinho } = useCarrinho()

    return (
        <footer className='w-full bg-orange-base text-white'>
            <div className='mx-auto max-w-6xl px-6 py-12'>
                <div className='grid grid-cols-1 gap-10 md:grid-cols-3'>
                    <div className='flex flex-col gap-4'>
                        <p className='text-xl font-bold tracking-tight'>Novamix</p>
                        <p className='text-sm leading-relaxed text-white/70'>
                            Distribuição de alimentos e insumos pro seu negócio, direto da fonte.
                        </p>
                        <a
                            href={WHATSAPP_LINK}
                            target='_blank'
                            rel='noopener noreferrer'
                            className='flex w-fit items-center gap-2 rounded-lg bg-white/15 px-4 py-2.5 text-sm font-semibold transition hover:bg-white/25'
                        >
                            <WhatsAppIcon className='h-5 w-5' />
                            Fale conosco
                        </a>
                    </div>

                    <div>
                        <p className='mb-4 text-xs font-semibold uppercase tracking-widest text-white/50'>Navegação</p>
                        <div className='flex flex-col gap-2.5'>
                            {navLinks.map((link) => (
                                <Link key={link.to} to={link.to} className='w-fit text-sm text-white/75 transition hover:text-white'>
                                    {link.label}
                                </Link>
                            ))}
                            <button
                                type='button'
                                onClick={abrirCarrinho}
                                className='w-fit text-left text-sm text-white/75 transition hover:text-white'
                            >
                                Carrinho
                            </button>
                        </div>
                    </div>

                    <div>
                        <p className='mb-4 text-xs font-semibold uppercase tracking-widest text-white/50'>Onde estamos</p>
                        <div className='flex flex-col gap-3'>
                            <div className='flex items-start gap-2.5 text-sm text-white/75'>
                                <MapPinIcon className='mt-0.5 h-4 w-4 shrink-0 text-white/50' />
                                <span>Avenida Governador Roberto Silveira, 1700 – Prado – Nova Friburgo/RJ</span>
                            </div>
                            <div className='flex items-center gap-2.5 text-sm text-white/75'>
                                <BuildingIcon className='h-4 w-4 shrink-0 text-white/50' />
                                <span>CNPJ: 19.303.867/0001-44</span>
                            </div>
                            <div className='flex items-center gap-2.5 text-sm text-white/75'>
                                <MessageCircleIcon className='h-4 w-4 shrink-0 text-white/50' />
                                <a href={WHATSAPP_LINK} target='_blank' rel='noopener noreferrer' className='transition hover:text-white'>
                                    {WHATSAPP_DISPLAY}
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className='border-t border-white/15' />

            <div className='mx-auto flex max-w-6xl flex-col gap-2 px-6 py-5 md:flex-row md:items-center md:justify-between'>
                <div className='flex flex-col gap-1'>
                    <p className='text-xs text-white/55'>
                        © {new Date().getFullYear()} Novamix Food Service Comércio de Alimentos Ltda. Todos os direitos reservados.
                    </p>
                    <p className='text-xs text-white/35'>Imagens meramente ilustrativas. Preços e disponibilidade podem variar.</p>
                </div>
                <div className='mt-2 flex items-center gap-2 text-sm text-white/60 md:mt-0'>
                    <span>Desenvolvido por</span>
                    <a
                        href='https://www.mthcode.com.br/'
                        target='_blank'
                        rel='noopener noreferrer'
                        className='font-bold text-white transition hover:text-white/80'
                    >
                        MTHCODE
                    </a>
                    <span>e</span>
                    <a
                        href='https://www.marlonalves.dev/'
                        target='_blank'
                        rel='noopener noreferrer'
                        className='font-bold text-white transition hover:text-white/80'
                    >
                        MarlonAlves
                    </a>
                </div>
            </div>
        </footer>
    )
}
