'use client'

import Image from 'next/image';
import { selectSearchBy, toogleSearchBy } from '@/lib/features/search/searchSlice';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import classNames from 'classnames';
import { useSession } from 'next-auth/react';
import { MutableRefObject, ReactNode, useEffect, useRef, useState } from 'react';
import { BsCartPlusFill } from 'react-icons/bs';
import { FaUserCircle } from 'react-icons/fa';
import { GiHamburgerMenu } from 'react-icons/gi';
import { MdVideoLibrary } from 'react-icons/md';
import { RiSearch2Line } from 'react-icons/ri';

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
        <div className="justify-self-center flex flex-row text-lg">
            <button className={calClassName('video')} onClick={() => dispatch(toogleSearchBy())}>Videos</button>
            <button className={calClassName('product')} onClick={() => dispatch(toogleSearchBy())}>Products</button>
        </div>
    )
}

function UpperRightCorner() {
    const { data: session } = useSession()
    const user = session?.user
    const Avatar = () => {
        if (!user) {
            return (<span className="px-2"><FaUserCircle size={30} /></span>)
        } else {
            return (<span className="px-2"><Image src={user.image ?? '/owl.jpg'} width={35} height={35} alt="Picture of Profile" /></span>)
        }
    }
    const ref = useRef(null);
    return (
        <div ref={ref} className="relative inline-block text-left">
            <button className="flex flex-row border-2 px-3 py-1 rounded-full items-center hover:shadow-md">
                <GiHamburgerMenu size={30} />
                <Avatar />
            </button>
            <ListItems user={user} nodeRef={ref} />
        </div>
    )
}

function ListItems({ user, nodeRef }: { user: Object | null | undefined, nodeRef: MutableRefObject<any> }) {
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
        if (user === undefined) {
            return (
                <div className="py-2">
                    <a href="/api/auth/signin" className="block px-4 py-2 text-sm text-gray-700 hover:bg-stone-200" role="menuitem" tabIndex={-1} id="menu-item-0">Sign up / Log in</a>
                </div>
            )
        } else {
            return (
                <div className="py-2">
                    <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-stone-200" role="menuitem" tabIndex={-1} id="menu-item-0">Account</a>
                    <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-stone-200" role="menuitem" tabIndex={-1} id="menu-item-1">Be a seller</a>
                    <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-stone-200" role="menuitem" tabIndex={-1} id="menu-item-2">Log out</a>
                </div>
            )
        }
    }
    let className = (showDropList ? 'visible ' : 'invisible ') + "absolute right-0 z-10 mt-1 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
    return (
        <div className={className} tabIndex={-1}>
            {items()}
        </div>
    )
}

export default function Nav() {
    return (
        <nav className="flex flex-col px-20 py-5">
            <div className="grid grid-cols-3">
                <div className="">
                    <Image src="/airbnb-color.svg" width={30} height={30} alt="Logo" />
                </div>
                <CategoryBtn />
                <div className="justify-self-end flex flex-row gap-x-1">
                    <button className="flex flex-row gap-x-1 items-center px-4 rounded-lg bg-red-500">
                        <MdVideoLibrary size={18} />
                        <span className="text-sm text-white">Upload</span>
                    </button>
                    <button className="flex flex-row gap-x-1 items-center px-4 rounded-lg bg-red-500">
                        <BsCartPlusFill size={18} />
                        <span className="text-sm text-white">Cart</span>
                    </button>
                    <UpperRightCorner />
                </div>
            </div>
            <div className="self-center grid grid-cols-2 border rounded-full shadow-lg">
                <BgColorInput normalColor={'bg-white'} hoverColor={'bg-gray-200'} labelName={'Where'} hint='Search countries' />
                <BgColorInput normalColor={'bg-white'} hoverColor={'bg-gray-200'} labelName={'What'} hint='Search keyword' icon={<RiSearch2Line size={40} className='rounded-full text-white bg-red-500 px-2 py-2 hover:cursor-pointer' />} />
            </div>
        </nav>
    )
}