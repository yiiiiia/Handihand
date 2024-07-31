import { useContext } from "react"
import { SessionContext } from "../SessionProvider"

export default function AccountCenterLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <div className="flex flex-row h-screen">
            <div className="w-72 h-full my-6 rounded-3xl ml-4 pl-4 py-4 border-1 px-2 shadow-lg">
                <h1 className="text-2xl font-bold">Account Center</h1>
                <hr className="mt-4 mb-4 border-1 border-black"></hr>
                <div className="flex flex-col gap-y-1">
                    <p className="bg-blue-100 py-2 rounded-2xl px-2 hover:cursor-pointer font-semibold">My Profile</p>
                    <p className="bg-slate-50 py-2 rounded-2xl px-2 hover:cursor-pointer font-semibold">My Videos</p>
                    <p className="bg-slate-50 py-2 rounded-2xl px-2 hover:cursor-pointer font-semibold">As a Seller</p>
                    <p className="bg-slate-50 py-2 rounded-2xl px-2 hover:cursor-pointer font-semibold">As a Buyer</p>
                </div>
            </div>
            <div className="grow mt-6 rounded-3xl ml-4 pl-4 py-4 shadow-lg h-full">
                {children}
            </div>
        </div>
    )
}