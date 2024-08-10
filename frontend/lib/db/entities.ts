export const VERIFIED = "verified"
export const WAIT_VERIFICATION = "wait_verification"
export const EMAIL_AS_IDENTITY = 'email'

export type AccountState = 'wait_verification' | 'verified'

export type AccountIdentityType = 'email' | 'phone' | 'x/twitter' | 'github' | 'facebook' | 'apple' | 'amazon' | 'spotify'

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
    countryName?: Nullable<string>;
    region?: Nullable<string>;
    city?: Nullable<string>;
    postcode?: Nullable<string>;
    streetAddress?: Nullable<string>;
    extendedAddress?: Nullable<string>;
    username?: Nullable<string>;
    photo?: Nullable<string>;
    account?: Nullable<Account>;
    updatedAt?: Nullable<Date>;
    createdAt?: Date;
}

export type Session = {
    id: number | undefined;
    token: string;
    account: Nullable<Account>;
    profile: Nullable<Profile>;
    expireAt: Date;
    createdAt: Date;
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

export type Tag = {
    id: number;
    word: string;
    createdAt?: Date;
}

export type Video = {
    id: number;
    title: string;
    description: string;
    profile: Profile;
    createdAt: Date;
    countryCode?: string;
    name?: string;
    type?: string;
    size?: number;
    uploadURL: string;
    thumbnailURL: string;
    tags?: string[];
}

export type Country = {
    code: string;
    name: string
}