import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Music2 } from "lucide-react"
import Link from "next/link"

export default function SignUpSuccessPage() {
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
              <CardTitle className="text-2xl text-white">Thank you for signing up!</CardTitle>
              <CardDescription className="text-gray-400">Check your email to confirm</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-400 mb-4">
                You&apos;ve successfully signed up. Please check your email to confirm your account before signing in.
              </p>
              <Link href="/auth/login" className="text-[#00ff00] underline underline-offset-4 text-sm">
                Back to login
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
