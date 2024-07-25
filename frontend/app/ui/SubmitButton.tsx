'use client'

import { useFormStatus } from 'react-dom'

export default function SubmitButton({ theme, text }: { theme: string, text: string }) {
    const { pending } = useFormStatus()
    return (<button type="submit" className={theme} aira-disabled={`${pending}`}>{text}</button>)
}