'use client'
import React, { useState } from 'react';
import Image from 'next/image'
import { MdVideoLibrary } from "react-icons/md"
import { BsCartPlusFill } from "react-icons/bs"
import { GiHamburgerMenu } from "react-icons/gi";
import { FaUserCircle } from "react-icons/fa";
import { RiSearch2Line } from "react-icons/ri";

function SearchIcon({ hasIcon }: { hasIcon: boolean }) {
    if (hasIcon) {
        return <RiSearch2Line size={40} className='rounded-full text-white bg-red-500 px-2 py-2 hover:cursor-pointer' />
    }
    return null
}

function BgColorInput({ normalColor, hoverColor, labelName, hint, hasIcon = false }: { normalColor: string, hoverColor: string, labelName: string, hint: string, hasIcon: boolean }) {
    const [inputBgColor, setInputBgColor] = useState(normalColor)

    const hoverColorEffect = () => {
        setInputBgColor(hoverColor)
    }

    const normalColorEffect = () => {
        setInputBgColor(normalColor)
    }
    return (
        <div className={'flex flex-row px-7 py-2 rounded-full hover:' + hoverColor} onMouseOver={hoverColorEffect} onMouseOut={normalColorEffect}>
            <label className='text-sm'>
                {labelName} <br />
                <input type='text' placeholder={hint} className={'focus:outline-none ' + inputBgColor}></input>
            </label>
            <SearchIcon hasIcon={hasIcon} />
        </div>

    )
}

export default function HomepageNav() {
    return (
        <nav className="flex flex-col h-1/6 px-20 py-4">
            <div className="flex flex-row">
                <div className="basis-1/3 justify-self-end">
                    <Image src="/airbnb-color.svg" width={40} height={40} alt="Logo" />
                </div>
                <div className="flex flex-row justify-center basis-1/3">
                    <button className="border rounded-full px-5 py-3 my-2 mx-2">Videos</button>
                    <button className="border rounded-full px-5 py-3 my-2 mx-2">Products</button>
                </div>
                <div className="flex flex-row justify-end basis-1/3">
                    <button className="flex flex-row rounded-lg h-1/2 px-2 py-2 mx-2 mt-4 bg-red-500">
                        <MdVideoLibrary size={20} />
                        <span className="px-2 text-sm text-white">Upload Video</span>
                    </button>
                    <button className="flex flex-row rounded-lg h-1/2 px-2 py-2 mx-2 mt-4 bg-red-500">
                        <BsCartPlusFill size={20} />
                        <span className="px-2 text-sm text-white">My Cart</span>
                    </button>
                    <button className="flex flex-row px-2 py-2 my-2 border-2 rounded-full items-center" onClick={() => console.log('hi,there')}>
                        <span className="px-2"><GiHamburgerMenu size={30} /></span>
                        <span className="px-2"><FaUserCircle size={30} /></span>
                    </button>
                </div>
            </div>
            <div className="grid grid-cols-2 border-2 rounded-full self-center shadow-sm">
                <BgColorInput normalColor={'bg-zinc-50'} hoverColor={'bg-stone-200'} labelName={'Where'} hint='Search countries' hasIcon={false} />
                <BgColorInput normalColor={'bg-zinc-50'} hoverColor={'bg-stone-200'} labelName={'What'} hint='Search keyword' hasIcon={true} />
            </div>
        </nav>
    )
}