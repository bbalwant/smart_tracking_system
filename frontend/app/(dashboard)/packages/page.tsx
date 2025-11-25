"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/AuthContext"
import { listPackages, Package } from "@/lib/api/packages"
import { PackageCard } from "@/components/PackageCard"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"

export default function PackagesPage() {
  const router = useRouter()
  const { isAuthenticated, loading: authLoading } = useAuth()
  const [packages, setPackages] = useState<Package[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("")
  const [searchTrackingId, setSearchTrackingId] = useState("")

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [authLoading, isAuthenticated, router])

  const fetchPackages = async () => {
    try {
      setLoading(true)
      setError("")
      const response = await listPackages(statusFilter || undefined)
      setPackages(response.packages)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load packages")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      fetchPackages()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, statusFilter])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (searchTrackingId.trim()) {
      router.push(`/packages/${searchTrackingId.trim()}`)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Packages</h1>
            <p className="text-gray-600 mt-1">
              Manage and track your packages
            </p>
          </div>
          <Link href="/packages/new">
            <Button>Create New Package</Button>
          </Link>
        </div>

        {/* Search by Tracking ID */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              placeholder="Search by Tracking ID (e.g., TRK-XXXXXXXX)"
              value={searchTrackingId}
              onChange={(e) => setSearchTrackingId(e.target.value)}
              className="flex-1"
            />
            <Button type="submit">Search</Button>
          </form>
        </div>

        {/* Status Filter */}
        <div className="mb-6 flex gap-2">
          <Button
            variant={statusFilter === "" ? "default" : "outline"}
            onClick={() => setStatusFilter("")}
          >
            All
          </Button>
          <Button
            variant={statusFilter === "registered" ? "default" : "outline"}
            onClick={() => setStatusFilter("registered")}
          >
            Registered
          </Button>
          <Button
            variant={statusFilter === "in_transit" ? "default" : "outline"}
            onClick={() => setStatusFilter("in_transit")}
          >
            In Transit
          </Button>
          <Button
            variant={statusFilter === "delivered" ? "default" : "outline"}
            onClick={() => setStatusFilter("delivered")}
          >
            Delivered
          </Button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Packages List */}
        {packages.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-600 mb-4">No packages found</p>
            <Link href="/packages/new">
              <Button>Create Your First Package</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {packages.map((pkg) => (
              <PackageCard key={pkg.id} package={pkg} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

