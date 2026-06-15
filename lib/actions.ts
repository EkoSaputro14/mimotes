"use server";

import { signIn, signOut } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";

export async function register(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const name = formData.get("name") as string;

  if (!email || !password) {
    return { error: "Email dan password diperlukan" };
  }

  if (password.length < 6) {
    return { error: "Password minimal 6 karakter" };
  }

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return { error: "Email sudah terdaftar" };
  }

  // Hash password and create user
  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: {
      email,
      name: name || null,
      passwordHash,
    },
  });

  // Auto sign in after registration
  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/admin/documents",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Gagal login setelah registrasi" };
    }
    throw error;
  }

  return { success: true };
}

export async function login(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email dan password diperlukan" };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Email atau password salah" };
        default:
          return { error: "Terjadi kesalahan saat login" };
      }
    }
    throw error;
  }

  return { success: true };
}

export async function logout() {
  await signOut({ redirectTo: "/" });
}
