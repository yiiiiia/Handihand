import { notFound, redirect } from "next/navigation";
import Login from "./login";
import Register from "./register";
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
            return <Register />
        case "verify":
            return <VerifyEmail searchParams={searchParams} />
        default:
            notFound()
    }
}