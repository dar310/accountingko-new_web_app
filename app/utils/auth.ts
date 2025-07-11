import NextAuth from "next-auth"
import Nodemailer from "next-auth/providers/nodemailer"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient();

export const { handlers, signIn, signOut, auth } = NextAuth({
    adapter: PrismaAdapter(prisma),
    trustHost: true,
    providers: [
        Nodemailer({
            server: {
                host: "smtp.gmail.com",
                port: 587,
                secure: false, // true for 465, false for other ports
                auth: {
                    user: process.env.GMAIL_USER, // your-email@gmail.com
                    pass: process.env.GMAIL_APP_PASSWORD, // your Gmail app password
                },
            },
            from: process.env.GMAIL_USER,
        }),
    ],
    pages: {
        verifyRequest: "/verify"
    }
})