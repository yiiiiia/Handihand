'use client'

import { Tag } from "@/lib/db/entities";
import { setTags } from "@/lib/features/searcher/searcher";
import { useAppDispatch } from "@/lib/hooks";
import { useCallback, useRef, useState } from "react";
import { MdArrowLeft, MdArrowRight } from "react-icons/md";

export default function Tags({ tags }: { tags: Tag[] }) {
    const dispatch = useAppDispatch()
    const [activeTag, setActiveTag] = useState('')
    const parentRef = useRef<HTMLDivElement>(null)
    const childRefs = useRef<HTMLSpanElement[]>([])
    const refCallback = useCallback((ele: HTMLSpanElement, index: number) => {
        childRefs.current[index] = ele
    }, [])

    const handleArrowClick = (direction: 'left' | 'right') => {
        if (parentRef.current) {
            const parentRect = parentRef.current.getBoundingClientRect()
            const scrollWidth = (parentRect.right - parentRect.left) / 2
            let accuWidth = 0
            let childToScroll: HTMLSpanElement | null = null
            if (direction === 'left') {
                for (let i = childRefs.current.length - 1; i >= 0; i--) {
                    const child = childRefs.current[i]
                    const childRect = child.getBoundingClientRect();
                    const childWidth = childRect.right - childRect.left
                    if (childRect.left <= parentRect.left) {
                        if (childWidth + accuWidth > scrollWidth) {
                            if (!childToScroll) {
                                childToScroll = child
                            }
                            break
                        }
                        childToScroll = child
                        accuWidth += childWidth
                    }
                }
            } else {
                for (let i = 0; i < childRefs.current.length; i++) {
                    const child = childRefs.current[i]
                    const childRect = child.getBoundingClientRect();
                    const childWidth = childRect.right - childRect.left
                    if (childRect.right >= parentRect.right) {
                        if (childWidth + accuWidth > scrollWidth) {
                            if (!childToScroll) {
                                childToScroll = child
                            }
                            break
                        }
                        childToScroll = child
                        accuWidth += childWidth
                    }
                }
            }
            if (childToScroll) {
                childToScroll.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest',
                    inline: direction === 'left' ? 'start' : 'end'
                })
            }
        }
    }

    const handleTagClicked = (tag: string) => {
        if (activeTag === tag) {
            setActiveTag('')
            dispatch(setTags([]))
        } else {
            setActiveTag(tag)
            dispatch(setTags([tag]))
        }
    }

    return (
        <div className="relative flex flex-row items-center px-6 gap-2">
            {tags.length > 0 && <MdArrowLeft size={35} className="hover:cursor-pointer font-light" onClick={() => handleArrowClick('left')} />}
            <div ref={parentRef} className="flex flex-row overflow-hidden w-full gap-4">
                {
                    <>
                        {tags.map((e, index) => {
                            return <span ref={ele => { refCallback(ele, index) }} key={index}
                                className={"p-3 text-sm text-nowrap rounded-xl border hover:cursor-pointer" + (e.word === activeTag ? ' bg-gray-300' : '')}
                                onClick={() => { handleTagClicked(e.word) }}>{e.word}</span>
                        })}
                    </>
                }
            </div>
            {tags.length > 0 && <MdArrowRight size={35} className="hover:cursor-pointer font-light" onClick={() => handleArrowClick('right')} />}
        </div>
    )
}