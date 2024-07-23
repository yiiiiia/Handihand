'use client'

import { login } from '@/lib/action/login';
import Image from 'next/image';
import { useFormState } from 'react-dom';

export default function Login() {
    const [result, formAction] = useFormState(login, null)
    const showErr = (field: 'email' | 'password') => {
        return result?.[field]?.[0] && (
            <p className="text-red-500 mb-2 text-sm pl-2">
                {result[field][0]}
            </p>
        )
    }
    return (
        <div className="w-full min-h-screen bg-gray-50 flex flex-col sm:justify-center items-center pt-6 sm:pt-0">
            <div className="container w-full sm:max-w-md p-5 mx-auto">
                <h2 className="mb-12 text-center text-5xl font-extrabold">Welcome.</h2>
                <form action={formAction}>
                    <div className="mb-4">
                        <label className="block mb-1" htmlFor="email">Email</label>
                        <input id="email" required type="email" name="email" className="py-2 px-3 border border-gray-300 focus:border-red-300 focus:outline-none focus:ring focus:ring-red-200 focus:ring-opacity-50 rounded-md shadow-sm disabled:bg-gray-100 mt-1 block w-full" />
                        {showErr('email')}
                    </div>
                    <div className="mb-4">
                        <label className="block mb-1" htmlFor="password">Password</label>
                        <input id="password" required type="password" name="password" className="py-2 px-3 border border-gray-300 focus:border-red-300 focus:outline-none focus:ring focus:ring-red-200 focus:ring-opacity-50 rounded-md shadow-sm disabled:bg-gray-100 mt-1 block w-full" />
                        {showErr('password')}
                    </div>
                    <div className="mt-6 flex items-center justify-between">
                        <div className="flex items-center">
                            <input id="remember" type="checkbox" name="remember" className="border border-gray-300 text-red-600 shadow-sm focus:border-red-300 focus:ring focus:ring-red-200 focus:ring-opacity-50" />
                            <label htmlFor="remember" className="ml-2 block text-sm leading-5 text-gray-900"> Remember me </label>
                        </div>
                        <a href="#" className="text-sm"> Forgot your password? </a>
                    </div>
                    <div className="mt-6">
                        <button type="submit" className="w-full inline-flex items-center justify-center px-4 py-2 bg-red-600 border border-transparent rounded-md font-semibold capitalize text-white hover:bg-red-700 active:bg-red-700 focus:outline-none focus:border-red-700 focus:ring focus:ring-red-200 disabled:opacity-25 transition">Sign In</button>
                    </div>
                </form>
                <div className="mt-6 text-center">
                    <a href="/auth/register" className="underline">Do not have an account yet? Sign Up</a>
                </div>
                <hr className="mt-5 h-0 w-full bg-gray-500" />
                <div className='flex flex-row justify-center'>
                    <button className="mt-3 border-2 rounded-lg items-center justify-center inline-flex flex-row px-3 py-2 hover:bg-stone-100">
                        <Image src="/google.svg" width={30} height={30} alt="Google-Icon" />
                        <span className='grow font-semibold text-center px-2'>Sign in with Google</span>
                    </button>
                </div>
            </div>
        </div>
    )
}