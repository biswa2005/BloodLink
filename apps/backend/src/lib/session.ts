import { HttpError } from "./http-error.ts";
import { prisma } from "./prisma.ts";

export async function assertSession(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });
  if (!user) {
    throw new HttpError(
      401,
      "SESSION_EXPIRED",
      "This session is no longer valid — sign in again",
    );
  }
}
