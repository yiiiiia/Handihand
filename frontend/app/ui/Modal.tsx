'use client'

export default function Modal({ children }: { children: React.ReactNode }) {
    return (
        <div className="fixed left-0 top-0 flex h-full w-full items-center justify-center bg-black bg-opacity-50 py-10">
            <div className="max-h-full w-full max-w-xl overflow-y-auto sm:rounded-2xl bg-white">
                <div className="w-full">
                    <div className="m-8 my-20 max-w-[400px] mx-auto">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    )
}