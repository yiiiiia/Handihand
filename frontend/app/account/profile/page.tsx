/* eslint-disable react-hooks/exhaustive-deps */
'use client'

import { ProfileUpdateResult } from "@/app/api/profile/route";
import { CountryContext } from "@/app/CountryProvider";
import { SessionContext } from "@/app/SessionProvider";
import ImageUpload from "@/app/ui/ImageUpload";
import SubmitButton from "@/app/ui/SubmitButton";
import { Nullable } from "@/lib/db/entities";
import { Fzf } from 'fzf';
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChangeEvent, ChangeEventHandler, FocusEvent, FocusEventHandler, FormEvent, MouseEvent, RefObject, useContext, useEffect, useRef, useState } from "react";
import { CiEdit } from "react-icons/ci";
import { GoCheck } from "react-icons/go";
import { RxCross2 } from "react-icons/rx";

export default function Profile() {
    const route = useRouter()
    const session = useContext(SessionContext)
    if (!session) {
        route.push('/error')
    }

    const countries = useContext(CountryContext)
    if (countries?.length == 0) {
        console.log("WARN: no countries fetched")
    }
    const countryList: string[] = []
    const countryMap: Record<string, string> = {}
    countries?.forEach(item => {
        const lowercaseCountryName = item.name.toLowerCase()
        countryMap[lowercaseCountryName] = item.code
        countryList.push(item.name)
    })
    const fzf = new Fzf(countryList)

    const [editing, setEditing] = useState(false)
    const [dataUrl, setDataUrl] = useState<string>('')
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [fuzzyCountries, setFuzzyCountries] = useState<string[]>([])
    const [updateResult, setUpdateResult] = useState<ProfileUpdateResult>({ ok: true })

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

    async function onEdit() {
        await fetch('/api/csrf').catch(err => { console.log('failed to requets csrf:', err) })
        setEditing(true)
    }

    function onInputFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0])
            e.target.value = ''
        }
    }

    function onInputCountryChange(e: ChangeEvent<HTMLInputElement>) {
        const value = e.target.value
        const entries = fzf.find(value)
        const items = entries.map(e => e.item)
        setFuzzyCountries(items)
    }

    function onInputCountryFocus(e: FocusEvent) {
        const ele = e.target as HTMLInputElement
        if (ele.value) {
            const entries = fzf.find(ele.value)
            const items = entries.map(e => e.item)
            setFuzzyCountries(items)
        }
    }

    function onCountryItemClick(e: MouseEvent<HTMLAnchorElement>) {
        const ele = e.target as HTMLElement
        if (countryInputRef.current) {
            countryInputRef.current.value = ele.innerText
            setUpdateResult(old => ({ ...old, error: { ...old.error, countryCode: [] } }))
        }
        setFuzzyCountries([])
    }

    function onSubmit(e: FormEvent) {
        e.preventDefault()
        const form = e.target as HTMLFormElement
        const formData = new FormData(form)
        if (formData.get('country')) {
            let country = formData.get('country') as string
            country = country.toLowerCase()
            if (!countryMap[country]) {
                setUpdateResult({ ok: false, error: { countryCode: ['unknown country'] } })
                return
            }
            formData.append('countryCode', countryMap[country])
        }

        fetch('/api/profile', {
            method: 'POST',
            body: formData,
        })
            .then(res => res.json())
            .then((data: ProfileUpdateResult) => {
                setUpdateResult(data)
                if (data.ok) {
                    window.location.reload()
                }
            })
    }

    useEffect(() => {
        const handleClickOutside = event => {
            if (countryDivNodeRef.current && event.target) {
                const div = countryDivNodeRef.current
                if (!div.contains(event.target as HTMLElement)) {
                    setFuzzyCountries([])
                }
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, []);

    if (!editing) {
        return (
            <div className="flex flex-row w-4/5 mx-auto mt-10">
                <div className="flex flex-col">
                    <div className="grid grid-cols-2 justify-center items-center rounded-3xl shadow-2xl">
                        <div className="grid place-content-center py-4">
                            <Image src={getImageURL()} height={80} width={80} alt="avatar" className="rounded-full" />
                            <p className="text-lg text-center mt-4 overflow-y-auto">{session?.profile?.username}</p>
                        </div>
                        <div className="grid place-content-center gap-y-2">
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
                    <button className="p-2 border border-black rounded-lg mt-4 w-32" onClick={onEdit}>Edit profile</button>
                    <div className="grid grid-cols-1 gap-y-8 mt-10 text-xl text-gray-900">
                        <p className="flex flex-row ">
                            <span className="w-1/2">Country</span>
                            {
                                session?.profile?.countryName && <span className="font-light italic">{session?.profile?.countryName}</span>
                            }
                            {
                                !session?.profile?.countryName && <span className="font-light italic text-gray-400">information missing</span>
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
                        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onInputFileChange} />
                    </div>
                </div>
                <form className="flex flex-col gap-y-10 mt-2" onSubmit={onSubmit}>
                    <FieldEditor label="Username" name="username" placeholder={session?.profile?.username} fieldErr={updateResult?.error?.username?.[0]} />
                    <FieldEditor label="Country" name="country" placeholder={session?.profile?.countryName}
                        onChangeHandler={onInputCountryChange}
                        onFocusHandler={onInputCountryFocus}
                        nodeRef={countryDivNodeRef}
                        inputRef={countryInputRef}
                        fieldErr={updateResult?.error?.countryCode?.[0]}
                    >
                        <div className="absolute top-0 left-0 ml-4 mt-4 transform translate-y-8 z-10 font-light h-80 overflow-auto">
                            {
                                fuzzyCountries.map(name => (
                                    <a key={countryMap[name.toLowerCase()]} className="block hover:bg-blue-200 min-w-96 px-4 py-1 rounded-lg hover:cursor-pointer backdrop-blur-sm" onClick={onCountryItemClick}>{name}</a>
                                ))
                            }
                        </div>
                    </FieldEditor>
                    <FieldEditor label="Region" name="region" placeholder={session?.profile?.region} fieldErr={updateResult?.error?.region?.[0]} />
                    <FieldEditor label="City" name="city" placeholder={session?.profile?.city} fieldErr={updateResult?.error?.city?.[0]} />
                    <FieldEditor label="Postcode" name="postcode" placeholder={session?.profile?.postcode} fieldErr={updateResult?.error?.postcode?.[0]} />
                    <FieldEditor label="Street Address" name="streetAddress" placeholder={session?.profile?.streetAddress} fieldErr={updateResult?.error?.streetAddress?.[0]} />
                    <FieldEditor label="Extended Address" name="extendedAddress" placeholder={session?.profile?.extendedAddress} fieldErr={updateResult?.error?.extendedAddress?.[0]} />
                    <div className="self-end">
                        <SubmitButton theme="p-2 bg-red-600 text-white w-32 rounded-lg" text="Submit" />
                        <button type="button" className="p-2 ml-4 self-end bg-gray-300 w-32 rounded-lg" onClick={() => setEditing(false)}>Cancel</button>
                    </div>
                </form>
            </div>
            <ImageUpload selectedFile={selectedFile} onUploadComplete={setDataUrl} />
        </>
    )
}

function FieldEditor({ label, name, placeholder, id = name, children, nodeRef, onChangeHandler, onFocusHandler, onBlurHandler, inputRef, fieldErr }:
    {
        label: string, name: string, placeholder: Nullable<string>, id?: string, children?: React.ReactNode, nodeRef?: RefObject<HTMLDivElement>,
        onChangeHandler?: ChangeEventHandler, onFocusHandler?: FocusEventHandler, onBlurHandler?: FocusEventHandler,
        inputRef?: RefObject<HTMLInputElement>, fieldErr?: string
    }) {
    return (
        <div ref={nodeRef} className="relative flex flex-row items-center">
            <label htmlFor={id} className="text-lg w-48">{label}</label>
            <div className="relative">
                <input ref={inputRef} id={id} name={name} type="text" defaultValue={placeholder ?? ''}
                    className="py-2 px-4 ml-4 min-w-96 text-xl border rounded-xl focus:outline-none
                     focus:underline focus:underline-offset-4 placeholder:text-gray-600 italic"
                    onChange={onChangeHandler}
                    onBlur={onBlurHandler}
                    onFocus={onFocusHandler}>
                </input>
                {children}
                {
                    fieldErr &&
                    <p className="absolute top-12 left-4 text-red-500 px-2 py-1">{fieldErr}</p>
                }
            </div>
        </div>
    )
}
