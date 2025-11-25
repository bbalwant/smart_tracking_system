"use client"

import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import Link from "next/link"

export default function DashboardPage() {
  const { user, loading, logout, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login")
    }
  }, [loading, isAuthenticated, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600 mt-1">Welcome back, {user?.name}!</p>
            </div>
            <Button onClick={handleLogout} variant="outline">
              Logout
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Role</h3>
              <p className="text-2xl font-bold text-blue-600 capitalize">
                {user?.role.replace("_", " ")}
              </p>
            </div>
            <div className="bg-green-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Email</h3>
              <p className="text-sm text-gray-600">{user?.email}</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">User ID</h3>
              <p className="text-xs text-gray-600 font-mono">{user?.id}</p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Next Steps
            </h2>
            <ul className="space-y-2 text-gray-600">
              <li>✅ Authentication complete (Sprint 1)</li>
              <li>✅ Package Management (Sprint 2)</li>
              <li>✅ Real-Time Tracking (Sprint 3)</li>
              <li>✅ ETA & Status (Sprint 4)</li>
              <li>✅ Testing & MVP Completion (Sprint 5)</li>
            </ul>
          </div>

          <div className="flex gap-4 flex-wrap">
            <Link href="/packages">
              <Button>View My Packages</Button>
            </Link>
            <Link href="/packages/new">
              <Button variant="outline">Create New Package</Button>
            </Link>
            {(user?.role === "delivery_staff" || user?.role === "manager") && (
              <Link href="/delivery">
                <Button variant="outline">📍 Update Location</Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

