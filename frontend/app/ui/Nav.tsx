'use client'

import { selectSearchBy, toogleSearchBy } from '@/lib/features/search/searchSlice';
import { displayUploader } from '@/lib/features/uploader/uploaderSlice';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import '@uppy/core/dist/style.min.css';
import '@uppy/dashboard/dist/style.min.css';
import classNames from 'classnames';
import Image from 'next/image';
import Link from 'next/link';
import { MutableRefObject, ReactNode, useContext, useEffect, useRef, useState } from 'react';
import { BsCartPlusFill } from 'react-icons/bs';
import { FaUserCircle } from 'react-icons/fa';
import { GiHamburgerMenu } from 'react-icons/gi';
import { MdVideoLibrary } from 'react-icons/md';
import { RiSearch2Line } from 'react-icons/ri';
import { SessionContext } from '../SessionProvider';
import Modal from './Modal';
import Uploader from './Uploader';
import Spinner from './Spinner';

function BgColorInput({ normalColor, hoverColor, labelName, hint, icon = undefined }: { normalColor: string, hoverColor: string, labelName: string, hint: string, icon?: ReactNode }) {
    const [bgColor, setBgColor] = useState(normalColor)
    const hoverColorEffect = () => {
        setBgColor(hoverColor)
    }
    const normalColorEffect = () => {
        setBgColor(normalColor)
    }
    return (
        <div className={'flex flex-row rounded-full px-4 py-1 ' + bgColor} onMouseOver={hoverColorEffect} onMouseOut={normalColorEffect}>
            <label className='text-sm hover:'>
                {labelName} <br />
                <input type='text' placeholder={hint} className={'focus:outline-none ' + bgColor}></input>
            </label>
            {!!icon && icon}
        </div>
    )
}

function CategoryBtn() {
    const searchBy = useAppSelector(selectSearchBy)
    const calClassName = (category: string) => {
        let cls = classNames('rounded-full', 'w-28', 'h-10', 'hover:cursor-pointer')
        if (category === searchBy) {
            cls = classNames(cls, 'font-semibold')
        } else {
            cls = classNames(cls, 'font-light', 'hover:bg-gray-200 hover:font-normal')
        }
        return cls
    }
    const dispatch = useAppDispatch()
    return (
        <div className="justify-self-center flex flex-row text-lg items-center">
            <button className={calClassName('video')} onClick={() => dispatch(toogleSearchBy())}>Videos</button>
            <button className={calClassName('product')} onClick={() => dispatch(toogleSearchBy())}>Products</button>
        </div>
    )
}

function UpperRightCorner() {
    const session = useContext(SessionContext)
    const ref = useRef(null);
    return (
        <div ref={ref} className="relative inline-block text-left ml-5">
            <button className="flex flex-row border-2 px-2 py-2 rounded-full items-center hover:shadow-md">
                <GiHamburgerMenu size={25} />
                <span className="px-2">
                    {session ? <Image src={session?.profile?.photo ?? '/owl.jpg'} width={35} height={35} alt="Picture of Profile" /> : <FaUserCircle size={30} />}
                </span>
            </button>
            <ListItems nodeRef={ref} />
        </div>
    )
}

function ListItems({ nodeRef }: { nodeRef: MutableRefObject<any> }) {
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
    const items = () => {
        if (!session) {
            return (
                <div className="py-2">
                    <a href="/auth/signin" className="block px-4 py-2 text-sm text-gray-700 hover:bg-stone-200" role="menuitem" tabIndex={-1} id="menu-item-0">Sign up / Log in</a>
                </div>
            )
        } else {
            return (
                <div className="py-2">
                    <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-stone-200" role="menuitem" tabIndex={-1} id="menu-item-0">My Account</a>
                    <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-stone-200" role="menuitem" tabIndex={-1} id="menu-item-1">Be a seller</a>
                    <a href="/api/auth/signout" className="block px-4 py-2 text-sm text-gray-700 hover:bg-stone-200" role="menuitem" tabIndex={-1} id="menu-item-2">Log out</a>
                </div>
            )
        }
    }
    let className = (showDropList ? 'visible ' : 'invisible ') + "absolute right-0 z-10 mt-1 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none mt-2"
    return (
        <div className={className} tabIndex={-1}>
            {items()}
        </div>
    )
}

function LoginNotice({ show, setVisibility }: { show: boolean, setVisibility: (a: boolean) => void }) {
    const [showSpinner, setShowSpinner] = useState(false)
    const cancel = () => {
        setVisibility(false)
    }
    if (show) {
        return (
            <>
                <Modal>
                    <div className="mb-8">
                        <h1 className="mb-4 text-3xl font-extrabold">You haven&apos;t logged in</h1>
                        <p className="text-gray-600">Log in to unlock most functionalities of the app</p>
                    </div>
                    <div className="space-y-4">
                        <Link href="/auth/signin">
                            <button className="p-3 bg-black rounded-full text-white w-full font-semibold" onClick={() => { setShowSpinner(true) }}>Log in</button>
                        </Link>
                        <button className="p-3 bg-white border rounded-full w-full font-semibold" onClick={cancel}>Skip for now</button>
                    </div>
                </Modal>
                {showSpinner && <Spinner />}
            </>
        )
    }
}

export default function Nav() {
    const session = useContext(SessionContext)
    const [showLoginNotice, setShowLoginNotice] = useState(false)
    const dispatch = useAppDispatch()
    const openUploader = () => {
        if (!session) {
            setShowLoginNotice(true)
            return
        }
        dispatch(displayUploader())
    }
    return (
        <>
            <nav className="flex flex-col px-12 py-5">
                <div className="grid grid-cols-3">
                    <div className="">
                        <Image src="/logo.svg" width={30} height={30} alt="Logo" />
                    </div>
                    <CategoryBtn />
                    <div className="justify-self-end flex flex-row">
                        <button className="flex flex-row items-center px-4 mx-2 my-2 rounded-lg bg-red-500" onClick={openUploader}>
                            <MdVideoLibrary size={24} />
                            <span className="text-sm text-white pl-2">Upload</span>
                        </button>
                        <button className="flex flex-row items-center px-4 mx-2 my-2 rounded-lg bg-red-500">
                            <BsCartPlusFill size={24} />
                            <span className="text-sm text-white pl-2">Cart</span>
                        </button>
                        <UpperRightCorner />
                    </div>
                </div>
                <div className="self-center grid grid-cols-2 border rounded-full shadow-lg">
                    <BgColorInput normalColor={'bg-white'} hoverColor={'bg-gray-200'} labelName={'Where'} hint='Search countries' />
                    <BgColorInput normalColor={'bg-white'} hoverColor={'bg-gray-200'} labelName={'What'} hint='Search keyword' icon={<RiSearch2Line size={40} className='rounded-full text-white bg-red-500 px-2 py-2 hover:cursor-pointer' />} />
                </div>
            </nav>
            <LoginNotice show={showLoginNotice} setVisibility={setShowLoginNotice} />
            <Uploader />
        </>
    )
}