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
