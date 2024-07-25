import { notFound } from "next/navigation";
import Signin from "./signin";
import SignUp from "./signup";
import VerifyEmail from "./verify";

export default function Page({
    params,
    searchParams,
}: {
    params: { path: string },
    searchParams: { [key: string]: string | string[] | undefined }
}) {
    switch (params.path) {
        case "signin":
            return <Signin />
        case "signup":
            return <SignUp />
        case "verify":
            return <VerifyEmail searchParams={searchParams} />
        default:
            notFound()
    }
}