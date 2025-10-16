import { login } from "./actions"
import { Music2 } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default async function LoginPage({ searchParams }: { searchParams: { message: string } }) {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-10 h-10 bg-[#338d97] rounded-lg flex items-center justify-center">
              <Music2 className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">StocklineIA</h1>
          </div>
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-2xl text-gray-900">Login</CardTitle>
              <CardDescription className="text-gray-600">
                Enter your email below to login to your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form>
                <div className="flex flex-col gap-6">
                  <div className="grid gap-2">
                    <Label htmlFor="email" className="text-gray-700">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      name="email"
                      placeholder="m@example.com"
                      required
                      className="bg-white border-gray-300 text-gray-900 focus-visible:ring-[#338d97]"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password" className="text-gray-700">
                      Password
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      name="password"
                      required
                      placeholder="••••••••"
                      className="bg-white border-gray-300 text-gray-900 focus-visible:ring-[#338d97]"
                    />
                  </div>
                  {searchParams.message && <p className="text-sm text-red-500">{searchParams.message}</p>}
                  <Button type="submit" formAction={login} className="w-full bg-[#338d97] hover:bg-[#2a7a83] text-white">
                    Login
                  </Button>
                  <p className="text-center text-sm text-gray-600">
                    Don&apos;t have an account?{" "}
                    <Link href="/auth/sign-up" className="text-[#338d97] hover:underline font-medium">
                      Sign up
                    </Link>
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
