'use client'

import { checkSessionConsistency } from '@/lib/action/signin';
import { selectSearchBy, toogleSearchBy } from '@/lib/features/search/searchSlice';
import { displayUploader } from '@/lib/features/uploader/uploaderSlice';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import '@uppy/core/dist/style.min.css';
import '@uppy/dashboard/dist/style.min.css';
import Image from 'next/image';
import Link from 'next/link';
import { MutableRefObject, useContext, useEffect, useRef, useState } from 'react';
import { BsCartPlusFill } from 'react-icons/bs';
import { FaUserCircle } from 'react-icons/fa';
import { GiHamburgerMenu } from 'react-icons/gi';
import { MdVideoLibrary } from 'react-icons/md';
import { RiSearch2Line } from 'react-icons/ri';
import { SessionContext } from '../SessionProvider';
import BusyModal from './BusyModal';
import Modal from './Modal';
import Uploader from './Uploader';

function DropList({ nodeRef }: { nodeRef: MutableRefObject<any> }) {
    const session = useContext(SessionContext)
    const [showDropList, setShowDropList] = useState(false)
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (nodeRef.current && !nodeRef.current.contains(event.target)) {
                setShowDropList(false)
            } else {
                setShowDropList(true)
            }
        };
        document.addEventListener('click', handleClickOutside, true);
        return () => {
            document.removeEventListener('click', handleClickOutside, true);
        };
    }, [nodeRef]);
    return (
        <div className={"absolute right-0 z-10 w-40 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none mt-2 " + (showDropList ? 'visible ' : 'invisible ')} tabIndex={-1}>
            {
                !session &&
                <div className="py-2">
                    <a href="/auth/signin" className="block px-4 py-2 text-sm text-gray-700 hover:bg-stone-200" role="menuitem" tabIndex={-1} id="menu-item-0">Sign up / Log in</a>
                </div>
            }
            {
                session &&
                <div className="py-2">
                    <a href="/account/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-stone-200" role="menuitem" tabIndex={-1} id="menu-item-0">Account</a>
                    <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-stone-200" role="menuitem" tabIndex={-1} id="menu-item-1">Be a seller</a>
                    <a href="/api/auth/signout" className="block px-4 py-2 text-sm text-gray-700 hover:bg-stone-200" role="menuitem" tabIndex={-1} id="menu-item-2">Log out</a>
                </div>
            }
        </div>
    )
}

type Alert = {
    show: boolean,
    type?: 'signin' | 'complete_profile'
}

export default function Nav() {
    const [_, setHasInvalidSession] = useState(false)
    const [showAlert, setAlert] = useState<Alert>({ show: false })
    const [showSpinner, setShowSpinner] = useState(false)
    const upperRightCornerRef = useRef<HTMLDivElement>(null)

    const dispatch = useAppDispatch()
    const searchBy = useAppSelector(selectSearchBy)
    const session = useContext(SessionContext)

    const getCategoryTheme = (catetory: string): string => {
        const base = "rounded-full hover:cursor-pointer px-5 py-2"
        if (catetory === searchBy) {
            return base + " font-semibold"
        }
        return base + " text-gray-400 hover:text-gray-500 hover:bg-gray-200 hover:font-normal"
    }
    const switchSearchBy = (catetory: string): void => {
        if (catetory !== searchBy) {
            dispatch(toogleSearchBy())
        }
    }
    const openUploader = () => {
        if (!session) {
            setAlert({ show: true, type: 'signin' })
        } else {
            dispatch(displayUploader())
        }
    }

    useEffect(() => {
        checkSessionConsistency().then(purged => {
            if (purged) {
                setHasInvalidSession(true)
            }
        })
    }, [])

    return (
        <>
            <nav id='nav' className="relative py-4">
                <Image src="/logo.png" width={180} height={180} alt="Logo" className='absolute top-4 left-0' />
                <div className='flex flex-col items-center'>
                    <div className='relative flex flex-row mt-2'>
                        <button className={getCategoryTheme('video')} onClick={() => { switchSearchBy('video') }} >Videos</button>
                        <button className={getCategoryTheme('product')} onClick={() => { switchSearchBy('product') }} >Products</button>
                    </div>
                    <div className="relative flex flex-row border rounded-full shadow-lg text-sm mt-2">
                        <button className='flex flex-col rounded-full hover:bg-gray-200 py-2 pl-8 w-72'>
                            <label className=''>Where</label>
                            <input type='text' placeholder="Search countries" className='focus:outline-none rounded-full bg-transparent' />
                        </button>
                        <button className='relative flex flex-col rounded-full hover:bg-gray-200 py-2 pl-8 w-72'>
                            <label className=''>What</label>
                            <input type='text' placeholder="Search keywords" className='focus:outline-none rounded-full bg-transparent' />
                        </button>
                        <RiSearch2Line size={40} className='absolute right-2 top-2 rounded-full text-white bg-rose-500 py-2 hover:cursor-pointer hover:bg-rose-800' />
                    </div>
                </div>
                <div className='flex flex-row gap-x-4 justify-start items-center absolute top-4 right-4'>
                    <button className="flex flex-row items-center px-4 py-2 rounded-lg bg-rose-500" onClick={openUploader}>
                        <MdVideoLibrary size={24} />
                        <span className="text-sm text-white pl-2">Upload</span>
                    </button>
                    <button className="flex flex-row items-center px-4 py-2 rounded-lg bg-rose-500">
                        <BsCartPlusFill size={24} />
                        <span className="text-sm text-white pl-2">Cart</span>
                    </button>
                    <div ref={upperRightCornerRef} className="relative inline-block text-left ml-5">
                        <button className="relative flex flex-row gap-x-2 border-2 px-2 rounded-full items-center hover:shadow-md hover:cursor-pointer">
                            <GiHamburgerMenu size={18} />
                            {session ? <Image src={session?.profile?.photo ?? '/owl.jpg'} width={40} height={40} alt="Picture of Profile" className='rounded-full' /> : <FaUserCircle size={30} className='m-1' />}
                        </button>
                        <DropList nodeRef={upperRightCornerRef} />
                    </div>
                </div>
            </nav>
            {
                showAlert.show && showAlert.type === 'signin' &&
                <Modal>
                    <div className="mb-8">
                        <h1 className="mb-4 text-3xl font-extrabold">You haven&apos;t logged in</h1>
                        <p className="text-gray-600">Log in to enjoy most of the app</p>
                    </div>
                    <div className="space-y-4">
                        <Link href="/auth/signin">
                            <button className="p-3 bg-black rounded-full text-white w-full font-semibold" onClick={() => { setShowSpinner(true) }}>Log in</button>
                        </Link>
                        <button className="p-3 bg-white border rounded-full w-full font-semibold" onClick={() => { setAlert({ show: false }) }}>Skip for now</button>
                    </div>
                </Modal>
            }
            {
                showSpinner &&
                <BusyModal />
            }
            <Uploader />
        </>
    )
}