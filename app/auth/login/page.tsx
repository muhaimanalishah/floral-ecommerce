import { LoginForm } from "./LoginForm";
import { Suspense } from "react";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <Suspense fallback={<div className="text-muted-foreground text-sm">Loading login form...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
