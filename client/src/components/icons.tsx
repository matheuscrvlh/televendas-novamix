type IconProps = {
    className?: string
}

export function MenuIcon({ className }: IconProps) {
    return (
        <svg
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth={2}
            strokeLinecap='round'
            strokeLinejoin='round'
            className={className}
        >
            <line x1='4' y1='6' x2='20' y2='6' />
            <line x1='4' y1='12' x2='20' y2='12' />
            <line x1='4' y1='18' x2='20' y2='18' />
        </svg>
    )
}

export function CloseIcon({ className }: IconProps) {
    return (
        <svg
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth={2}
            strokeLinecap='round'
            strokeLinejoin='round'
            className={className}
        >
            <line x1='6' y1='6' x2='18' y2='18' />
            <line x1='18' y1='6' x2='6' y2='18' />
        </svg>
    )
}

export function FilterIcon({ className }: IconProps) {
    return (
        <svg
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth={2}
            strokeLinecap='round'
            strokeLinejoin='round'
            className={className}
        >
            <polygon points='4 4 20 4 14 12 14 19 10 21 10 12 4 4' />
        </svg>
    )
}

export function ChevronDownIcon({ className }: IconProps) {
    return (
        <svg
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth={2}
            strokeLinecap='round'
            strokeLinejoin='round'
            className={className}
        >
            <polyline points='6 9 12 15 18 9' />
        </svg>
    )
}

export function CheckIcon({ className }: IconProps) {
    return (
        <svg
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth={2}
            strokeLinecap='round'
            strokeLinejoin='round'
            className={className}
        >
            <polyline points='20 6 9 17 4 12' />
        </svg>
    )
}

export function ImageIcon({ className }: IconProps) {
    return (
        <svg
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth={2}
            strokeLinecap='round'
            strokeLinejoin='round'
            className={className}
        >
            <rect x='3' y='3' width='18' height='18' rx='2' />
            <circle cx='8.5' cy='8.5' r='1.5' />
            <path d='M21 15l-5-5L5 21' />
        </svg>
    )
}

export function CartIcon({ className }: IconProps) {
    return (
        <svg
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth={2}
            strokeLinecap='round'
            strokeLinejoin='round'
            className={className}
        >
            <circle cx='9' cy='21' r='1' />
            <circle cx='19' cy='21' r='1' />
            <path d='M2.5 3h2l2.4 12.2a2 2 0 0 0 2 1.8h8.2a2 2 0 0 0 2-1.6L21 8H6' />
        </svg>
    )
}

export function UserIcon({ className }: IconProps) {
    return (
        <svg
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth={2}
            strokeLinecap='round'
            strokeLinejoin='round'
            className={className}
        >
            <circle cx='12' cy='8' r='4' />
            <path d='M4 20c0-3.3 3.6-6 8-6s8 2.7 8 6' />
        </svg>
    )
}

export function MailIcon({ className }: IconProps) {
    return (
        <svg
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth={2}
            strokeLinecap='round'
            strokeLinejoin='round'
            className={className}
        >
            <rect x='3' y='5' width='18' height='14' rx='2' />
            <path d='M3 7l9 6 9-6' />
        </svg>
    )
}

export function LockIcon({ className }: IconProps) {
    return (
        <svg
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth={2}
            strokeLinecap='round'
            strokeLinejoin='round'
            className={className}
        >
            <rect x='4' y='11' width='16' height='10' rx='2' />
            <path d='M8 11V7a4 4 0 0 1 8 0v4' />
        </svg>
    )
}

type HeartIconProps = IconProps & { filled?: boolean }

export function HeartIcon({ className, filled }: HeartIconProps) {
    return (
        <svg
            viewBox='0 0 24 24'
            fill={filled ? 'currentColor' : 'none'}
            stroke='currentColor'
            strokeWidth={2}
            strokeLinecap='round'
            strokeLinejoin='round'
            className={className}
        >
            <path d='M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z' />
        </svg>
    )
}

export function ChevronLeftIcon({ className }: IconProps) {
    return (
        <svg
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth={2}
            strokeLinecap='round'
            strokeLinejoin='round'
            className={className}
        >
            <polyline points='15 18 9 12 15 6' />
        </svg>
    )
}

export function ChevronRightIcon({ className }: IconProps) {
    return (
        <svg
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth={2}
            strokeLinecap='round'
            strokeLinejoin='round'
            className={className}
        >
            <polyline points='9 18 15 12 9 6' />
        </svg>
    )
}

export function SearchIcon({ className }: IconProps) {
    return (
        <svg
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth={2}
            strokeLinecap='round'
            strokeLinejoin='round'
            className={className}
        >
            <circle cx='11' cy='11' r='7' />
            <line x1='21' y1='21' x2='16.65' y2='16.65' />
        </svg>
    )
}

export function HeadsetIcon({ className }: IconProps) {
    return (
        <svg
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth={2}
            strokeLinecap='round'
            strokeLinejoin='round'
            className={className}
        >
            <path d='M3 13a9 9 0 0 1 18 0' />
            <path d='M21 13v4a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2h3z' />
            <path d='M3 13v4a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2H3z' />
            <path d='M13 19a2 2 0 0 1-2 2h-1' />
        </svg>
    )
}

