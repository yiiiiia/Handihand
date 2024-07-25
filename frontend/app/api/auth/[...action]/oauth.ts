import { google } from "googleapis";

export function googleOAuthClient() {
    return new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, process.env.GOOGLE_OAUTH_CALLBACK)
}