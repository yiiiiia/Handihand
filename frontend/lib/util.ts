function genRandomToken(length: number) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+[]';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

export type Token = {
    self: string,
    encoded: string
}

export function genCsrfToken(): Token {
    const rand = genRandomToken(16)
    return {
        self: rand,
        encoded: encodeURIComponent(rand),
    }
}

export function genVerificationToken(): Token {
    const rand = genRandomToken(32)
    return {
        self: rand,
        encoded: encodeURIComponent(rand),
    }
}

export function genSessionToken(): Token {
    const rand = genRandomToken(32)
    return {
        self: rand,
        encoded: encodeURIComponent(rand),
    }
}