export function TrashIcon({ className }: IconProps) {
    return (
        <svg
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth={2}
            strokeLinecap='round'
            strokeLinejoin='round'
            className={className}
        >
            <polyline points='3 6 5 6 21 6' />
            <path d='M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2' />
            <line x1='10' y1='11' x2='10' y2='17' />
            <line x1='14' y1='11' x2='14' y2='17' />
        </svg>
    )
}

export function PlusIcon({ className }: IconProps) {
    return (
        <svg
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth={2}
            strokeLinecap='round'
            strokeLinejoin='round'
            className={className}
        >
            <line x1='12' y1='5' x2='12' y2='19' />
            <line x1='5' y1='12' x2='19' y2='12' />
        </svg>
    )
}

export function MinusIcon({ className }: IconProps) {
    return (
        <svg
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth={2}
            strokeLinecap='round'
            strokeLinejoin='round'
            className={className}
        >
            <line x1='5' y1='12' x2='19' y2='12' />
        </svg>
    )
}

export function DownloadIcon({ className }: IconProps) {
    return (
        <svg
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth={2}
            strokeLinecap='round'
            strokeLinejoin='round'
            className={className}
        >
            <path d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' />
            <polyline points='7 10 12 15 17 10' />
            <line x1='12' y1='15' x2='12' y2='3' />
        </svg>
    )
}

export function LinkIcon({ className }: IconProps) {
    return (
        <svg
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth={2}
            strokeLinecap='round'
            strokeLinejoin='round'
            className={className}
        >
            <path d='M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71' />
            <path d='M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71' />
        </svg>
    )
}

export function MapPinIcon({ className }: IconProps) {
    return (
        <svg
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth={2}
            strokeLinecap='round'
            strokeLinejoin='round'
            className={className}
        >
            <path d='M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z' />
            <circle cx='12' cy='10' r='3' />
        </svg>
    )
}

export function BuildingIcon({ className }: IconProps) {
    return (
        <svg
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth={2}
            strokeLinecap='round'
            strokeLinejoin='round'
            className={className}
        >
            <rect x='4' y='2' width='16' height='20' rx='1' />
            <line x1='9' y1='7' x2='9' y2='7.01' />
            <line x1='15' y1='7' x2='15' y2='7.01' />
            <line x1='9' y1='12' x2='9' y2='12.01' />
            <line x1='15' y1='12' x2='15' y2='12.01' />
            <line x1='9' y1='17' x2='9' y2='17.01' />
            <line x1='15' y1='17' x2='15' y2='17.01' />
        </svg>
    )
}

export function MessageCircleIcon({ className }: IconProps) {
    return (
        <svg
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth={2}
            strokeLinecap='round'
            strokeLinejoin='round'
            className={className}
        >
            <path d='M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z' />
        </svg>
    )
}

export function WhatsAppIcon({ className }: IconProps) {
    return (
        <svg viewBox='0 0 24 24' fill='currentColor' className={className}>
            <path d='M17.5 14.4c-.3-.1-1.6-.8-1.9-.9-.2-.1-.4-.1-.6.1-.2.3-.7.9-.8 1-.2.2-.3.2-.5.1-.3-.1-1.2-.4-2.2-1.4-.8-.7-1.4-1.6-1.5-1.9-.2-.3 0-.4.1-.6l.4-.4c.1-.1.2-.3.2-.4.1-.2 0-.3 0-.5-.1-.1-.6-1.4-.8-2-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.2.3-.9.9-.9 2.1s1 2.5 1.1 2.6c.1.2 2 3.1 4.9 4.3.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.5-.1 1.6-.7 1.9-1.3.2-.6.2-1.1.2-1.2 0-.2-.2-.2-.5-.4z' />
            <path d='M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2z' />
        </svg>
    )
}

export function TagIcon({ className }: IconProps) {
    return (
        <svg
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth={2}
            strokeLinecap='round'
            strokeLinejoin='round'
            className={className}
        >
            <path d='M20.6 12.6 12.6 20.6a2 2 0 0 1-2.83 0l-7.4-7.4a2 2 0 0 1 0-2.83l8-8A2 2 0 0 1 11.8 2H18a2.7 2.7 0 0 1 2.7 2.7v6.2a2 2 0 0 1-.1.7z' />
            <circle cx='7.5' cy='7.5' r='1.5' fill='currentColor' stroke='none' />
        </svg>
    )
}

export function TrendingUpIcon({ className }: IconProps) {
    return (
        <svg
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth={2}
            strokeLinecap='round'
            strokeLinejoin='round'
            className={className}
        >
            <polyline points='23 6 13.5 15.5 8.5 10.5 1 18' />
            <polyline points='17 6 23 6 23 12' />
        </svg>
    )
}

export function LogOutIcon({ className }: IconProps) {
    return (
        <svg
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth={2}
            strokeLinecap='round'
            strokeLinejoin='round'
            className={className}
        >
            <path d='M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4' />
            <polyline points='16 17 21 12 16 7' />
            <line x1='21' y1='12' x2='9' y2='12' />
        </svg>
    )
}
