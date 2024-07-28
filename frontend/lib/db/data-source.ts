import { PrismaClient } from '@prisma/client';

export type PrismaDBConnection = Parameters<Parameters<typeof prismaClient.$transaction>[0]>[0]

const prismaClientSingleton = () => {
    return new PrismaClient()
}

declare const globalThis: {
    prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

export const prismaClient = globalThis.prismaGlobal ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prismaClient