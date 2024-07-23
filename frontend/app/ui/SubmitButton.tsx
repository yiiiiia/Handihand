'use client'

import { useFormStatus } from 'react-dom'

export default function SubmitButton({ classes, text }: { classes: string, text: string }) {
    const { pending } = useFormStatus()
    return (<button type="submit" className={classes} aria-disabled={pending}>{text}</button>)
}