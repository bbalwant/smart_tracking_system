"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"

export default function Home() {
  const router = useRouter()
  const { isAuthenticated, loading } = useAuth()
  const [healthStatus, setHealthStatus] = useState<{
    status: string
    database?: string
    service?: string
  } | null>(null)

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
        const response = await fetch(`${apiUrl}/health`)
        const data = await response.json()
        setHealthStatus(data)
      } catch (error) {
        setHealthStatus({
          status: "error",
          service: "Unable to connect to backend",
        })
      }
    }

    checkHealth()
  }, [])

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.push("/dashboard")
    }
  }, [loading, isAuthenticated, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-2xl w-full mx-4">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Smart Package Tracking System
          </h1>
          <p className="text-gray-600 mb-8">
            Real-time package tracking and delivery management
          </p>

          <div className="space-y-4 mb-6">
            <div className="border rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-2">System Status</h2>
              {healthStatus ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        healthStatus.status === "ok"
                          ? "bg-green-500"
                          : "bg-red-500"
                      }`}
                    />
                    <span className="font-medium">
                      Status: {healthStatus.status}
                    </span>
                  </div>
                  {healthStatus.database && (
                    <div className="text-sm text-gray-600">
                      Database: {healthStatus.database}
                    </div>
                  )}
                  {healthStatus.service && (
                    <div className="text-sm text-gray-600">
                      Service: {healthStatus.service}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-gray-500">Checking status...</div>
              )}
            </div>
          </div>

          <div className="flex gap-4">
            <Button onClick={() => router.push("/login")} className="flex-1">
              Sign In
            </Button>
            <Button
              onClick={() => router.push("/register")}
              variant="outline"
              className="flex-1"
            >
              Sign Up
            </Button>
          </div>
        </div>
      </div>
    </main>
  )
}

