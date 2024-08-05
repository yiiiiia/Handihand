'use client'

import SubmitButton from "@/app/ui/SubmitButton"
import { signup } from "@/lib/action/signup"
import Link from "next/link"
import { useRef } from "react"
import { useFormState } from "react-dom"

export default function Signup() {
    const [signupState, action] = useFormState(signup, null)
    const email = useRef<string>('')

    return (
        <div className="grid place-content-center h-screen w-screen">
            <form action={action}>
                <fieldset disabled={signupState?.ok} className="flex flex-col gap-y-10 p-2">
                    <div className="relative">
                        <label htmlFor="username" className="block">User Name</label>
                        <input required id="username" name="username" className='border rounded-md w-full h-10 px-2'></input>
                        {signupState?.error?.username?.[0] && <p className='text-sm ml-2 text-red-500 absolute -bottom-7'>{signupState?.error?.username?.[0]}</p>}
                        {signupState?.error?.usernameTaken && <p className='text-sm ml-2 text-red-500 absolute -bottom-7'>The username is already taken</p>}
                    </div>
                    <div className="relative">
                        <label htmlFor="email" className="block">Email</label>
                        <input required id="email" name="email" type="email" className='border rounded-md w-full h-10 px-2' onChange={e => { email.current = e.target.value }}></input>
                        {signupState?.error?.email?.[0] && <p className='text-sm ml-2 text-red-500 absolute -bottom-7'>{signupState?.error?.email?.[0]}</p>}
                        {signupState?.error?.emailAlreadyExist && <p className='text-sm ml-2 text-red-500 absolute -bottom-7'>This email is already registered</p>}
                    </div>
                    <div className="relative">
                        <label htmlFor="password" className="block">Password</label>
                        <input required id="password" name="password" type="password" className='border rounded-md w-full h-10 px-2'></input>
                        {signupState?.error?.password?.[0] && <p className='text-sm ml-2 text-red-500 absolute -bottom-7'>{signupState?.error?.password?.[0]}</p>}
                    </div>
                    <div className="relative">
                        <label htmlFor="confirmPassword" className="block">Confirm Password</label>
                        <input required id="confirmPassword" name="confirmPassword" type="password" className='border rounded-md w-full h-10 px-2'></input>
                        {signupState?.error?.confirmPassword?.[0] && <p className='text-sm ml-2 text-red-500 absolute -bottom-7'>{signupState?.error?.confirmPassword?.[0]}</p>}
                    </div>
                    <div className="mt-4 relative">
                        <input required id="policy" type="checkbox" name="policy" />
                        <label htmlFor="policy" className="text-[14px] ml-4">I agree to the <a href="#" className='text-red-600'>terms of service</a> and <a href="#" className='text-red-600'>privacy policy</a></label>
                        {signupState?.error?.policy?.[0] && <p className='text-sm ml-2 text-red-500 absolute -bottom-7'>{signupState?.error?.policy?.[0]}</p>}
                    </div>
                    <SubmitButton theme='mt-6 p-2 w-full rounded-md text-center text-lg bg-red-600 text-white' text='Join' pendingText='Loading...' />
                </fieldset>
            </form>
            <div className="absolute bottom-0 left-1/2 transform -translate-y-16 -translate-x-1/2 text-center w-1/4">
                <hr className="border-gray-300 w-full mt-10" />
                <p className='mt-10'>Already have an account? <Link href={"/auth/signin"} className='text-red-600 hover:cursor-pointer'>Log In</Link></p>
            </div>
        </div>
    )
}