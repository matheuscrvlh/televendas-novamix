import { useEffect, useRef, useState, useMemo, type FormEvent } from 'react'
import PageShell from '../../components/PageShell'
import Modal from '../../components/Modal'
import Spinner from '../../components/Spinner'
import { DownloadIcon, ImageIcon, LinkIcon, PlusIcon, TrashIcon } from '../../components/icons'
import { useMe } from '../../hooks/useMe'
import { apiGet, apiPatch, apiDelete, apiPostForm, ApiError } from '../../lib/api'
import { uploadImagemUrl } from '../../lib/imagens'
import type { Banner } from '../../types/marketing'

type Posicao = 'hero' | 'secao'

type UploadAreaProps = {
    label: string
    hint: string
    aspectClass: string
    arquivo: File | null
    onChange: (file: File | null) => void
}

function UploadArea({ label, hint, aspectClass, arquivo, onChange }: UploadAreaProps) {
    const inputRef = useRef<HTMLInputElement>(null)
    const preview = useMemo(() => (arquivo ? URL.createObjectURL(arquivo) : null), [arquivo])

    useEffect(() => {
        return () => {
            if (preview) URL.revokeObjectURL(preview)
        }
    }, [preview])

    return (
        <div className='flex flex-col gap-1.5'>
            <div className='flex items-baseline gap-2'>
                <p className='text-xs font-semibold uppercase tracking-wide text-gray-dark dark:text-dark-text-muted'>
                    {label}
                </p>
                <p className='text-[11px] text-gray-dark/60 dark:text-dark-text-muted/60'>{hint}</p>
            </div>
            <button
                type='button'
                onClick={() => inputRef.current?.click()}
                className={`relative w-full ${aspectClass} flex min-h-16 items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-gray-base/30 bg-gray transition hover:border-orange-base dark:bg-dark-surface-2`}
            >
                {preview ? (
                    <img src={preview} alt='' className='h-full w-full object-cover' />
                ) : (
                    <span className='flex flex-col items-center gap-1.5 px-3 text-center text-gray-dark/50 dark:text-dark-text-muted/50'>
                        <ImageIcon className='h-6 w-6' />
                        <span className='text-xs leading-snug'>Clique para selecionar</span>
                    </span>
                )}
            </button>
            <input
                ref={inputRef}
                type='file'
                accept='image/png,image/jpeg,image/webp,image/gif'
                className='hidden'
                onChange={(e) => onChange(e.target.files?.[0] ?? null)}
            />
        </div>
    )
}

type BannerFormProps = {
    posicao: Posicao
    hintDesktop: string
    aspectDesktop: string
    comMobile: boolean
    onAdded: () => void
}

