export type NoticeProps = {
    theme: string,
    icon: React.ReactNode,
    header: string,
    message: string
}

export default function Notice({ props }: { props: NoticeProps }) {
    return (
        <div className={props.theme}>
            <div className="flex flex-row">
                {props.icon}
                <div className="ml-2 mr-6">
                    <span className="font-semibold">{props.header}</span>
                    <span className="block">{props.message}</span>
                </div>
            </div>
        </div>
    )
}