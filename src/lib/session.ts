import { getServerSession } from "next-auth";
import { authOptions } from "./auth";

export async function getSession() {
  return await getServerSession(authOptions);
}

export async function getCurrentUser() {
  const session = await getSession();
  return session?.user;
}

export async function getCurrentBusinessId() {
  const user = await getCurrentUser();
  return user?.businessId;
}
