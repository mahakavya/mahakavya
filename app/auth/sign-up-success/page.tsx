import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";

export default function SignUpSuccess() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-gradient-to-br from-background to-muted">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <div className="text-center space-y-2 mb-4">
            <h1 className="text-4xl font-bold text-primary">Mahakavya</h1>
            <p className="text-muted-foreground">Share Your Epic Stories</p>
          </div>

          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Confirm Your Email</CardTitle>
              <CardDescription className="mt-2">
                We&apos;ve sent a confirmation link to your email. Please check your inbox and click the link to activate your account.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <p className="text-sm text-muted-foreground text-center">
                Once you&apos;ve confirmed your email, you can log in and start sharing your stories!
              </p>
              <Link href="/auth/login" className="w-full">
                <Button className="w-full" variant="outline">
                  Back to Login
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
