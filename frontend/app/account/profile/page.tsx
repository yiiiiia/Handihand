import SubmitButton from "@/app/ui/SubmitButton";
import Image from "next/image";

export default function Profile() {
    return (
        <div className="flex flex-col">
            <div>
                <Image src={"/owl.jpg"} width={80} height={80} alt="user avatar" className="h-28 w-28 rounded-full border-2 inline-block" />
                <button className="ml-4 py-2 px-3 rounded-md bg-gray-800 text-white">Change Picture</button>
            </div>
            <div className="mt-10">
                <form className="relative gird grid-cols-1 w-1/2 min-w-96">
                    <fieldset disabled={true}>
                        <div className="mb-6 flex flex-row items-center">
                            <label htmlFor="first_name" className="font-medium text-lg w-36">First Name:</label>
                            <input id="first_name" name="firstName" placeholder="Jane" className="ml-4 p-2 border rounded-md grow" />
                        </div>
                        <div className="mb-6 flex flex-row items-center">
                            <label htmlFor="middle_name" className="font-medium text-lg w-36">Middle Name:</label>
                            <input id="middle_name" name="middleName" placeholder="" className="ml-4 p-2 border rounded-md grow" />
                        </div>
                        <div className="mb-6 flex flex-row items-center">
                            <label htmlFor="last_name" className="font-medium text-lg w-36">Last Name:</label>
                            <input id="last_name" name="lastName" placeholder="Ferguson" className="ml-4 p-2 border rounded-md grow" />
                        </div>
                    </fieldset>
                    <fieldset disabled={true}>
                        <div className="mb-6 flex flex-row items-center">
                            <label htmlFor="country" className="font-medium text-lg w-36">Country:</label>
                            <input id="country" name="country" placeholder="China" className="ml-4 p-2 border rounded-md grow" />
                        </div>
                        <div className="mb-6 flex flex-row items-center">
                            <label htmlFor="region" className="font-medium text-lg w-36">Region:</label>
                            <input id="region" name="region" placeholder="" className="ml-4 p-2 border rounded-md grow" />
                        </div>
                        <div className="mb-6 flex flex-row items-center">
                            <label htmlFor="city" className="font-medium text-lg w-36">City:</label>
                            <input id="city" name="city" placeholder="" className="ml-4 p-2 border rounded-md grow" />
                        </div>
                        <div className="mb-6 flex flex-row items-center">
                            <label htmlFor="postcode" className="font-medium text-lg w-36">Postcode:</label>
                            <input id="postcode" name="postcode" placeholder="" className="ml-4 p-2 border rounded-md grow" />
                        </div>
                        <div className="mb-6 flex flex-row items-center">
                            <label htmlFor="street_address" className="font-medium text-lg w-36">Street Address:</label>
                            <input id="street_address" name="street_address" placeholder="" className="ml-4 p-2 border rounded-md grow" />
                        </div>
                        <div className="mb-6 flex flex-row items-center">
                            <label htmlFor="extended_address" className="font-medium text-lg w-36">Extended Address:</label>
                            <input id="extended_address" name="extended_address" placeholder="" className="ml-4 p-2 border rounded-md grow" />
                        </div>
                    </fieldset>
                    <button className="py-2 px-6 mt-10 rounded-md bg-gray-800 text-white w-32 absolute right-0" >Edit</button>
                </form>
            </div>
        </div>
    )
}