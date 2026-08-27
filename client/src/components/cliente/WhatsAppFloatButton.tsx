import { WhatsAppIcon } from '../icons'
import { WHATSAPP_LINK } from '../../lib/contato'

export default function WhatsAppFloatButton() {
    return (
        <a
            href={WHATSAPP_LINK}
            target='_blank'
            rel='noopener noreferrer'
            aria-label='Fale conosco no WhatsApp'
            className='fixed bottom-4 right-4 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition hover:scale-105 hover:bg-[#20bd5a]'
        >
            <WhatsAppIcon className='h-6 w-6' />
        </a>
    )
}
