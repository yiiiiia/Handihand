'use client'

import { resendEmail } from "@/lib/action/signup";
import Link from "next/link";
import { notFound } from "next/navigation";
import { useEffect, useState } from "react";
import { IoCheckmark } from "react-icons/io5";
import { LuShieldAlert } from "react-icons/lu";

export default function VerifyEmail({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
    const expired = searchParams['expired']
    const paramEmail = searchParams['email'] as string
    if (!paramEmail.trim()) {
        notFound()
    }

    const email = paramEmail.trim()
    const [cooldown, setCooldown] = useState(0)
    const [resendProcessing, setResendProcessing] = useState(false)
    const cooldownTime = 30 // in second

    const emailResendHandler = async () => {
        if (resendProcessing) {
            return
        }
        setResendProcessing(true)
        await resendEmail(email)
        setCooldown(cooldownTime)
        setResendProcessing(false)
    }

    const resendClickable = () => {
        if (cooldown === 0) {
            return <span className="text-red-700 hover:cursor-pointer text-base" onClick={emailResendHandler}>Resend</span>
        }
        return <span className="text-gray-600 hover:cursor-not-allowed text-base">Resend ({cooldown})</span>
    }

    useEffect(() => {
        if (cooldown > 0) {
            setTimeout(() => {
                setCooldown(cur => cur - 1)
            }, 1000)
        }
    }, [cooldown])
    return (
        <div className="grid h-screen w-screen place-content-center">
            <div className="">
                {
                    expired &&
                    <div className="flex flex-col gap-y-5 items-center w-full text-xl">
                        <LuShieldAlert size={100} className="rounded-full bg-yellow-200 m-16 p-4" />
                        <h1 className="font-semibold text-2xl">The link has expired</h1>
                        <p className="">You can request resending an email to <Link href={getEmailUrl(email)} className="underline underline-offset-2 text-red-700 hover:cursor-pointer">{email}</Link> by clicking the text below</p>
                        {resendClickable()}
                    </div>
                }
                {
                    !expired &&
                    <div className="flex flex-col gap-y-5 items-center w-full text-xl">
                        <IoCheckmark size={100} className="rounded-full bg-green-400 m-16 p-4" />
                        <p className="">A verification email has been sent to <Link href={getEmailUrl(email)} className="underline underline-offset-2 text-red-700 hover:cursor-pointer">{email},</Link></p>
                        <p className="">please log in your email and verify.</p>
                        <p className="text-base mt-10">Didn&apos;t receive email? {resendClickable()}</p>
                    </div>
                }
            </div>
        </div>
    )
}

function getEmailUrl(email: string): string {
    if (email.endsWith('gmail.com')) {
        return 'https://mail.google.com/mail'
    }
    if (email.endsWith('yahoo.com')) {
        return 'https://login.yahoo.com'
    }
    return '#'
}