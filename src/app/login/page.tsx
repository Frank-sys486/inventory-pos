"use client";

import { login } from "./actions";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MountainIcon, Loader2, AlertCircle } from "lucide-react";
import { useFormState, useFormStatus } from "react-dom";

function LoginButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Logging in...
        </>
      ) : (
        "Log in"
      )}
    </Button>
  );
}

export default function LoginPage() {
  const [state, formAction] = useFormState(login, undefined);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <div className="mx-auto w-full max-w-md space-y-6">
        <div className="flex flex-col items-center space-y-2 text-center">
          <div className="rounded-full bg-primary/10 p-3">
            <MountainIcon className="h-10 w-10 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">Welcome to iPos System</h2>
          <p className="text-muted-foreground">
            Enter your email and password to sign in.
          </p>
        </div>
        <Card>
          <form action={formAction}>
            <CardContent className="space-y-4 mt-4">
              {state?.error && (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-100">
                  <AlertCircle className="h-4 w-4" />
                  <p>{state.error}</p>
                </div>
              )}
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  name="email" 
                  type="email" 
                  placeholder="name@example.com" 
                  required 
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password" 
                  name="password" 
                  type="password" 
                  required 
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <LoginButton />
              <div className="text-center text-sm">
                <Link
                  href="#"
                  className="text-muted-foreground hover:text-primary underline underline-offset-4"
                  prefetch={false}
                >
                  Forgot password?
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
