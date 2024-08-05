'use client'

export default function BusyModal() {
    return (
        <div className="fixed left-0 top-0 h-full w-full bg-black bg-opacity-10 grid place-content-center cursor-wait">
            <span className="animate-spin"></span>
        </div>
    )
}