import { notFound } from "next/navigation";
import Login from "./login";
import SignUp from "./signup";
import VerifyEmail from "./verify";

export default function Page({
    params,
    searchParams,
}: {
    params: { action: string },
    searchParams: { [key: string]: string | string[] | undefined }
}) {
    switch (params.action) {
        case "login":
            return <Login />
        case "register":
            return <SignUp />
        case "verify":
            return <VerifyEmail searchParams={searchParams} />
        default:
            notFound()
    }
}