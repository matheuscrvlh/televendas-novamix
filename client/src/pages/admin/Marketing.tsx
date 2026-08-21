import { useEffect, useRef, useState, useMemo, type FormEvent } from 'react'
import PageShell from '../../components/PageShell'
import Spinner from '../../components/Spinner'
import { ImageIcon } from '../../components/icons'
import { useMe } from '../../hooks/useMe'
import { apiGet, apiPatch, apiDelete, apiPostForm, ApiError } from '../../lib/api'
import type { Banner } from '../../types/marketing'

const API_URL = import.meta.env.VITE_API_URL

function bannerImagemUrl(path: string) {
    return `${API_URL}${path}`
}

type UploadAreaProps = {
    label: string
    arquivo: File | null
    onChange: (file: File | null) => void
}

function UploadArea({ label, arquivo, onChange }: UploadAreaProps) {
    const inputRef = useRef<HTMLInputElement>(null)
    const preview = useMemo(() => (arquivo ? URL.createObjectURL(arquivo) : null), [arquivo])

    useEffect(() => {
        return () => {
            if (preview) URL.revokeObjectURL(preview)
        }
    }, [preview])

    return (
        <div className='flex-1'>
            <p className='mb-1 text-xs text-gray-dark dark:text-dark-text-muted'>{label}</p>
            <button
                type='button'
                onClick={() => inputRef.current?.click()}
                className='flex aspect-video w-full items-center justify-center overflow-hidden rounded-lg border border-dashed border-gray-base/40 bg-gray transition hover:border-orange-base dark:bg-dark-surface-2'
            >
                {preview ? (
                    <img src={preview} alt='' className='h-full w-full object-cover' />
                ) : (
                    <span className='flex flex-col items-center gap-1 text-gray-dark dark:text-dark-text-muted'>
                        <ImageIcon className='h-6 w-6' />
                        <span className='text-xs'>Clique para selecionar</span>
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

export default function MarketingAdmin() {
    const { me, loading: loadingMe, error: meError } = useMe()
    const autorizado = me?.isAdmin ?? false

    const [banners, setBanners] = useState<Banner[]>([])
    const [loading, setLoading] = useState(true)
    const [erro, setErro] = useState<string | null>(null)

    const [imagemDesktop, setImagemDesktop] = useState<File | null>(null)
    const [imagemMobile, setImagemMobile] = useState<File | null>(null)
    const [link, setLink] = useState('')
    const [enviando, setEnviando] = useState(false)
    const [erroForm, setErroForm] = useState<string | null>(null)

    const [salvando, setSalvando] = useState<string | null>(null)
    const [linksEditando, setLinksEditando] = useState<Record<string, string>>({})

    function carregar() {
        if (!autorizado) return
        setLoading(true)
        setErro(null)
        apiGet<Banner[]>('/marketing/banners')
            .then(setBanners)
            .catch((err) => setErro(err.message))
            .finally(() => setLoading(false))
    }

    useEffect(carregar, [autorizado])

    async function enviarNovoBanner(e: FormEvent) {
        e.preventDefault()
        if (!imagemDesktop) return

        setEnviando(true)
        setErroForm(null)
        try {
            const fd = new FormData()
            fd.append('imagem', imagemDesktop)
            if (imagemMobile) fd.append('imagem_mobile', imagemMobile)
            if (link.trim()) fd.append('link', link.trim())

            await apiPostForm('/marketing/banners', fd)
            setImagemDesktop(null)
            setImagemMobile(null)
            setLink('')
            carregar()
        } catch (err) {
            setErroForm(err instanceof ApiError ? err.message : 'Erro ao enviar o banner.')
        } finally {
            setEnviando(false)
        }
    }

    async function alternarAtivo(banner: Banner) {
        setSalvando(banner.id)
        try {
            await apiPatch(`/marketing/banners/${banner.id}`, { ativo: !banner.ativo })
            carregar()
        } catch (err) {
            setErro(err instanceof ApiError ? err.message : 'Erro ao atualizar.')
        } finally {
            setSalvando(null)
        }
    }

    async function salvarLink(banner: Banner) {
        const novoLink = linksEditando[banner.id] ?? ''
        setSalvando(banner.id)
        try {
            await apiPatch(`/marketing/banners/${banner.id}`, { link: novoLink })
            carregar()
        } catch (err) {
            setErro(err instanceof ApiError ? err.message : 'Erro ao salvar o link.')
        } finally {
            setSalvando(null)
        }
    }

    async function mover(index: number, direcao: -1 | 1) {
        const alvo = index + direcao
        if (alvo < 0 || alvo >= banners.length) return

        const anterior = banners
        const proximos = [...banners]
        ;[proximos[index], proximos[alvo]] = [proximos[alvo], proximos[index]]
        const atualizados = proximos.map((b, i) => ({ ...b, ordem: i }))
        setBanners(atualizados)

        try {
            await Promise.all([
                apiPatch(`/marketing/banners/${atualizados[index].id}`, { ordem: atualizados[index].ordem }),
                apiPatch(`/marketing/banners/${atualizados[alvo].id}`, { ordem: atualizados[alvo].ordem }),
            ])
        } catch {
            setBanners(anterior)
            setErro('Erro ao reordenar banners.')
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
        <PageShell
            isAdmin={autorizado}
            loadingMe={loadingMe}
            meError={meError}
            autorizado={autorizado}
            tituloAcessoRestrito='Marketing é uma área restrita a administradores.'
            titulo='Marketing'
            subtitulo='Banner principal exibido no topo do site do cliente.'
        >
            <div className='rounded-xl border border-gray-base/30 bg-white p-6 shadow-sm dark:border-dark-border dark:bg-dark-surface'>
                {erro && <p className='mb-4 text-sm text-red-base'>{erro}</p>}

                {loading ? (
                    <div className='flex justify-center py-6'>
                        <Spinner className='h-6 w-6' />
                    </div>
                ) : banners.length === 0 ? (
                    <p className='text-sm text-gray-dark dark:text-dark-text-muted'>Nenhum banner cadastrado ainda.</p>
                ) : (
                    <ul className='flex flex-col divide-y divide-gray-base/20 dark:divide-dark-border'>
                        {banners.map((banner, index) => (
                            <li key={banner.id} className='flex flex-wrap items-center gap-3 py-3'>
                                <img
                                    src={bannerImagemUrl(banner.imagem)}
                                    alt=''
                                    className='h-14 w-24 shrink-0 rounded-lg border border-gray-base/30 object-cover dark:border-dark-border'
                                />

                                <div className='flex min-w-0 flex-1 items-center gap-2'>
                                    <input
                                        type='text'
                                        placeholder='Link (opcional)'
                                        value={linksEditando[banner.id] ?? banner.link ?? ''}
                                        onChange={(e) =>
                                            setLinksEditando((prev) => ({ ...prev, [banner.id]: e.target.value }))
                                        }
                                        className='min-w-0 flex-1 rounded-lg border border-gray-base/30 bg-white px-3 py-1.5 text-sm text-gray-text dark:border-dark-border dark:bg-dark-surface dark:text-dark-text'
                                    />
                                    <button
                                        type='button'
                                        disabled={salvando === banner.id}
                                        onClick={() => salvarLink(banner)}
                                        className='shrink-0 rounded-lg border border-orange-base px-2 py-1.5 text-xs font-semibold text-orange-base transition hover:bg-orange-base hover:text-white disabled:opacity-40'
                                    >
                                        Salvar
                                    </button>
                                </div>

                                <button
                                    type='button'
                                    disabled={salvando === banner.id}
                                    onClick={() => alternarAtivo(banner)}
                                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition disabled:opacity-40 ${
                                        banner.ativo
                                            ? 'bg-green-base/10 text-green-base hover:bg-green-base/20'
                                            : 'bg-gray-base/10 text-gray-dark hover:bg-gray-base/20 dark:text-dark-text-muted'
                                    }`}
                                >
                                    {banner.ativo ? 'Ativo' : 'Inativo'}
                                </button>

                                <div className='flex shrink-0 gap-1'>
                                    <button
                                        type='button'
                                        disabled={index === 0}
                                        onClick={() => mover(index, -1)}
                                        className='rounded-lg px-2 py-1 text-sm text-gray-dark transition hover:bg-orange-base/10 hover:text-orange-base disabled:opacity-30 dark:text-dark-text-muted'
                                        aria-label='Mover pra cima'
                                    >
                                        ↑
                                    </button>
                                    <button
                                        type='button'
                                        disabled={index === banners.length - 1}
                                        onClick={() => mover(index, 1)}
                                        className='rounded-lg px-2 py-1 text-sm text-gray-dark transition hover:bg-orange-base/10 hover:text-orange-base disabled:opacity-30 dark:text-dark-text-muted'
                                        aria-label='Mover pra baixo'
                                    >
                                        ↓
                                    </button>
                                </div>

                                <button
                                    type='button'
                                    disabled={salvando === banner.id}
                                    onClick={() => remover(banner.id)}
                                    className='shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-red-base transition hover:bg-red-light/10 disabled:opacity-40'
                                >
                                    Remover
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <div className='mt-6 rounded-xl border border-gray-base/30 bg-white p-6 shadow-sm dark:border-dark-border dark:bg-dark-surface'>
                <span className='text-sm font-medium text-gray-text dark:text-dark-text'>Adicionar banner</span>

                <form onSubmit={enviarNovoBanner} className='mt-4 flex flex-col gap-4'>
                    <div className='flex flex-col gap-4 sm:flex-row'>
                        <UploadArea label='Desktop (1920×480, obrigatório)' arquivo={imagemDesktop} onChange={setImagemDesktop} />
                        <UploadArea label='Mobile (opcional)' arquivo={imagemMobile} onChange={setImagemMobile} />
                    </div>

                    <div>
                        <label className='block text-xs text-gray-dark dark:text-dark-text-muted'>Link (opcional)</label>
                        <input
                            type='text'
                            value={link}
                            onChange={(e) => setLink(e.target.value)}
                            placeholder='https://...'
                            className='mt-1 w-full rounded-lg border border-gray-base/30 bg-white px-3 py-2 text-sm text-gray-text dark:border-dark-border dark:bg-dark-surface dark:text-dark-text'
                        />
                    </div>

                    <button
                        type='submit'
                        disabled={enviando || !imagemDesktop}
                        className='flex w-fit items-center justify-center rounded-lg bg-orange-base px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-light disabled:opacity-50'
                    >
                        {enviando ? <Spinner className='h-4 w-4' /> : 'Adicionar'}
                    </button>

                    {erroForm && <p className='text-sm text-red-base'>{erroForm}</p>}
                </form>
            </div>
        </PageShell>
    )
}
