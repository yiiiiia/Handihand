'use client'

import BusyModal from '@/app/ui/BusyModal';
import SubmitButton from '@/app/ui/SubmitButton';
import { signinByEmail, googleOAuthSignin } from '@/lib/action/signin';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { useFormState } from 'react-dom';
import { FaRegUser } from "react-icons/fa";
import { TiArrowBack } from "react-icons/ti";

const undecided = 'undecided'
const byEmail = "byEmail"

export default function Signin() {
    const [loginBy, setLoginBy] = useState(undecided)
    const [loading, setLoading] = useState(false)
    const [signinState, action] = useFormState(signinByEmail, null)

    function Main() {
        if (loginBy === undecided) {
            return (
                <div className='flex flex-col gap-y-4 font-semibold'>
                    <button className='relative w-80 h-14 p-4 border shadow-lg rounded-xl text-center text-base' onClick={() => setLoginBy(byEmail)}>
                        <FaRegUser className="absolute top-1/2 transform -translate-y-1/2" size={30} />Use email
                    </button>
                    <button className="relative w-80 h-14 p-4 border shadow-lg rounded-xl text-center text-base" onClick={() => { setLoading(true); googleOAuthSignin() }}>
                        <Image src="/google.svg" width={30} height={30} alt="Google-Icon" className="absolute top-1/2 transform -translate-y-1/2" />Log in with Google
                    </button>
                </div>
            )
        }
        return (
            <form action={action} className="relative flex flex-col justify-center gap-y-8 p-2 mt-16">
                <div className='relative'>
                    <label htmlFor='email' className='block'>Email</label>
                    <input id='email' required type="email" name="email" className='border rounded-md w-full h-10 px-2' ></input>
                    {signinState?.error?.email && <p className='text-sm ml-2 text-red-500 absolute -bottom-7'>{signinState.error.email}</p>}
                </div>
                <div className='relative'>
                    <label htmlFor='password' className='block'>Password</label>
                    <input id='password' required name="password" type="password" className='border rounded-md w-full h-10 px-2' ></input>
                    {signinState?.error?.password && <p className='text-sm ml-2 text-red-500 absolute -bottom-7'>{signinState.error.password}</p>}
                </div>
                <div className="mt-10 relative">
                    <input id="policy" required type="checkbox" name="policy" />
                    <label htmlFor="policy" className="text-[14px] ml-4">I agree to the <a href="#" className='text-blue-600'>terms of service</a> and <a href="#" className='text-blue-500'>privacy policy</a></label>
                    {signinState?.error?.policy && <p className='text-sm ml-2 text-red-500 absolute -bottom-7'>{signinState.error.policy}</p>}
                </div>
                <SubmitButton theme='mt-8 p-2 w-full rounded-md text-center text-lg bg-red-600 text-white' text='Log in' pendingText='Processing...' />
                <TiArrowBack className='absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 hover:cursor-pointer hover:scale-150' size={20} onClick={() => { setLoginBy(undecided); }} />
            </form>
        )
    }

    return (
        <>
            <div className='relative grid place-content-center h-screen w-screen'>
                <Main />
                <div className="absolute bottom-0 left-1/2 transform -translate-y-36 -translate-x-1/2 text-center w-1/4">
                    <hr className="border-gray-300 w-full mt-10" />
                    <p className='mt-10'>Don&apos;t have an account? <Link href={"/auth/signup"} className='text-red-600 hover:cursor-pointer'>Sign up</Link></p>
                </div>
            </div>
            {loading && <BusyModal />}
        </>
    )
}
