export const WAIT_VERIFICATION = "wait_verification"
export const VERIFIED = "verified"
export const TOKEN_VERIFY_EMAIL = 'verify_email'
export const TOKEN_ONETIME_CSRF = 'onetime_csrf'
export const TOKEN_SESSION_CSRF = 'session_csrf'
export const EMAIL_AS_IDENTITY = 'email'


export type AccountState = 'wait_verification' | 'verified'

export type AccountIdentityType = 'email' | 'phone' | 'x/twitter' | 'github' | 'facebook' | 'apple' | 'amazon' | 'spotify'

export type VerificationType = 'verify_email' | 'onetime_csrf' | 'session_csrf'

export type Nullable<T> = T | null | undefined

export type Account = {
    id: number | undefined;
    identityType: AccountIdentityType;
    identityValue: string;
    state: AccountState;
    createdAt?: Date;
}

export type Profile = {
    id?: number | undefined;
    countryCode?: Nullable<string>;
    region?: Nullable<string>;
    city?: Nullable<string>;
    postcode?: Nullable<string>;
    streetAddress?: Nullable<string>;
    extendedAddress?: Nullable<string>;
    firstName?: Nullable<string>;
    lastName?: Nullable<string>;
    middleName?: Nullable<string>;
    photo?: Nullable<string>;
    account?: Nullable<Account>;
    updatedAt?: Nullable<Date>;
    createdAt?: Date;
}

export type Session = {
    id: number | undefined;
    sessionid: string;
    account: Nullable<Account>;
    profile: Nullable<Profile>;
    expireAt: Date;
    createdAt: Date;
    csrf: string | null;
}

export type Oauth = {
    id: number | undefined;
    identity: string;
    token: string;
    refreshToken?: Nullable<string>;
    provider?: string,
    account?: Nullable<Account>;
    createdAt?: Date;
}

export type Verification = {
    id: number | undefined;
    email?: Nullable<string>;
    code: string;
    session?: Nullable<Session>;
    type: VerificationType;
    createdAt: Date;
}

export type Tag = {
    id: number;
    word: string;
    createdAt?: Date;
}

export type Video = {
    id: number | undefined;
    url: string;
    thumbnail: string;
    account?: Account;
    country: string;
    description: string;
    tags?: string[];
    createdAt?: Date;
}