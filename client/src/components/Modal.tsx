import { useEffect, useRef, type ReactNode } from 'react'
import { CloseIcon } from './icons'

type ModalProps = {
    isOpen: boolean
    onClose: () => void
    children: ReactNode
    titulo?: string
    subtitulo?: ReactNode
    tamanho?: 'md' | 'xl'
}

const LARGURA: Record<NonNullable<ModalProps['tamanho']>, string> = {
    md: 'max-w-lg',
    xl: 'max-w-3xl',
}

export default function Modal({ isOpen, onClose, children, titulo, subtitulo, tamanho = 'md' }: ModalProps) {
    // Guarda o onClose mais recente sem refazer o efeito a cada render (quem chama costuma passar uma arrow nova).
    const onCloseRef = useRef(onClose)
    useEffect(() => {
        onCloseRef.current = onClose
    }, [onClose])

    useEffect(() => {
        if (!isOpen) return
        const originalHtml = document.documentElement.style.overflow
        const originalBody = document.body.style.overflow
        document.documentElement.style.overflow = 'hidden'
        document.body.style.overflow = 'hidden'

        const fecharComEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onCloseRef.current()
        }
        window.addEventListener('keydown', fecharComEsc)

        return () => {
            document.documentElement.style.overflow = originalHtml
            document.body.style.overflow = originalBody
            window.removeEventListener('keydown', fecharComEsc)
        }
    }, [isOpen])

    if (!isOpen) return null

    return (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
            <div className='absolute inset-0 bg-black/50' onClick={onClose} />

            <div
                role='dialog'
                aria-modal='true'
                aria-label={titulo}
                className={`relative flex max-h-[calc(100dvh-2rem)] w-full flex-col rounded-xl bg-white p-6 shadow-2xl dark:bg-dark-surface ${LARGURA[tamanho]}`}
            >
                <div className='flex items-start justify-between gap-4'>
                    <div className='min-w-0'>
                        {titulo && (
                            <h2 className='wrap-break-word text-lg font-semibold leading-snug text-gray-text dark:text-dark-text'>
                                {titulo}
                            </h2>
                        )}
                        {subtitulo && (
                            <div className='mt-0.5 text-sm text-gray-dark dark:text-dark-text-muted'>{subtitulo}</div>
                        )}
                    </div>
                    <button
                        type='button'
                        onClick={onClose}
                        className='ml-auto shrink-0 rounded-md p-1 text-gray-dark hover:text-orange-base dark:text-dark-text-muted dark:hover:text-orange-light'
                        aria-label='Fechar'
                    >
                        <CloseIcon className='h-5 w-5' />
                    </button>
                </div>

                <div className='mt-4 min-h-0 flex-1 overflow-y-auto'>{children}</div>
            </div>
        </div>
    )
}
