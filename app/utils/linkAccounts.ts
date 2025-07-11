import { prisma } from "@/app/utils/db";

export async function linkAccountsByEmail(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  const mobileUser = await prisma.mobileUser.findUnique({ where: { email } });

  if (user && mobileUser && mobileUser.userId !== user.id) {
    await prisma.mobileUser.update({
      where: { id: mobileUser.id },
      data: { userId: user.id },
    });
  }
}
