export async function GET(request: Request) {
    const {searchParams} = new URL(request.url)
    console.log('search params:', searchParams)
    return Response.json("hello,world")
}