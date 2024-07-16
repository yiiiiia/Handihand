import { auth } from './api/auth/[...nextauth]/auth'
import List from './list'
import Nav from './nav'

export default async function Home() {
	const session = await auth()
	return (
		<div className="bg-zinc-50 h-dvh">
			<Nav session={session} />
			<hr className='' />
			<List />
		</div>
	)
}