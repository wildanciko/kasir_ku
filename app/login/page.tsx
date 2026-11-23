import LoginForm from "@/components/LoginForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login – PosyMart",
};

export default function LoginPage() {
  return <LoginForm />;
}
