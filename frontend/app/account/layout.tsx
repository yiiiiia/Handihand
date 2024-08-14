'use client'

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useContext, useEffect, useRef, useState } from "react";
import { GiHamburgerMenu } from "react-icons/gi";
import { SessionContext } from '../SessionProvider';
import BusyModal from '../ui/BusyModal';

export default function AccountCenterLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    const sctx = useContext(SessionContext)
    const session = sctx?.session
    const [showDropList, setShowDropList] = useState(false)
    const [redirecting, setRedirecting] = useState(false)
    const router = useRouter()
    const rightCornerDivRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (rightCornerDivRef.current && e.target) {
                if (rightCornerDivRef.current.contains(e.target as HTMLElement)) {
                    if (!showDropList) {
                        setShowDropList(true)
                    }
                } else if (showDropList) {
                    setShowDropList(false)
                }
            }
        };
        document.addEventListener('click', handleClickOutside, true);
        return () => {
            document.removeEventListener('click', handleClickOutside, true);
        };
    }, [showDropList]);

    return (
        <div className="mx-auto h-dvh w-10/12 3xl:w-2/3">
            <div className="relative block h-24">
                <Image src="/logo.png" width={180} height={180} alt="Logo" className='absolute top-4 left-0 hover:cursor-pointer' onClick={() => { setRedirecting(true); router.push('/') }} />
                <div ref={rightCornerDivRef} className='flex flex-row gap-x-4 justify-start items-center absolute top-8 right-0'>
                    <div className="relative inline-block text-left ml-5">
                        <button className="relative flex flex-row gap-x-2 border-2 pl-4 pr-2 py-1 rounded-full items-center hover:shadow-md hover:cursor-pointer">
                            <GiHamburgerMenu size={18} />
                            <Image src={session?.profile?.photo ?? '/owl.jpg'} width={38} height={0} alt="Picture of Profile" className='rounded-full' />
                        </button>
                        {
                            showDropList &&
                            <div className="absolute right-0 z-10 w-40 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none mt-2 " tabIndex={-1}>
                                <div className="py-2">
                                    <a href="#" className="block px-4 py-2 text-base text-gray-700 hover:bg-stone-200" role="menuitem" tabIndex={-1} id="menu-item-1">Be a seller</a>
                                    <a href="/api/auth/signout" className="block px-4 py-2 text-base text-gray-700 hover:bg-stone-200" role="menuitem" tabIndex={-1} id="menu-item-2">Log out</a>
                                </div>
                            </div>
                        }
                    </div>
                </div>
            </div>
            <hr className='mt-2' />
            <div>
                {children}
            </div>
            {
                redirecting &&
                <BusyModal />
            }
        </div>
    )
}