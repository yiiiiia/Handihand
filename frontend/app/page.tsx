import { auth } from "./api/auth/[...nextauth]/auth"
import List from './list'
import Nav from './nav'

export default async function Home() {
	const session = await auth()
	console.log('Get Session:', session)
	return (
		<div className="h-lvh bg-zinc-50">
			<Nav />
			<hr className="border-b-1" />
			<List />
		</div>
	)
}