function BannerForm({ posicao, hintDesktop, aspectDesktop, comMobile, onAdded }: BannerFormProps) {
    const [imagemDesktop, setImagemDesktop] = useState<File | null>(null)
    const [imagemMobile, setImagemMobile] = useState<File | null>(null)
    const [link, setLink] = useState('')
    const [enviando, setEnviando] = useState(false)
    const [erro, setErro] = useState<string | null>(null)

    async function handleSubmit(e: FormEvent) {
        e.preventDefault()
        if (!imagemDesktop) return

        setEnviando(true)
        setErro(null)
        try {
            const fd = new FormData()
            fd.append('imagem', imagemDesktop)
            if (imagemMobile) fd.append('imagem_mobile', imagemMobile)
            if (link.trim()) fd.append('link', link.trim())
            fd.append('posicao', posicao)

            await apiPostForm('/marketing/banners', fd)
            onAdded()
        } catch (err) {
            setErro(err instanceof ApiError ? err.message : 'Erro ao adicionar banner.')
        } finally {
            setEnviando(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
            <div className={`grid grid-cols-1 items-start gap-4 ${comMobile ? 'sm:grid-cols-[1fr_auto]' : ''}`}>
                <UploadArea
                    label='Desktop'
                    hint={hintDesktop}
                    aspectClass={aspectDesktop}
                    arquivo={imagemDesktop}
                    onChange={setImagemDesktop}
                />
                {comMobile && (
                    <UploadArea
                        label='Mobile'
                        hint='425 × 495 px (opcional)'
                        aspectClass='aspect-[425/495] w-full sm:w-28'
                        arquivo={imagemMobile}
                        onChange={setImagemMobile}
                    />
                )}
            </div>

            <div className='flex items-center gap-2 rounded-lg border border-gray-base/30 bg-white px-3 py-2 dark:border-dark-border dark:bg-dark-surface'>
                <LinkIcon className='h-4 w-4 shrink-0 text-gray-dark/50 dark:text-dark-text-muted/50' />
                <input
                    type='url'
                    placeholder='URL de redirecionamento (opcional)'
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    className='flex-1 bg-transparent text-sm text-gray-text outline-none dark:text-dark-text'
                />
            </div>

            {erro && <p className='text-sm text-red-base'>{erro}</p>}

            <button
                type='submit'
                disabled={!imagemDesktop || enviando}
                className='flex items-center justify-center gap-2 rounded-lg bg-orange-base py-2.5 text-sm font-semibold text-white transition hover:bg-orange-light disabled:cursor-not-allowed disabled:opacity-50'
            >
                {enviando ? <Spinner className='h-4 w-4' /> : <PlusIcon className='h-4 w-4' />}
                {enviando ? 'Enviando...' : 'Adicionar banner'}
            </button>
        </form>
    )
}

type BannerItemProps = {
    banner: Banner
    comMobile: boolean
    salvando: boolean
    onDelete: () => void
    onSalvarLink: (link: string) => void
}

function BannerItem({ banner, comMobile, salvando, onDelete, onSalvarLink }: BannerItemProps) {
    const [editandoLink, setEditandoLink] = useState(false)
    const [link, setLink] = useState(banner.link ?? '')

    function salvar() {
        onSalvarLink(link)
        setEditandoLink(false)
    }

    return (
        <div className='flex flex-wrap items-center gap-3 rounded-xl border border-gray-base/20 bg-white p-3 shadow-sm dark:border-dark-border dark:bg-dark-surface-2'>
            <div className='flex shrink-0 gap-2'>
                <div className='flex flex-col items-center gap-1'>
                    <p className='text-[10px] uppercase text-gray-dark/50 dark:text-dark-text-muted/50'>Desktop</p>
                    <div className='h-8 w-24 overflow-hidden rounded bg-gray dark:bg-dark-surface'>
                        <img src={uploadImagemUrl(banner.imagem)} alt='' className='h-full w-full object-cover' />
                    </div>
                </div>
                {comMobile && (
                    <div className='flex flex-col items-center gap-1'>
                        <p className='text-[10px] uppercase text-gray-dark/50 dark:text-dark-text-muted/50'>Mobile</p>
                        <div className='flex h-8 w-7 items-center justify-center overflow-hidden rounded bg-gray dark:bg-dark-surface'>
                            {banner.imagem_mobile ? (
                                <img src={uploadImagemUrl(banner.imagem_mobile)} alt='' className='h-full w-full object-cover' />
                            ) : (
                                <span className='text-xs text-gray-dark/30 dark:text-dark-text-muted/30'>—</span>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <div className='min-w-0 flex-1'>
                <p className='mb-1 text-[11px] uppercase tracking-wide text-gray-dark/50 dark:text-dark-text-muted/50'>
                    Link
                </p>
                {editandoLink ? (
                    <div className='flex items-center gap-2'>
                        <input
                            type='url'
                            value={link}
                            onChange={(e) => setLink(e.target.value)}
                            autoFocus
                            placeholder='https://...'
                            className='min-w-0 flex-1 rounded-md border border-gray-base/30 px-2 py-1 text-xs text-gray-text outline-none focus:border-orange-base dark:border-dark-border dark:bg-dark-surface dark:text-dark-text'
                        />
                        <button
                            type='button'
                            onClick={salvar}
                            className='shrink-0 rounded-md bg-orange-base px-2 py-1 text-xs font-semibold text-white transition hover:bg-orange-light'
                        >
                            Salvar
                        </button>
                        <button
                            type='button'
                            onClick={() => {
                                setLink(banner.link ?? '')
                                setEditandoLink(false)
                            }}
                            className='shrink-0 text-xs text-gray-dark transition hover:text-gray-text dark:text-dark-text-muted'
                        >
                            Cancelar
                        </button>
                    </div>
                ) : (
                    <button
                        type='button'
                        onClick={() => setEditandoLink(true)}
                        className='group flex items-center gap-1.5 text-left'
                    >
                        <LinkIcon className='h-3 w-3 shrink-0 text-gray-dark/40 dark:text-dark-text-muted/40' />
                        <span className='truncate text-xs text-gray-dark transition group-hover:text-orange-base dark:text-dark-text-muted'>
                            {banner.link || <span className='italic text-gray-dark/40 dark:text-dark-text-muted/40'>Sem link — clique pra adicionar</span>}
                        </span>
                    </button>
                )}
            </div>

            <span
                title='Ativação e ordem ficam em Configurações → Layout da loja'
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                    banner.ativo
                        ? 'bg-green-base/10 text-green-base'
                        : 'bg-gray-base/10 text-gray-dark dark:text-dark-text-muted'
                }`}
            >
                {banner.ativo ? 'Ativo' : 'Inativo'}
            </span>

            <a
                href={uploadImagemUrl(banner.imagem)}
                download
                target='_blank'
                rel='noopener noreferrer'
                title='Baixar imagem desktop'
                className='flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-gray-text transition hover:bg-gray dark:text-dark-text dark:hover:bg-dark-surface'
            >
                <DownloadIcon className='h-3.5 w-3.5' />
            </a>

            <button
                type='button'
                disabled={salvando}
                onClick={onDelete}
                className='flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-base/10 text-red-base transition hover:bg-red-base hover:text-white disabled:opacity-40'
                aria-label='Remover banner'
            >
                <TrashIcon className='h-4 w-4' />
            </button>
        </div>
    )
}

type BannerSectionProps = {
    posicao: Posicao
    titulo: string
    descricao: string
    hintDesktop: string
    aspectDesktop: string
    comMobile: boolean
}

function BannerSection({ posicao, titulo, descricao, hintDesktop, aspectDesktop, comMobile }: BannerSectionProps) {
    const [banners, setBanners] = useState<Banner[]>([])
    const [loading, setLoading] = useState(true)
    const [erro, setErro] = useState<string | null>(null)
    const [salvando, setSalvando] = useState<string | null>(null)
    const [modalAberto, setModalAberto] = useState(false)

    function carregar() {
        setLoading(true)
        setErro(null)
        apiGet<Banner[]>('/marketing/banners', { posicao })
            .then(setBanners)
            .catch((err) => setErro(err.message))
            .finally(() => setLoading(false))
    }

    useEffect(carregar, [posicao])

    function bannerAdicionado() {
        setModalAberto(false)
        carregar()
    }

    async function salvarLink(banner: Banner, link: string) {
        setSalvando(banner.id)
        try {
            await apiPatch(`/marketing/banners/${banner.id}`, { link })
            carregar()
        } catch (err) {
            setErro(err instanceof ApiError ? err.message : 'Erro ao salvar o link.')
        } finally {
            setSalvando(null)
        }
    }

    async function remover(id: string) {
        setSalvando(id)
        try {
            await apiDelete(`/marketing/banners/${id}`)
            carregar()
        } catch (err) {
            setErro(err instanceof ApiError ? err.message : 'Erro ao remover.')
        } finally {
            setSalvando(null)
        }
    }

    return (
        <div className='flex flex-col gap-6 rounded-xl bg-white p-5 shadow-sm md:p-8 dark:bg-dark-surface'>
            <div className='flex items-center justify-between gap-3'>
                <div>
                    <h2 className='text-lg font-bold text-gray-text dark:text-dark-text'>{titulo}</h2>
                    <p className='mt-0.5 text-sm text-gray-dark/70 dark:text-dark-text-muted/70'>{descricao}</p>
                </div>
                <button
                    type='button'
                    onClick={() => setModalAberto(true)}
                    className='flex shrink-0 items-center gap-1.5 rounded-lg bg-orange-base px-3 py-2 text-sm font-semibold text-white transition hover:bg-orange-light'
                >
                    <PlusIcon className='h-4 w-4' /> Adicionar banner
                </button>
            </div>

            <hr className='border-gray-base/20 dark:border-dark-border' />

            {erro && <p className='text-sm text-red-base'>{erro}</p>}

            <div className='flex flex-col gap-3'>
                {loading ? (
                    <div className='flex flex-col items-center gap-2 py-6 text-gray-dark/50 dark:text-dark-text-muted/50'>
                        <Spinner className='h-6 w-6' />
                        <p className='text-sm'>Carregando...</p>
                    </div>
                ) : banners.length === 0 ? (
                    <p className='py-6 text-center text-sm italic text-gray-dark/50 dark:text-dark-text-muted/50'>
                        Nenhum banner cadastrado
                    </p>
                ) : (
                    banners.map((banner) => (
                        <BannerItem
                            key={banner.id}
                            banner={banner}
                            comMobile={comMobile}
                            salvando={salvando === banner.id}
                            onDelete={() => remover(banner.id)}
                            onSalvarLink={(link) => salvarLink(banner, link)}
                        />
                    ))
                )}
            </div>

            <Modal isOpen={modalAberto} onClose={() => setModalAberto(false)} titulo='Adicionar banner'>
                <BannerForm
                    posicao={posicao}
                    hintDesktop={hintDesktop}
                    aspectDesktop={aspectDesktop}
                    comMobile={comMobile}
                    onAdded={bannerAdicionado}
                />
            </Modal>
        </div>
    )
}

export default function MarketingAdmin() {
    const { me, loading: loadingMe, error: meError } = useMe()
    const autorizado = me?.isAdmin ?? false

    return (
        <PageShell
            isAdmin={autorizado}
            loadingMe={loadingMe}
            meError={meError}
            autorizado={autorizado}
            tituloAcessoRestrito='Marketing é uma área restrita a administradores.'
            titulo='Marketing'
            subtitulo='Cadastro dos banners da loja. Ativação e ordem ficam em Configurações → Layout da loja.'
        >
            <div className='flex flex-col gap-6'>
                <BannerSection
                    posicao='hero'
                    titulo='Banner principal'
                    descricao='Carrossel no topo da loja.'
                    hintDesktop='1920 × 650 px'
                    aspectDesktop='aspect-1920/650'
                    comMobile
                />

                <BannerSection
                    posicao='secao'
                    titulo='Banner de seção'
                    descricao='Aparece uma vez na home, entre a vitrine inicial e as seções de categoria em destaque.'
                    hintDesktop='1358 × 351 px'
                    aspectDesktop='aspect-1358/351'
                    comMobile={false}
                />
            </div>
        </PageShell>
    )
}
