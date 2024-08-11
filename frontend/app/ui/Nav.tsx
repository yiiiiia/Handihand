'use client'

import { PurgeInvalidSession } from '@/lib/action/signin';
import { Country } from '@/lib/db/entities';
import { SearchBy, selectSearchParams, setCountry, setKeyword, setSearchBy, useLazyGetVideosQuery } from '@/lib/features/searcher/searcher';
import { displayUploader, selectShowUploader } from '@/lib/features/uploader/uploaderSlice';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import '@uppy/core/dist/style.min.css';
import '@uppy/dashboard/dist/style.min.css';
import { Fzf } from 'fzf';
import Image from 'next/image';
import Link from 'next/link';
import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { BsCartPlusFill } from 'react-icons/bs';
import { FaUserCircle } from 'react-icons/fa';
import { GiHamburgerMenu } from 'react-icons/gi';
import { MdVideoLibrary } from 'react-icons/md';
import { RiSearch2Line } from 'react-icons/ri';
import { CountryContext } from '../CountryProvider';
import { SessionContext } from '../SessionProvider';
import BusyModal from './BusyModal';
import VideoUpload from './VideoUpload';

type Alert = {
    show: boolean,
    type?: 'signin' | 'complete_profile'
}

export default function Nav() {
    const dispatch = useAppDispatch()
    const showUploader = useAppSelector(selectShowUploader)
    const searchParams = useAppSelector(selectSearchParams)

    const session = useContext(SessionContext)
    const [fetchVideos] = useLazyGetVideosQuery()
    const [_, purgeSession] = useState(false)
    const [showDropList, setShowDropList] = useState(false)
    const [showAlert, setAlert] = useState<Alert>({ show: false })
    const [showSpinner, setShowSpinner] = useState(false)
    const [fuzzyCountries, setFuzzyCountries] = useState<Country[]>([])
    const menuDivRef = useRef<HTMLDivElement>(null)
    const countryInputRef = useRef<HTMLInputElement>(null)
    const keywordInputRef = useRef<HTMLInputElement>(null)
    const countryButtonAreaRef = useRef<HTMLButtonElement>(null)

    const countries = useContext(CountryContext)
    const countryMap: Record<string, Country> = useMemo(() => {
        let countryMap: Record<string, Country> = {}
        countries.forEach(country => {
            const lname = country.name.toLowerCase()
            countryMap[lname] = country
        })
        return countryMap
    }, [countries])

    const countryList: string[] = []
    countries.forEach(country => countryList.push(country.name))

    const getCategoryTheme = (catetory: string): string => {
        const base = "rounded-full hover:cursor-pointer px-5 py-2"
        if (catetory === searchParams.searchBy) {
            return base + " font-semibold"
        }
        return base + " text-gray-400 hover:text-gray-500 hover:bg-gray-200 hover:font-normal"
    }

    const eh = {
        switchSearchBy: (catetory: SearchBy): void => {
            if (catetory !== searchParams.searchBy) {
                dispatch(setSearchBy(catetory))
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

        onCountryChange: (e: React.ChangeEvent<HTMLInputElement>) => {
            const val = e.target.value
            const fzf = new Fzf(countryList)
            const entries = fzf.find(val)
            const items = entries.map(e => {
                const name = e.item.toLowerCase()
                return countryMap[name]
            })
            setFuzzyCountries(items)
            if (countryMap[val.toLowerCase()]) {
                const country = countryMap[val.toLowerCase()]
                dispatch(setCountry(country.code))
            }
        },

        onKeywordChange: (e: React.ChangeEvent<HTMLInputElement>) => {
            dispatch(setKeyword(e.target.value))
        },

        onCountryItemClicked: (countryCode: string, e: React.MouseEvent<HTMLAnchorElement>) => {
            const target = e.target as HTMLElement
            if (countryInputRef.current) {
                countryInputRef.current.value = target.innerText
            }
            setFuzzyCountries([])
            dispatch(setCountry(countryCode))
        },

        onSerach: () => {
            fetchVideos(searchParams)
        }
    }

    useEffect(() => {
        PurgeInvalidSession().then(res => {
            if (res) {
                purgeSession(true)
            }
        })
    }, [])

    useEffect(() => {
        const handleClickDocument = (e: MouseEvent) => {
            if (menuDivRef.current && e.target) {
                if (menuDivRef.current.contains(e.target as HTMLElement) && !showDropList) {
                    setShowDropList(true)
                } else if (!menuDivRef.current.contains(e.target as HTMLElement) && showDropList) {
                    setShowDropList(false)
                }
            }

            if (countryButtonAreaRef.current && e.target) {
                if (!countryButtonAreaRef.current.contains(e.target as HTMLHtmlElement)) {
                    setFuzzyCountries([])
                    if (countryInputRef.current) {
                        const val = countryInputRef.current.value
                        if (!countryMap[val.toLowerCase()]) {
                            countryInputRef.current.value = ''
                        }
                    }
                }
            }
        }

        document.addEventListener('click', handleClickDocument, true)
        return () => {
            document.removeEventListener('click', handleClickDocument, true);
        };
    }, [countryMap, showDropList])

    return (
        <div className=''>
            <nav id='nav' className="relative py-4">
                <Image src="/logo.png" width={180} height={180} alt="Logo" className='absolute top-4 left-0' />
                <div className='flex flex-col items-center'>
                    <div className='relative flex flex-row mt-2'>
                        <button className={getCategoryTheme('video')} onClick={() => { eh.switchSearchBy('video') }} >Videos</button>
                        <button className={getCategoryTheme('product')} onClick={() => { eh.switchSearchBy('product') }} >Products</button>
                    </div>
                    <div className="relative flex flex-row border rounded-full shadow-lg text-sm mt-2">
                        <button ref={countryButtonAreaRef} className='flex flex-col rounded-full hover:bg-gray-200 py-2 pl-8 w-72 relative'>
                            <label className=''>Where</label>
                            <div className='relative'>
                                <input ref={countryInputRef} type='text' placeholder="Search countries" className='focus:outline-none rounded-full bg-transparent py-1' onChange={eh.onCountryChange} />
                                {
                                    fuzzyCountries.length > 0 &&
                                    <div className='absolute top-0 left-0 transform translate-y-8 -translate-x-6 z-10 font-light max-h-[40rem] w-[17rem] bg-white overflow-auto rounded-xl'>
                                        {
                                            fuzzyCountries.map(country => {
                                                return <a key={country.code} href='#' className='block rounded-lg p-2 hover:bg-blue-200 hover:cursor-pointer text-left' onClick={(e) => eh.onCountryItemClicked(country.code, e)}>{country.name}</a>
                                            })
                                        }
                                    </div>
                                }
                            </div>
                        </button>
                        <button className='relative flex flex-col rounded-full hover:bg-gray-200 py-2 pl-8 w-72'>
                            <label className=''>What</label>
                            <input ref={keywordInputRef} type='text' placeholder="Search keywords" className='focus:outline-none rounded-full bg-transparent py-1' onChange={eh.onKeywordChange} />
                        </button>
                        <RiSearch2Line size={40} className='absolute right-3 top-3 rounded-full text-white bg-rose-500 py-2 hover:cursor-pointer hover:bg-rose-800' onClick={eh.onSerach} />
                    </div>
                </div>
                <div className='flex flex-row gap-x-4 justify-start items-center absolute top-4 right-4'>
                    <button className="flex flex-row items-center px-4 py-2 rounded-lg bg-rose-500" onClick={eh.openUploader}>
                        <MdVideoLibrary size={20} className='text-white' />
                        <span className="text-sm text-white pl-2">Upload</span>
                    </button>
                    <button className="flex flex-row items-center px-4 py-2 rounded-lg bg-rose-500">
                        <BsCartPlusFill size={20} className='text-white' />
                        <span className="text-sm text-white pl-2">Cart</span>
                    </button>
                    <div ref={menuDivRef} className="relative inline-block text-left ml-5">
                        <button className="relative flex flex-row gap-x-2 border-2 px-2 rounded-full items-center hover:shadow-md hover:cursor-pointer">
                            <GiHamburgerMenu size={18} />
                            {session ? <Image src={session?.profile?.photo ?? '/owl.jpg'} width={40} height={40} alt="Picture of Profile" className='rounded-full p-1' /> : <FaUserCircle size={35} className='p-1' />}
                        </button>
                        {
                            showDropList &&
                            <div className="absolute right-0 z-10 w-40 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none mt-2" tabIndex={-1}>
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
                        }
                    </div>
                </div>
            </nav>
            {
                showAlert.show && showAlert.type === 'signin' &&
                <div className="fixed left-0 top-0 flex h-full w-full items-center justify-center bg-black bg-opacity-70 py-10 z-10">
                    <div className="max-h-full max-w-7xl overflow-auto sm:rounded-2xl">
                        <div className='grid place-content-center bg-white w-[40rem] h-[30rem]'>
                            <div className="mb-8">
                                <h1 className="mb-4 text-3xl font-extrabold">You haven&apos;t logged in</h1>
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
                <div className="fixed left-0 top-0 flex h-full w-full items-center justify-center bg-black bg-opacity-70 py-10 z-10">
                    <div className="max-h-full max-w-7xl overflow-auto sm:rounded-2xl">
                        <div className='grid place-content-center bg-white w-[40rem] h-[30rem]'>
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
        </div>
    )
}