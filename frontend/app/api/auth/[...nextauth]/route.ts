import NextAuth from "next-auth"
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import Email from "next-auth/providers/email";
import PostgresAdapter from "@auth/pg-adapter"
import { Pool } from "pg"

let cid = process.env.GOOGLE_CLIENT_ID
if (cid === undefined) {
	throw 'env GOOGLE_CLIENT_ID is not set'
}
let csecret = process.env.GOOGLE_CLIENT_SECRET
if (csecret === undefined) {
	throw 'env GOOGLE_CLIENT_SECRET is not set'
}
let portStr = process.env.DATABASE_PORT
if (portStr === undefined) {
	throw 'env DATABASE_PORT is not set'
}
let dbPort = parseInt(portStr)

const pool = new Pool({
	host: process.env.DATABASE_HOST,
	port: dbPort,
	user: process.env.DATABASE_USER,
	password: process.env.DATABASE_PASSWORD,
	database: process.env.DATABASE_NAME,
	max: 20,
	idleTimeoutMillis: 30000,
	connectionTimeoutMillis: 2000,
})

export const authOptions: NextAuthOptions = {
	session: {
		// Choose how you want to save the user session.
		// The default is `"jwt"`, an encrypted JWT (JWE) stored in the session cookie.
		// If you use an `adapter` however, we default it to `"database"` instead.
		// You can still force a JWT session by explicitly defining `"jwt"`.
		// When using `"database"`, the session cookie will only contain a `sessionToken` value,
		// which is used to look up the session in the database.
		strategy: "database",
		// Seconds - How long until an idle session expires and is no longer valid.
		maxAge: 7 * 24 * 60 * 60, // 7 days
		// Seconds - Throttle how frequently to write to database to extend a session.
		// Use it to limit write operations. Set to 0 to always update the database.
		// Note: This option is ignored if using JSON Web Tokens
		updateAge: 24 * 60 * 60, // 24 hours
		generateSessionToken: () => {
			return uuidv4()
		}
	},
	providers: [
		Email({
			server: process.env.EMAIL_SERVER,
			from: process.env.EMAIL_FROM
		}),
		GoogleProvider({
			clientId: cid,
			clientSecret: csecret,
		})
	],
	pages: {
		// signIn: '/auth/signin',
		error: '/auth/error',
	},
	callbacks: {
		async signIn(arg) {
			console.log("SIGN IN CALLBACK: ", arg)
			return true
		},
		async session(arg) {
			console.log("SESSION CALLBACK: ", arg)
			return arg.session
		}
	},
	adapter: PostgresAdapter(pool),
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }

function uuidv4() {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'
		.replace(/[xy]/g, function (c) {
			const r = Math.random() * 16 | 0,
				v = c == 'x' ? r : (r & 0x3 | 0x8);
			return v.toString(16);
		});
}