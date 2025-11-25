"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/AuthContext"
import { listPackages, Package } from "@/lib/api/packages"
import { updateLocation } from "@/lib/api/tracking"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function DeliveryPage() {
  const router = useRouter()
  const { isAuthenticated, loading: authLoading, user } = useAuth()
  const [packages, setPackages] = useState<Package[]>([])
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null)
  const [latitude, setLatitude] = useState("")
  const [longitude, setLongitude] = useState("")
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isAutoTracking, setIsAutoTracking] = useState(false)
  const [updateCount, setUpdateCount] = useState(0)
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null)
  const autoUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const watchIdRef = useRef<number | null>(null)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login")
    } else if (user && !["delivery_staff", "manager"].includes(user.role)) {
      router.push("/dashboard")
    }
  }, [authLoading, isAuthenticated, user, router])

  useEffect(() => {
    if (isAuthenticated && (user?.role === "delivery_staff" || user?.role === "manager")) {
      fetchPackages()
    }
  }, [isAuthenticated, user])

  const fetchPackages = async () => {
    try {
      setLoading(true)
      setError("")
      // Fetch all packages (managers/delivery_staff can see all)
      const response = await listPackages()
      // Filter to only show packages in transit or registered (active packages for delivery)
      const activePackages = response.packages.filter(
        (pkg) => pkg.status === "in_transit" || pkg.status === "registered"
      )
      setPackages(activePackages)
      console.log(`📦 Loaded ${activePackages.length} active packages (out of ${response.total} total)`)
    } catch (err) {
      console.error("Failed to fetch packages:", err)
      setError(err instanceof Error ? err.message : "Failed to load packages")
    } finally {
      setLoading(false)
    }
  }

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser")
      return
    }

    setError("")
    setSuccess("Getting your location...")

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude.toString())
        setLongitude(position.coords.longitude.toString())
        setSuccess("Location detected!")
        setTimeout(() => setSuccess(""), 3000)
      },
      (error) => {
        setError(`Failed to get location: ${error.message}`)
        setSuccess("")
      }
    )
  }

  const sendLocationUpdate = async (lat: number, lng: number) => {
    if (!selectedPackage) return

    try {
      await updateLocation(selectedPackage.tracking_id, lat, lng)
      setUpdateCount((prev) => prev + 1)
      setLastUpdateTime(new Date())
      setSuccess(`Location updated! (Update #${updateCount + 1})`)
      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      console.error("Location update error:", err)
      const errorMessage = err instanceof Error ? err.message : "Failed to update location"
      setError(errorMessage)
      setIsAutoTracking(false) // Stop auto-tracking on error
    }
  }

  const handleStartAutoTracking = () => {
    if (!selectedPackage) {
      setError("Please select a package first")
      return
    }

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser")
      return
    }

    setIsAutoTracking(true)
    setError("")
    setSuccess("Auto-tracking started! Your location will update every 10 seconds.")

    // Watch position continuously
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const lat = position.coords.latitude
        const lng = position.coords.longitude
        setLatitude(lat.toString())
        setLongitude(lng.toString())
        
        // Automatically send update
        sendLocationUpdate(lat, lng)
      },
      (error) => {
        setError(`Location tracking error: ${error.message}`)
        setIsAutoTracking(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    )

    // Also set up interval as backup (every 10 seconds)
    autoUpdateIntervalRef.current = setInterval(() => {
      if (navigator.geolocation && selectedPackage) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const lat = position.coords.latitude
            const lng = position.coords.longitude
            sendLocationUpdate(lat, lng)
          },
          (error) => {
            console.error("Interval location error:", error)
          },
          {
            enableHighAccuracy: true,
            timeout: 5000,
          }
        )
      }
    }, 10000) // Update every 10 seconds
  }

  const handleStopAutoTracking = () => {
    setIsAutoTracking(false)
    setSuccess("Auto-tracking stopped.")

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }

    if (autoUpdateIntervalRef.current) {
      clearInterval(autoUpdateIntervalRef.current)
      autoUpdateIntervalRef.current = null
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
      if (autoUpdateIntervalRef.current) {
        clearInterval(autoUpdateIntervalRef.current)
      }
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedPackage) {
      setError("Please select a package")
      return
    }

    if (!latitude || !longitude) {
      setError("Please enter latitude and longitude")
      return
    }

    const lat = parseFloat(latitude)
    const lng = parseFloat(longitude)

    if (isNaN(lat) || isNaN(lng)) {
      setError("Please enter valid coordinates")
      return
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      setError("Invalid coordinates. Latitude must be between -90 and 90, longitude between -180 and 180")
      return
    }

    try {
      setSubmitting(true)
      setError("")
      setSuccess("")

      await updateLocation(selectedPackage.tracking_id, lat, lng)
      
      setSuccess(`Location updated successfully for ${selectedPackage.tracking_id}`)
      setLatitude("")
      setLongitude("")
      
      setTimeout(() => {
        setSuccess("")
      }, 5000)
    } catch (err) {
      console.error("Location update error:", err)
      const errorMessage = err instanceof Error ? err.message : "Failed to update location"
      setError(errorMessage)
    } finally {
      setSubmitting(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated || !user || !["delivery_staff", "manager"].includes(user.role)) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Delivery Staff - Location Update
          </h1>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md text-green-700 text-sm">
              {success}
            </div>
          )}

          <div className="bg-white rounded-lg shadow-md p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Package Selection */}
              <div className="space-y-2">
                <Label htmlFor="package-select">Select Package</Label>
                <select
                  id="package-select"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={selectedPackage?.tracking_id || ""}
                  onChange={(e) => {
                    const pkg = packages.find((p) => p.tracking_id === e.target.value)
                    setSelectedPackage(pkg || null)
                    // Clear previous location when selecting new package
                    if (pkg) {
                      setLatitude("")
                      setLongitude("")
                      setError("")
                      setSuccess("")
                      setUpdateCount(0)
                      setLastUpdateTime(null)
                      // Stop auto-tracking if active
                      if (isAutoTracking) {
                        handleStopAutoTracking()
                      }
                    }
                  }}
                  required
                  disabled={submitting}
                >
                  <option value="">-- Select a package --</option>
                  {packages.map((pkg) => (
                    <option key={pkg.id} value={pkg.tracking_id}>
                      {pkg.tracking_id} - {pkg.sender.name} → {pkg.recipient.name} ({pkg.status})
                    </option>
                  ))}
                </select>
                {packages.length === 0 && (
                  <p className="text-sm text-gray-500">
                    No active packages found. Packages must be in "registered" or "in_transit" status.
                  </p>
                )}
              </div>

              {/* Location Input */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="latitude">Latitude</Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="any"
                    placeholder="28.7041"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    required
                    disabled={submitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="longitude">Longitude</Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="any"
                    placeholder="77.1025"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    required
                    disabled={submitting}
                  />
                </div>
              </div>

              {/* Location Buttons */}
              <div className="flex gap-2 flex-wrap">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGetCurrentLocation}
                  disabled={submitting || isAutoTracking || !navigator.geolocation}
                >
                  📍 Get Current Location
                </Button>
                {!isAutoTracking ? (
                  <Button
                    type="button"
                    variant="default"
                    onClick={handleStartAutoTracking}
                    disabled={submitting || !selectedPackage || !navigator.geolocation}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    ▶️ Start Live Tracking
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleStopAutoTracking}
                    disabled={submitting}
                  >
                    ⏹️ Stop Live Tracking
                  </Button>
                )}
              </div>
              {isAutoTracking && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm text-green-700 font-medium">
                    🟢 Live tracking active - Location updates every 10 seconds
                  </p>
                  {lastUpdateTime && (
                    <p className="text-xs text-green-600 mt-1">
                      Last update: {lastUpdateTime.toLocaleTimeString()} | Total updates: {updateCount}
                    </p>
                  )}
                </div>
              )}
              {!navigator.geolocation && (
                <p className="text-xs text-gray-500 mt-1">
                  Geolocation not supported in this browser
                </p>
              )}

              {/* Submit Button */}
              <div className="flex gap-4">
                <Button 
                  type="submit" 
                  disabled={submitting || !selectedPackage || isAutoTracking}
                >
                  {submitting ? "Updating..." : "Update Location Manually"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (isAutoTracking) {
                      handleStopAutoTracking()
                    }
                    setSelectedPackage(null)
                    setLatitude("")
                    setLongitude("")
                    setError("")
                    setSuccess("")
                    setUpdateCount(0)
                    setLastUpdateTime(null)
                  }}
                  disabled={submitting}
                >
                  Clear
                </Button>
              </div>
              {isAutoTracking && (
                <p className="text-xs text-gray-500 mt-2">
                  💡 Manual updates are disabled while auto-tracking is active. Use "Stop Live Tracking" to switch back.
                </p>
              )}
            </form>

            {/* Selected Package Info */}
            {selectedPackage && (
              <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-3 text-lg">📦 Selected Package Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500 mb-1">Tracking ID</p>
                    <p className="font-mono font-semibold text-gray-900">{selectedPackage.tracking_id}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">Status</p>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      selectedPackage.status === "registered" ? "bg-blue-100 text-blue-800" :
                      selectedPackage.status === "in_transit" ? "bg-yellow-100 text-yellow-800" :
                      "bg-green-100 text-green-800"
                    }`}>
                      {selectedPackage.status.replace("_", " ").toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">From (Sender)</p>
                    <p className="font-medium text-gray-900">{selectedPackage.sender.name}</p>
                    <p className="text-gray-600 text-xs">{selectedPackage.sender.address}</p>
                    <p className="text-gray-500 text-xs mt-1">📞 {selectedPackage.sender.phone}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">To (Recipient)</p>
                    <p className="font-medium text-gray-900">{selectedPackage.recipient.name}</p>
                    <p className="text-gray-600 text-xs">{selectedPackage.recipient.address}</p>
                    <p className="text-gray-500 text-xs mt-1">📞 {selectedPackage.recipient.phone}</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-blue-200">
                  <p className="text-xs text-gray-600">
                    💡 <strong>Next Steps:</strong> Get your current location or start live tracking to update the package location for customers.
                  </p>
                </div>
              </div>
            )}
            
            {!selectedPackage && (
              <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  ⚠️ Please select a package from the dropdown above to start updating location.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

