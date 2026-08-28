import { WhatsAppIcon } from '../icons'
import { WHATSAPP_LINK } from '../../lib/contato'

export default function WhatsAppFloatButton() {
    return (
        <a
            href={WHATSAPP_LINK}
            target='_blank'
            rel='noopener noreferrer'
            aria-label='Fale conosco no WhatsApp'
            className='fixed bottom-5 right-5 z-20 flex h-16 w-16 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition hover:scale-105 hover:bg-[#20bd5a]'
        >
            <span className='absolute inset-0 animate-ping rounded-full bg-[#25D366] opacity-75' />
            <WhatsAppIcon className='relative h-8 w-8' />
        </a>
    )
}
