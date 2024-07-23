import Image from "next/image"

export default function ErrorPage() {
    return (
        <>
            <div className="lg:px-24 lg:py-24 md:py-20 md:px-44 px-4 py-24 items-center flex justify-center flex-col-reverse lg:flex-row md:gap-28 gap-16">
                <div className="xl:pt-24 w-full xl:w-1/2 relative pb-12 lg:pb-0">
                    <div className="relative">
                        <div className="absolute">
                            <div className="">
                                <h1 className="my-2 text-gray-800 font-bold text-2xl">
                                    Seems that something went wrong with this request
                                </h1>
                                <p className="my-2 text-gray-800">You can start exploring our website from our homepage</p>
                                <button className="sm:w-full lg:w-auto my-2 border rounded md py-4 px-8 text-center bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-700 focus:ring-opacity-50"><a href="/">Take me there!</a></button>
                            </div>
                        </div>
                    </div>
                </div>
                <div>
                    <Image src="/error.png" width={600} height={600} alt="error-page" />
                </div>
            </div>
        </>
    )
}