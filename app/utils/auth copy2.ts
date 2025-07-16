import NextAuth from "next-auth"
import Nodemailer from "next-auth/providers/nodemailer"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Nodemailer({
      server: {
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD,
        },
      },
      from: process.env.GMAIL_USER,
    }),
  ],
  pages: {
    verifyRequest: "/verify"   
}})