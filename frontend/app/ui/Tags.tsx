'use client'

import { Tag } from "@/lib/db/entities";
import { useCallback, useRef } from "react";
import { IoIosArrowDropleft, IoIosArrowDropright } from "react-icons/io";

export default function Tags({ tags }: { tags: Tag[] }) {
    const parentRef = useRef<HTMLDivElement>(null)
    const childRefs = useRef<(HTMLSpanElement | null)[]>([])
    const refCallback = useCallback((ele: HTMLSpanElement | null, index: number) => {
        childRefs.current[index] = ele
    }, [])


    const handleArrowClick = (direction: string) => {
        if (parentRef.current) {
            const parentRect = parentRef.current.getBoundingClientRect()
            let childToScroll: HTMLSpanElement | null = null
            for (const child of childRefs.current) {
                if (child) {
                    const childRect = child.getBoundingClientRect()
                    if (direction === 'left') {
                        if (childRect.right <= parentRect.left) {
                            childToScroll = child
                        } else {
                            break
                        }
                    } else if (direction === 'right') {
                        if (childRect.left >= parentRect.right) {
                            childToScroll = child
                            break
                        }
                    }
                }
            }
            if (childToScroll) {
                childToScroll.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest',
                    inline: 'center'
                })
            }
        }
    }

    return (
        <div className="relative flex flex-row items-center px-6 gap-2">
            {tags.length > 0 && <IoIosArrowDropleft size={35} className="hover:cursor-pointer" onClick={() => handleArrowClick('left')} />}
            <div ref={parentRef} className="flex flex-row overflow-hidden w-full gap-4">
                {
                    <>
                        {tags.map((e, index) => {
                            return <span ref={ele => { refCallback(ele, index) }} key={index} className="bg-sky-200 p-3 text-sm text-nowrap rounded-xl">{e.word}</span>
                        })}
                    </>
                }
            </div>
            {tags.length > 0 && <IoIosArrowDropright size={35} className="hover:cursor-pointer" onClick={() => handleArrowClick('right')} />}
        </div>
    )
}