import { login } from "./actions"
import { Music2 } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default async function LoginPage({ searchParams }: { searchParams: { message: string } }) {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-black p-6">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Music2 className="h-8 w-8 text-[#00ff00]" />
            <h1 className="text-2xl font-bold text-white">StocklineIA</h1>
          </div>
          <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
            <CardHeader>
              <CardTitle className="text-2xl text-white">Login</CardTitle>
              <CardDescription className="text-gray-400">
                Enter your email below to login to your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form>
                <div className="flex flex-col gap-6">
                  <div className="grid gap-2">
                    <Label htmlFor="email" className="text-white">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      name="email"
                      placeholder="m@example.com"
                      required
                      className="bg-[#2a2a2a] border-[#3a3a3a] text-white"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password" className="text-white">
                      Password
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      name="password"
                      required
                      className="bg-[#2a2a2a] border-[#3a3a3a] text-white"
                    />
                  </div>
                  {searchParams.message && <p className="text-sm text-red-500">{searchParams.message}</p>}
                  <Button formAction={login} className="w-full bg-[#00ff00] text-black hover:bg-[#00dd00]">
                    Login
                  </Button>
                </div>
                <div className="mt-4 text-center text-sm text-gray-400">
                  Don&apos;t have an account?{" "}
                  <Link href="/auth/sign-up" className="text-[#00ff00] underline underline-offset-4">
                    Sign up
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
