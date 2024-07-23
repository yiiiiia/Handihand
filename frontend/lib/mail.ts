import { createTransport } from 'nodemailer'
import path from 'path'
import hbs from 'nodemailer-express-handlebars'
import { ConfigOptions } from 'express-handlebars/types'
import { logger } from './logger'

const transporter = createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    }
})

const cfgOpts: ConfigOptions = {
    partialsDir: path.resolve('./lib/views/'),
    defaultLayout: false,
}

const handlebarOptions = {
    viewEngine: cfgOpts,
    viewPath: path.resolve('./lib/views/'),
}

transporter.use('compile', hbs(handlebarOptions))

export async function sendVerificationEmail(from: string, to: string, confirmURL: string) {
    const mailOptions = {
        from: from,
        template: "email",
        to: to,
        subject: `Welcome to HandiHand`,
        context: {
            confirm_url: confirmURL
        },
    }
    transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
            logger.error('ERROR - Sending Email: receive error from server: ', err)
        }
        logger.info('get email sending info: ', info)
    })
}