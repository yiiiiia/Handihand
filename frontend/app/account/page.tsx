'use client'

import Image from 'next/image';
import Link from "next/link";
import { useContext } from "react";
import { LuDot } from "react-icons/lu";
import { MdVideoSettings } from "react-icons/md";
import { SessionContext } from "../SessionProvider";

export default function Page() {
    const sctx = useContext(SessionContext)
    const session = sctx?.session
    return (
        <div className="flex flex-col w-4/5 mx-auto">
            <div className="flex flex-col mt-8">
                <h1 className="text-3xl">Account</h1>
                <p className="mt-4 text-lg">
                    <span className="font-semibold">{session?.profile?.username}</span>,
                    <span className="font-light pl-3">{session?.account?.identityValue}</span>
                    <LuDot className="inline" />
                    <span className="font-semibold underline underline-offset-2"><Link href="/account/profile">Go to profile</Link></span>
                </p>
            </div>
            <div className="grid grid-cols-3 gap-4 py-4">
                <div className="flex flex-col rounded-xl shadow-xl p-4 border-t">
                    <MdVideoSettings size={30} className="h-24" />
                    <h3 className="font-semibold">My Videos</h3>
                    <p className="pt-4 font-light">You can manage all your uploaded videos here</p>
                </div>
                <div className="flex flex-col rounded-xl shadow-xl p-4 border-t">
                    <div className="h-24 flex flex-col justify-center">
                        <Image src="/buyer.png" height={40} width={40} alt="merchant" className="" />
                    </div>
                    <h3 className="font-semibold">As a Buyer</h3>
                    <p className="pt-4 font-light">You can manage all your orders here</p>
                </div>
                <div className="flex flex-col rounded-xl shadow-xl p-4 border-t">
                    <div className="h-24 flex flex-col justify-center">
                        <Image src="/cashier.png" height={40} width={40} alt="merchant" className="" />
                    </div>
                    <h3 className="font-semibold">As a Seller</h3>
                    <p className="pt-4 font-light">You can manage all your products here</p>
                </div>
            </div>
        </div>
    )
}