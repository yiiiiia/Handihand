'use client'

import { CountryContext } from "@/app/CountryProvider";
import { SessionContext } from "@/app/SessionProvider";
import ImageUpload from "@/app/ui/ImageUpload";
import SubmitButton from "@/app/ui/SubmitButton";
import { Nullable } from "@/lib/db/entities";
import { Fzf } from 'fzf';
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChangeEvent, ChangeEventHandler, FocusEventHandler, MouseEvent, RefObject, useContext, useEffect, useRef, useState } from "react";
import { CiEdit } from "react-icons/ci";
import { GoCheck } from "react-icons/go";
import { RxCross2 } from "react-icons/rx";

export default function ProfilePage() {
    const route = useRouter()
    const session = useContext(SessionContext)
    if (!session) {
        route.push('/error')
    }
    const countries = useContext(CountryContext)
    if (!countries || countries.length === 0) {
        route.push('/error')
    }
    const countryList: string[] = []
    const countryMap: Record<string, string> = {}
    countries?.forEach(item => {
        const countryName = item.name.toLowerCase()
        countryMap[countryName] = item.code
        countryList.push(item.name)
    })
    const fzf = new Fzf(countryList)

    const [editing, setEditing] = useState(true)
    const [dataUrl, setDataUrl] = useState<string>('')
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [showFuzzyFinding, setShowFuzzyFinding] = useState(false)
    const [fuzzyCountries, setFuzzyCountries] = useState<string[]>([])

    const fileInputRef = useRef<HTMLInputElement>(null)
    const countryInputRef = useRef<HTMLInputElement>(null)
    const countryDivNodeRef = useRef<HTMLDivElement>(null)

    function getImageURL(): string {
        if (dataUrl) {
            return dataUrl
        }
        if (session?.profile?.photo) {
            return session.profile.photo
        }
        return '/owl.jpg'
    }

    function isEmailVerified() {
        if (session?.account?.state === 'verified') {
            return <GoCheck className="inline-block mx-4 text-green-500" />
        }
        return <RxCross2 className="inline-block mx-4 text-red-500" />
    }

    function fileOnChange(e: React.ChangeEvent<HTMLInputElement>) {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0])
            e.target.value = ''
        }
    }

    function onCountryInputChange(e: ChangeEvent<HTMLInputElement>) {
        const value = e.target.value
        const entries = fzf.find(value)
        const items = entries.map(e => e.item)
        setFuzzyCountries(items)
    }

    function onCountryInputFocus() {
        if (!showFuzzyFinding) {
            setShowFuzzyFinding(true)
        }
    }

    function onCountryInputBlur() {
        if (showFuzzyFinding) {
            // setShowFuzzyFinding(false)
        }
    }

    function onCountryItemClick(e: MouseEvent<HTMLAnchorElement>) {
        const ele = e.target as HTMLElement
        if (countryInputRef.current) {
            countryInputRef.current.value = ele.innerText
        }
        setShowFuzzyFinding(false)
    }

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (countryDivNodeRef.current && event.target) {
                if (!countryDivNodeRef.current.contains(event.target as HTMLElement) && showFuzzyFinding) {
                    setShowFuzzyFinding(false)
                }
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, [countryDivNodeRef.current]);

    if (!editing) {
        return (
            <div className="flex flex-row w-4/5 mx-auto mt-10">
                <div className="flex flex-col w-1/4">
                    <div className="flex flex-row rounded-3xl shadow-2xl">
                        <div className="grid place-content-center p-4">
                            <Image src={getImageURL()} height={100} width={100} alt="avatar" className="rounded-full" />
                            <p className="text-lg text-center">{session?.profile?.username}</p>
                        </div>
                        <div className="grid place-content-center gap-y-2 p-8">
                            <div>
                                <span className="block font-bold text-xl">10</span>
                                <span className="text-sm">Videos</span>
                            </div>
                            <hr className="border-gray-400" />
                            <div>
                                <span className="block font-bold text-xl">10</span>
                                <span className="text-sm">Products</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col rounded-3xl shadow-2xl mt-12 p-4 gap-y-2">
                        <p className="text-xl p-4">{session?.profile?.username}&apos;s confirmed information</p>
                        <div className="flex flex-col text-lg">
                            <p>{isEmailVerified()}Email address</p>
                            <p><RxCross2 className="inline-block mx-4 text-red-500" />Identity</p>
                        </div>
                        <p className="text-sm font-semibold ml-4 mb-2 underline hover:cursor-pointer">Learn about identity verification</p>
                    </div>
                </div>
                <div className="flex flex-col w-2/3 ml-20 px-4">
                    <h1 className="text-3xl font-semibold">About {session?.profile?.username}</h1>
                    <button className="p-2 border border-black rounded-lg mt-4 w-32" onClick={() => setEditing(true)}>Edit profile</button>
                    <div className="grid grid-cols-1 gap-y-8 mt-10 text-xl text-gray-900">
                        <p className="flex flex-row ">
                            <span className="w-1/2">Country</span>
                            {
                                session?.profile?.countryCode && <span className="font-light italic">{session?.profile?.countryCode}</span>
                            }
                            {
                                !session?.profile?.countryCode && <span className="font-light italic text-gray-400">information missing</span>
                            }
                        </p>
                        <p className="flex flex-row">
                            <span className="w-1/2">Region</span>
                            {
                                session?.profile?.region && <span className="font-light italic">{session?.profile?.region}</span>
                            }
                            {
                                !session?.profile?.region && <span className="font-light italic text-gray-400">information missing</span>
                            }
                        </p>
                        <p className="flex flex-row">
                            <span className="w-1/2">City</span>
                            {
                                session?.profile?.city && <span className="font-light italic">{session?.profile?.city}</span>
                            }
                            {
                                !session?.profile?.city && <span className="font-light italic text-gray-400">information missing</span>
                            }
                        </p>
                        <p className="flex flex-row">
                            <span className="w-1/2">Postcode</span>
                            {
                                session?.profile?.postcode && <span className="font-light italic">{session?.profile?.postcode}</span>
                            }
                            {
                                !session?.profile?.postcode && <span className="font-light italic text-gray-400">information missing</span>
                            }
                        </p>
                        <p className="flex flex-row">
                            <span className="w-1/2">Street Address</span>
                            {
                                session?.profile?.streetAddress && <span className="font-light italic">{session?.profile?.streetAddress}</span>
                            }
                            {
                                !session?.profile?.streetAddress && <span className="font-light italic text-gray-400">information missing</span>
                            }
                        </p>
                        <p className="flex flex-row">
                            <span className="w-1/2">Extended Address</span>
                            {
                                session?.profile?.extendedAddress && <span className="font-light italic">{session?.profile?.extendedAddress}</span>
                            }
                            {
                                !session?.profile?.extendedAddress && <span className="font-light italic text-gray-400">information missing</span>
                            }
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <>
            <div className="mx-auto mt-10 flex flex-row justify-center">
                <div className="pr-20 ">
                    <div className="relative">
                        <Image src={getImageURL()} height={100} width={100} alt="avatar" className="rounded-full" />
                        <span className="absolute -right-2 -bottom-2 hover:cursor-pointer" onClick={() => { fileInputRef.current && fileInputRef.current.click() }}><CiEdit size={25} /></span>
                        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={fileOnChange} />
                    </div>
                </div>
                <form className="flex flex-col gap-y-10 mt-2">
                    <FieldEditor label="Username" name="username" placeholder={session?.profile?.username} />
                    <FieldEditor label="Country" name="country" placeholder={session?.profile?.countryCode}
                        onChangeHandler={onCountryInputChange}
                        onFocusHandler={onCountryInputFocus}
                        onBlurHandler={onCountryInputBlur}
                        nodeRef={countryDivNodeRef}
                        inputRef={countryInputRef}>
                        <div className="absolute top-0 left-0 ml-4 mt-4 transform translate-y-8 z-10 font-light h-80 overflow-auto">
                            {
                                showFuzzyFinding &&
                                fuzzyCountries.map(name => (
                                    <a key={countryMap[name.toLowerCase()]} className="block hover:bg-blue-200 min-w-96 px-4 py-1 rounded-lg hover:cursor-pointer backdrop-blur-sm" onClick={onCountryItemClick}>{name}</a>
                                ))
                            }
                        </div>
                    </FieldEditor>
                    <FieldEditor label="Region" name="region" placeholder={session?.profile?.region} />
                    <FieldEditor label="City" name="city" placeholder={session?.profile?.city} />
                    <FieldEditor label="Postcode" name="postcode" placeholder={session?.profile?.postcode} />
                    <FieldEditor label="Street Address" name="streetAddress" placeholder={session?.profile?.streetAddress} />
                    <FieldEditor label="Extended Address" name="extendedAddress" placeholder={session?.profile?.extendedAddress} />
                    <SubmitButton theme="p-2 self-end bg-red-600 text-white w-32 rounded-lg" text="Submit" />
                </form>
            </div>
            <ImageUpload selectedFile={selectedFile} onUploadComplete={setDataUrl} />
        </>
    )
}

function FieldEditor({ label, name, placeholder, id = name, children, nodeRef, onChangeHandler, onFocusHandler, onBlurHandler, inputRef }:
    {
        label: string, name: string, placeholder: Nullable<string>, id?: string, children?: React.ReactNode, nodeRef?: RefObject<HTMLDivElement>,
        onChangeHandler?: ChangeEventHandler, onFocusHandler?: FocusEventHandler, onBlurHandler?: FocusEventHandler,
        inputRef?: RefObject<HTMLInputElement>
    }) {
    return (
        <div ref={nodeRef} className="relative flex flex-row items-center">
            <label htmlFor={id} className="text-lg w-48">{label}</label>
            <div className="relative">
                <input ref={inputRef} id={id} name={name} type="text" placeholder={placeholder ?? undefined}
                    className="py-2 px-4 ml-4 min-w-96 text-xl border rounded-xl focus:outline-none
                     focus:underline focus:underline-offset-4 placeholder:text-gray-600 italic"
                    onChange={onChangeHandler}
                    onBlur={onBlurHandler}
                    onFocus={onFocusHandler}>
                </input>
                {children}
            </div>
        </div>
    )
}