'use client'

import Fade from "@/app/ui/Fade";
import Notice, { NoticeProps } from "@/app/ui/notice";
import { resendEmail } from "@/lib/action/signup";
import { StatusCodes } from 'http-status-codes';
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import { Dispatch, memo, MouseEventHandler, MutableRefObject, SetStateAction, useCallback, useEffect, useRef, useState } from "react";
import { CiWarning } from "react-icons/ci";
import { LuShieldAlert } from "react-icons/lu";
import { TbFileSad } from "react-icons/tb";

const normalCountDown = 3
const longCountDown = 60
const noticeDuration = 3000

type NoticeLevel = 'info' | 'warn' | 'error'

type NoticeMeta = {
    level: NoticeLevel,
    header: string,
    message: string,
    show: boolean
    key: number,
}

type AppState = {
    countDown: number,
    noticeMetas: NoticeMeta[]
}

const initState: AppState = {
    countDown: 0,
    noticeMetas: [],
}

let globalNoticeKey = 0

export default function VerifyEmail({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
    // ensure that both 'email' and 'csrf' parameters are passed
    if (!searchParams.email || typeof searchParams.email !== 'string') {
        notFound()
    }
    if (!searchParams.csrf || typeof searchParams.csrf !== 'string') {
        notFound()
    }

    const email = searchParams.email
    const expire = searchParams.expired
    const duration = 2000 // 1 second
    const [appState, setAppState] = useState<AppState>(initState)
    const csrfRef = useRef(searchParams.csrf)
    const router = useRouter()
    const spanResendHandler = useCallback(() => {
        resendSpanHandler(email, appState, csrfRef, setAppState)
    }, [email, appState, csrfRef])
    const buttonResendHandler = useCallback(() => {
        resendButtonHandler(email, csrfRef.current, setAppState, router)
    }, [email, csrfRef, router])
    const removeNotice = useCallback((key: number) => {
        setTimeout(() => {
            setAppState(old => {
                return { ...old, noticeMetas: old.noticeMetas.filter(e => { e.key !== key }) }
            })
        }, 500)
    }, [])

    useEffect(() => {
        if (appState.countDown > 0) {
            setTimeout(() => {
                setAppState(old => ({ ...old, countDown: old.countDown - 1 }))
            }, 1000)
        }
    }, [appState.countDown])

    if (!expire) {
        return (
            <div>
                <div className="flex flex-col gap-y-5 absolute top-3 right-2">
                    {
                        appState.noticeMetas.map((meta) => {
                            return <FadingNotice key={meta.key} duration={duration} inProp={meta.show} noticeProps={getNoticeProps(meta)} onExited={() => removeNotice(meta.key)} />
                        })
                    }
                </div>
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
                        {checkEmailButton(email)}
                        <p className="text-sm mt-10 text-center">Didn&apos;t receive email?
                            <ResendSpan countDown={appState.countDown} handler={spanResendHandler} />
                        </p>
                    </div>
                </div>
            </div>
        )
    } else {
        return (
            <div className="relative ">
                <div className="flex flex-col gap-y-2 absolute top-3 right-2">
                    {
                        appState.noticeMetas.map((meta) => {
                            return <FadingNotice key={meta.key} duration={duration} inProp={meta.show} noticeProps={getNoticeProps(meta)} onExited={() => removeNotice(meta.key)} />
                        })
                    }
                </div>
                <div className="flex min-h-screen items-center justify-center bg-pnk-100">
                    <div className="rounded-lg px-16 py-14">
                        <div className="flex justify-center">
                            <div className="rounded-full bg-yellow-200 p-6">
                                <LuShieldAlert size={50} />
                            </div>
                        </div>
                        <h3 className="my-6 text-center text-3xl font-semibold text-gray-700">Caution</h3>
                        <p className="w-[420px] text-center font-normal text-gray-600">The link has expired, you can request resending an email to <span className="underline font-semibold">{email}</span> by clicking the button below</p>
                        <ResendBtn countDown={appState.countDown} handler={buttonResendHandler} />
                    </div>
                </div>
            </div>
        )
    }
}

// use memo to prevent unnecessary re-rendering of child component
const FadingNotice = memo(function FadingNotice({ inProp, duration, noticeProps, onExited }: { inProp: boolean, duration: number, noticeProps: NoticeProps, onExited: () => void }) {
    return (
        <Fade duration={duration} inProp={inProp} onExited={onExited} >
            <Notice props={noticeProps} />
        </Fade>
    )
})

// use memo to prevent unnecessary re-rendering of child component
const ResendSpan = memo(function ResendEmail({ countDown, handler }: { countDown: number, handler: MouseEventHandler }) {
    if (countDown > 0) {
        return <span className="text-gray-400 hover:cursor-not-allowed">Resend it ({countDown})</span>
    } else {
        return <span className="text-red-700 hover:cursor-pointer hover:text-red-900" onClick={handler}>Resend it</span>
    }
})

// use memo to prevent unnecessary re-rendering of child component
const ResendBtn = memo(function ResendBtn({ countDown, handler }: { countDown: number, handler: MouseEventHandler }) {
    if (countDown > 0) {
        return (<button className="mx-auto mt-8 block rounded-xl border-4 border-transparent bg-gray-400 px-6 py-3 text-center font-medium text-balck outline-8 hover:cursor-not-allowed"
            disabled={true}>Resend Email ({countDown})</button>)
    } else {
        return (<button className="mx-auto mt-8 block rounded-xl border-4 border-transparent bg-amber-200 px-6 py-3 text-center font-medium text-balck outline-8 hover:scale-110 transition duration-200 ease-in-out"
            onClick={handler} disabled={false}>Resend Email</button>)
    }
})

const resendSpanHandler = async (email: string, appState: AppState, csrfRef: MutableRefObject<string>, fn: Dispatch<SetStateAction<AppState>>) => {
    const resp = await resendEmail(email, csrfRef.current)
    if (resp.success) {
        csrfRef.current = resp?.csrf ? resp.csrf : ''
        fn(old => ({ ...old, canClickResendSpan: false, showNotice: true }))
    } else if (resp.errCode === StatusCodes.BAD_REQUEST) {
        // illegal request, redirect to error page
        notFound()
    } else {
        // backend service is temporarily unavailable now, wait longer
        fn(old => ({
            ...old, noticeQ: { type: 'error', header: 'Opps', message: 'Service unavailable now, please try again later' },
            canClickResendSpan: false,
            showNotice: true,
            countDown: longCountDown
        }))
    }
}

const resendButtonHandler = async (email: string, csrf: string, fn: Dispatch<SetStateAction<AppState>>, router: AppRouterInstance) => {
    const resp = await resendEmail(email, csrf)
    if (resp.success) {
        csrf = resp?.csrf ? resp.csrf : ''
        const uri = `/api/auth/callback?email=${email}&token=${encodeURIComponent(csrf)}`
        router.push(uri)
    } else if (resp.errCode === StatusCodes.BAD_REQUEST) {
        notFound()
    } else {
        const key = globalNoticeKey++
        const meta: NoticeMeta = {
            level: 'error', header: 'Opps', message: 'Service unavailable now, please try again later',
            show: true, key: key
        }
        fn(old => ({ ...old, countDown: longCountDown, noticeMetas: [...old.noticeMetas, meta] }))
        setTimeout(() => {
            fn(old => ({
                ...old, noticeMetas: old.noticeMetas.map(e => {
                    if (e.key === key) {
                        return { ...e, show: false }
                    } else {
                        return e
                    }
                })
            }))
        }, noticeDuration)
    }
}

const checkEmailButton = (email: string) => {
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

const getIcon = (level: NoticeLevel): React.ReactNode => {
    if (level === 'info') {
        return (
            <div className="px-2">
                <svg width="24" height="24" viewBox="0 0 1792 1792" fill="#44C997" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1299 813l-422 422q-19 19-45 19t-45-19l-294-294q-19-19-19-45t19-45l102-102q19-19 45-19t45 19l147 147 275-275q19-19 45-19t45 19l102 102q19 19 19 45t-19 45zm141 83q0-148-73-273t-198-198-273-73-273 73-198 198-73 273 73 273 198 198 273 73 273-73 198-198 73-273zm224 0q0 209-103 385.5t-279.5 279.5-385.5 103-385.5-103-279.5-279.5-103-385.5 103-385.5 279.5-279.5 385.5-103 385.5 103 279.5 279.5 103 385.5z" />
                </svg>
            </div>
        )
    }
    if (level === 'error') {
        return (
            <div className="px-2">
                <TbFileSad size={30} />
            </div>
        )
    }
    if (level === 'warn') {
        return (
            <div className="px-2">
                <CiWarning size={30} />
            </div>
        )
    }
}

const getNoticeProps = (meta: NoticeMeta): NoticeProps => {
    let theme = ''
    if (meta.level === 'info') {
        theme = 'rounded-lg bg-green-100 p-3 shadow-lg'
    } else if (meta.level === 'warn') {
        theme = 'rounded-lg bg-yellow-100 p-3 shadow-lg'
    } else {
        theme = 'rounded-lg bg-red-100 p-3 shadow-lg'
    }
    return {
        theme: theme,
        icon: getIcon(meta.level),
        header: meta.header,
        message: meta.message
    }
}