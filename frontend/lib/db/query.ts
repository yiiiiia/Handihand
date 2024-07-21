import { Pool } from "pg"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const WAIT_VERIFICATION = "wait_verification"

export async function createAccount(pool: Pool, email: string, password: string) {
    if (!email) {
        throw new Error('email is required')
    }
    if (!password) {
        throw new Error('passowrd is required')
    }
    return (await pool.query(`insert into account (email, password, state) values ($1::text, crypt($2::text, gen_salt('bf')), $3::text) returning id`, [email, password, WAIT_VERIFICATION])).rows
}

export async function getAccountByEmail(pool: Pool, email: string) {
    if (!email) {
        throw new Error("email is required")
    }
    // return (await pool.query('select * from account where email = $1::text limit 1', [email])).rows
    return await prisma.account.findFirst({ where: { email: email } })
}