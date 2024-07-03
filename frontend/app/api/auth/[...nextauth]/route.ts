import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google";

let cid = process.env.GOOGLE_CLIENT_ID
let csecret = process.env.GOOGLE_CLIENT_SECRET
if (cid === undefined) {
	throw 'env GOOGLE_CLIENT_ID is not set'
}
if (csecret === undefined) {
	throw 'env GOOGLE_CLIENT_SECRET is not set'
}

const handler = NextAuth({
	providers: [
		GoogleProvider({
			clientId: cid,
			clientSecret: csecret,
		})
	],
})

export {handler as GET, handler as POST}
