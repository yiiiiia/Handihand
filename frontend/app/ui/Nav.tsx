'use client'

import { checkSessionConsistency } from '@/lib/action/signin';
import { Country } from '@/lib/db/entities';
import { displayUploader, selectShowUploader } from '@/lib/features/uploader/uploaderSlice';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import '@uppy/core/dist/style.min.css';
import '@uppy/dashboard/dist/style.min.css';
import { Fzf } from 'fzf';
import Image from 'next/image';
import Link from 'next/link';
import { MutableRefObject, useContext, useEffect, useRef, useState } from 'react';
import { BsCartPlusFill } from 'react-icons/bs';
import { FaUserCircle } from 'react-icons/fa';
import { GiHamburgerMenu } from 'react-icons/gi';
import { MdVideoLibrary } from 'react-icons/md';
import { RiSearch2Line } from 'react-icons/ri';
import { CountryContext } from '../CountryProvider';
import { SessionContext } from '../SessionProvider';
import BusyModal from './BusyModal';
import VideoUpload from './VideoUpload';
import axios from 'axios';
import { StatusCodes } from 'http-status-codes';
import { setVideos } from '@/lib/features/videos/videoSlice';

type Alert = {
    show: boolean,
    type?: 'signin' | 'complete_profile'
}

export default function Nav() {
    const dispatch = useAppDispatch()
    const showUploader = useAppSelector(selectShowUploader)
    const session = useContext(SessionContext)

    const [_, setSessionPruge] = useState(false)
    const [searchBy, setSearchBy] = useState('video')
    const [showAlert, setAlert] = useState<Alert>({ show: false })
    const [showSpinner, setShowSpinner] = useState(false)
    const [fuzzyCountries, setFuzzyCountries] = useState<Country[]>([])

    const upperRightCornerRef = useRef<HTMLDivElement>(null)
    const countryInputRef = useRef<HTMLInputElement>(null)
    const keywordInputRef = useRef<HTMLInputElement>(null)

    const countries = useContext(CountryContext)
    if (countries?.length == 0) {
        console.log("WARN: no countries fetched")
    }
    const countryList: string[] = []
    const countryMap: Record<string, Country> = {}
    countries?.forEach(item => {
        const lowercaseCountryName = item.name.toLowerCase()
        countryMap[lowercaseCountryName] = item
        countryList.push(item.name)
    })
    const fzf = new Fzf(countryList)

    const getCategoryTheme = (catetory: string): string => {
        const base = "rounded-full hover:cursor-pointer px-5 py-2"
        if (catetory === searchBy) {
            return base + " font-semibold"
        }
        return base + " text-gray-400 hover:text-gray-500 hover:bg-gray-200 hover:font-normal"
    }

    const eh = {
        switchSearchBy: (catetory: string): void => {
            if (catetory !== searchBy) {
                setSearchBy(catetory)
            }
        },

        openUploader: () => {
            if (!session) {
                setAlert({ show: true, type: 'signin' })
            } else if (!session.profile || !session.profile.countryCode) {
                setAlert({ show: true, type: 'complete_profile' })
            } else {
                dispatch(displayUploader())
            }
        },

        onCountrySearch: (e: React.ChangeEvent<HTMLInputElement>) => {
            const val = e.target.value
            const entries = fzf.find(val)
            const items = entries.map(e => {
                const name = e.item.toLowerCase()
                return countryMap[name]
            })
            setFuzzyCountries(items)
        },

        onCountryItemClicked: (e: React.MouseEvent<HTMLAnchorElement>) => {
            const ele = e.target as HTMLElement
            if (countryInputRef.current) {
                countryInputRef.current.value = ele.innerText
                setFuzzyCountries([])
            }
        },

        onSerach: () => {
            if (!countryInputRef.current || !keywordInputRef.current) {
                console.log('country input or keyword input reference missing')
                return
            }
            const countryName = countryInputRef.current.value
            const keyword = keywordInputRef.current.value
            const countryObj = countryMap[countryName.toLowerCase()]
            if (!countryObj) {
                console.log("unknown country:", countryName)
                return
            }

            axios.get('/api/video', {
                params: {
                    searchBy: searchBy,
                    countryCode: countryObj.code,
                    keyword: keyword,
                    page: 1,
                    size: 20
                }
            }).then(res => {
                if (res.status === StatusCodes.OK) {
                    if (res.data) {
                        dispatch(setVideos(res.data))
                    }
                }
            })
        }
    }

    useEffect(() => {
        checkSessionConsistency().then(purged => {
            if (purged) {
                setSessionPruge(true)
            }
        })
    }, [])

    return (
        <>
            <nav id='nav' className="relative py-4">
                <Image src="/logo.png" width={180} height={180} alt="Logo" className='absolute top-4 left-0' />
                <div className='flex flex-col items-center'>
                    <div className='relative flex flex-row mt-2'>
                        <button className={getCategoryTheme('video')} onClick={() => { eh.switchSearchBy('video') }} >Videos</button>
                        <button className={getCategoryTheme('product')} onClick={() => { eh.switchSearchBy('product') }} >Products</button>
                    </div>
                    <div className="relative flex flex-row border rounded-full shadow-lg text-sm mt-2">
                        <button className='flex flex-col rounded-full hover:bg-gray-200 py-2 pl-8 w-72 relative'>
                            <label className=''>Where</label>
                            <div className='relative'>
                                <input ref={countryInputRef} type='text' placeholder="Search countries" className='focus:outline-none rounded-full bg-transparent' onChange={eh.onCountrySearch} />
                                {
                                    fuzzyCountries.length > 0 &&
                                    <div className='absolute top-0 left-0 transform translate-y-8 -translate-x-6 z-10 font-light max-h-[40rem] w-[14rem] overflow-auto bg-neutral-50 rounded-sm py-2'>
                                        {
                                            fuzzyCountries.map(country => {
                                                return <a key={country.code} href='#' className='block rounded-lg hover:bg-blue-200 hover:cursor-pointer' onClick={eh.onCountryItemClicked}>{country.name}</a>
                                            })
                                        }
                                    </div>
                                }
                            </div>
                        </button>
                        <button className='relative flex flex-col rounded-full hover:bg-gray-200 py-2 pl-8 w-72'>
                            <label className=''>What</label>
                            <input ref={keywordInputRef} type='text' placeholder="Search keywords" className='focus:outline-none rounded-full bg-transparent' />
                        </button>
                        <RiSearch2Line size={40} className='absolute right-2 top-2 rounded-full text-white bg-rose-500 py-2 hover:cursor-pointer hover:bg-rose-800' onClick={eh.onSerach} />
                    </div>
                </div>
                <div className='flex flex-row gap-x-4 justify-start items-center absolute top-4 right-4'>
                    <button className="flex flex-row items-center px-4 py-2 rounded-lg bg-rose-500" onClick={eh.openUploader}>
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
                            {session ? <Image src={session?.profile?.photo ?? '/owl.jpg'} width={40} height={40} alt="Picture of Profile" className='rounded-full p-1' /> : <FaUserCircle size={30} className='p-1' />}
                        </button>
                        <DropList nodeRef={upperRightCornerRef} />
                    </div>
                </div>
            </nav>
            {
                showAlert.show && showAlert.type === 'signin' &&
                <div className="fixed left-0 top-0 flex h-full w-full items-center justify-center bg-black bg-opacity-70 py-10">
                    <div className="max-h-full max-w-7xl overflow-auto sm:rounded-2xl">
                        <div className='grid place-content-center bg-white w-[30rem] h-[24rem]'>
                            <div className="mb-8">
                                <h1 className="mb-4 text-3xl font-extrabold">You haven&apos;t logged in</h1>
                                <p className="text-gray-600">Log in to enjoy most of the app</p>
                            </div>
                            <div className="space-y-4">
                                <Link href="/auth/signin">
                                    <button className="p-3 bg-black rounded-full text-white w-full font-semibold" onClick={() => { setShowSpinner(true) }}>Log in</button>
                                </Link>
                                <button className="p-3 bg-gray-200 border rounded-full w-full font-semibold" onClick={() => { setAlert({ show: false }) }}>Skip for now</button>
                            </div>
                        </div>
                    </div>
                </div>
            }
            {
                showAlert.show && showAlert.type === 'complete_profile' &&
                <div className="fixed left-0 top-0 flex h-full w-full items-center justify-center bg-black bg-opacity-70 py-10">
                    <div className="max-h-full max-w-7xl overflow-auto sm:rounded-2xl">
                        <div className='grid place-content-center bg-white p-20'>
                            <div className="mb-8">
                                <h1 className="mb-4 text-3xl font-extrabold">You have incomplete profile</h1>
                                <p className="text-gray-600">Please update your country information before uploading a video</p>
                            </div>
                            <div className="space-y-4">
                                <Link href="/account/profile">
                                    <button className="p-3 bg-black rounded-full text-white w-full font-semibold" onClick={() => { setShowSpinner(true) }}>To my profile</button>
                                </Link>
                                <button className="p-3 bg-gray-200 border rounded-full w-full font-semibold" onClick={() => { setAlert({ show: false }) }}>Skip for now</button>
                            </div>
                        </div>
                    </div>
                </div>
            }
            {
                showSpinner &&
                <BusyModal />
            }
            {
                showUploader &&
                <VideoUpload />
            }
        </>
    )
}

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
