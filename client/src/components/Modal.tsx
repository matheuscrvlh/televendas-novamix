import { useEffect, type ReactNode } from 'react'
import { CloseIcon } from './icons'

type ModalProps = {
    isOpen: boolean
    onClose: () => void
    children: ReactNode
    titulo?: string
}

export default function Modal({ isOpen, onClose, children, titulo }: ModalProps) {
    useEffect(() => {
        if (!isOpen) return
        const originalHtml = document.documentElement.style.overflow
        const originalBody = document.body.style.overflow
        document.documentElement.style.overflow = 'hidden'
        document.body.style.overflow = 'hidden'
        return () => {
            document.documentElement.style.overflow = originalHtml
            document.body.style.overflow = originalBody
        }
    }, [isOpen])

    if (!isOpen) return null

    return (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
            <div className='absolute inset-0 bg-black/50' onClick={onClose} />

            <div className='relative w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl dark:bg-dark-surface'>
                <div className='flex items-center justify-between'>
                    {titulo && <h2 className='text-lg font-semibold text-gray-text dark:text-dark-text'>{titulo}</h2>}
                    <button
                        type='button'
                        onClick={onClose}
                        className='ml-auto rounded-md p-1 text-gray-dark hover:text-orange-base dark:text-dark-text-muted dark:hover:text-orange-light'
                        aria-label='Fechar'
                    >
                        <CloseIcon className='h-5 w-5' />
                    </button>
                </div>

                <div className='mt-4'>{children}</div>
            </div>
        </div>
    )
}
