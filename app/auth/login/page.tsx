import { login } from "./actions"
import { Music2 } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface SearchParams {
  message?: string;
  redirectedFrom?: string;
}

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gray-50 p-4 sm:p-6">
      <div className="w-full max-w-md sm:max-w-lg md:max-w-md">
        <div className="flex flex-col gap-4 sm:gap-6">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-[#338d97] rounded-lg flex items-center justify-center flex-shrink-0">
              <Music2 className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center sm:text-left">StocklineIA</h1>
          </div>
          <Card className="bg-white border-gray-200 shadow-sm w-full">
            <CardHeader className="px-4 sm:px-6 pt-6 pb-2 sm:pb-4">
              <CardTitle className="text-2xl sm:text-3xl text-gray-900">Login</CardTitle>
              <CardDescription className="text-sm sm:text-base text-gray-600">
                Enter your email below to login to your account
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 pb-6 sm:pb-8">
              <form action={login} method="POST" className="w-full">
                <div className="flex flex-col gap-4 sm:gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm sm:text-base text-gray-700">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      name="email"
                      placeholder="m@example.com"
                      required
                      className="h-11 sm:h-12 text-base bg-white border-gray-300 text-gray-900 focus-visible:ring-2 focus-visible:ring-[#338d97]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm sm:text-base text-gray-700">
                      Password
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      name="password"
                      required
                      placeholder="••••••••"
                      className="h-11 sm:h-12 text-base bg-white border-gray-300 text-gray-900 focus-visible:ring-2 focus-visible:ring-[#338d97]"
                    />
                  </div>
                  
                  {searchParams.message && (
                    <p className="text-sm text-red-500 px-1">{searchParams.message}</p>
                  )}
                  
                  <input type="hidden" name="redirectTo" value={searchParams.redirectedFrom || '/'} />
                  
                  <Button 
                    type="submit" 
                    className="w-full h-11 sm:h-12 text-base font-medium bg-[#338d97] hover:bg-[#2a7a83] text-white transition-colors"
                  >
                    Login
                  </Button>
                  
                  <p className="text-center text-sm sm:text-base text-gray-600">
                    Don&apos;t have an account?{" "}
                    <Link 
                      href="/auth/sign-up" 
                      className="text-[#338d97] hover:underline font-medium transition-colors"
                    >
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
