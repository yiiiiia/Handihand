export default function ShowList() {
    const Card = () => {
        return <div className="bg-purple-200 h-40"></div>
    }
    return (
        <div className="grid grid-cols-6 gap-5 my-4">
            <Card />
            <Card />
            <Card />
            <Card />
            <Card />
            <Card />
            <Card />
            <Card />
            <Card />
            <Card />
            <Card />
            <Card />
        </div>
    )
}