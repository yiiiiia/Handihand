'use client'

import { useFormStatus } from 'react-dom'

export default function SubmitButton({ theme, text, pendingText = 'Loading...' }: { theme: string, text: string, pendingText?: string }) {
    const { pending } = useFormStatus()
    return (<button type="submit" className={theme} aira-disabled={`${pending}`}>{pending ? pendingText : text}</button>)
}