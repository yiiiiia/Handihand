'use client'

export default function Modal({ children }: { children: React.ReactNode }) {
    return (
        <div className="fixed left-0 top-0 flex h-full w-full items-center justify-center bg-black bg-opacity-50 py-10">
            <div className="max-h-full max-w-7xl overflow-auto sm:rounded-2xl">
                {children}
            </div>
        </div>
    )
}