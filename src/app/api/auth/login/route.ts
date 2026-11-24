import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, createSession } from "@/lib/auth";

export async function POST(req: Request) {
  const { email, password } = await req.json();
  if (!email || !password) {
    return NextResponse.json({ error: "Email dan password wajib diisi" }, { status: 400 });
  }
  const user = await prisma.user.findUnique({ where: { email }, include: { role: true } });
  if (!user || !user.isActive) {
    return NextResponse.json({ error: "Kredensial tidak valid" }, { status: 401 });
  }
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    return NextResponse.json({ error: "Kredensial tidak valid" }, { status: 401 });
  }
  await createSession({
    userId: user.id,
    roleId: user.roleId,
    roleName: user.role.name,
    permissions: user.role.permissions as any,
  });
  return NextResponse.json({ ok: true });
}