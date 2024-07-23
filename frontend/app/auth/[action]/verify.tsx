'use client'

import Fade from "@/app/ui/Fade";
import Notice from "@/app/ui/notice";
import Link from "next/link";
import { redirect } from "next/navigation";
import { memo, MouseEventHandler, useCallback, useEffect, useState } from "react";
import Countdown from 'react-countdown'

const RESEND_WAIT = 5 * 1000
const NOTICE_DURATION = 3000
const FADING_DURATION = 1000

const trackButton = (email: string) => {
    let url
    if (email.endsWith('gmail.com')) {
        url = 'https://mail.google.com/mail'
    }
    if (email.endsWith('yahoo.com')) {
        url = 'https://login.yahoo.com'
    }
    if (url) {
        return <button className="mx-auto mt-8 block rounded-xl border-4 border-transparent bg-red-600 px-6 py-3 text-center font-medium
         text-white outline-8 hover:scale-110 transition duration-200 ease-in-out"><Link href={url}>Check Email</Link></button>
    }
}

export default function VerifyEmail({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
    console.log('rendered!!!')
    if (!searchParams.email || typeof searchParams.email !== 'string') {
        redirect('/error')
    }

    const [state, setState] = useState({ canResend: true, showNotice: false })
    const email = searchParams.email
    const expire = searchParams.expired
    const resendEmail = useCallback(() => {
        setState({ canResend: false, showNotice: true })
        setTimeout(() => {
            setState(old => ({ ...old, showNotice: false }))
        }, NOTICE_DURATION)
        setTimeout(() => {
            setState(old => ({ ...old, canResend: true }))
        }, RESEND_WAIT)
    }, [])

    if (!expire) {
        return (
            <div className="relative ">
                <FadingNotice duration={FADING_DURATION} inProp={state.showNotice} />
                <div className="flex min-h-screen items-center justify-center bg-pnk-100">
                    <div className="rounded-lg px-16 py-14">
                        <div className="flex justify-center">
                            <div className="rounded-full bg-green-200 p-6">
                                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500 p-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-8 w-8 text-white">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                        <h3 className="my-6 text-center text-3xl font-semibold text-gray-700">Congratuation!!!</h3>
                        <p className="w-[280px] text-center font-normal text-gray-600">A verification email has been sent to <span className="underline font-semibold">{email}</span></p>
                        {trackButton(email)}
                        <p className="text-sm mt-10 text-center">Didn't receive email? <ResendEmail canResend={state.canResend} callback={resendEmail} /> </p>
                    </div>
                </div>
            </div>
        )
    } else {

    }
}

const FadingNotice = memo(function FadingNotice({ inProp, duration }: { inProp: boolean, duration: number }) {
    return (
        <Fade duration={duration} inProp={inProp} >
            <Notice classes="rounded-lg bg-green-100 p-3 shadow-lg absolute top-3 right-2 animate-dropin" />
        </Fade>
    )
})

const ResendEmail = memo(function ResendEmail({ canResend, callback }: { canResend: boolean, callback: MouseEventHandler }) {
    const renderer = ({ seconds, completed }: { seconds: number, completed: boolean }) => {
        if (completed) {
            return <span className="text-red-700 hover:cursor-pointer hover:text-red-900" onClick={callback}>Resend it</span>;
        } else {
            // Render a countdown
            return <span className="text-gray-400 hover:cursor-not-allowed">Resend it ({seconds})</span>
        }
    };
    if (canResend) {
        return <span className="text-red-700 hover:cursor-pointer hover:text-red-900" onClick={callback}>Resend it</span>
    }
    return <Countdown date={Date.now() + RESEND_WAIT} renderer={renderer} />
}) 