"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { getPackageByTrackingId, Package } from "@/lib/api/packages"
import { getRouteHistory, LocationUpdate, getETA, ETA } from "@/lib/api/tracking"
import { TrackingWebSocket } from "@/lib/websocket"
import Map from "@/components/Map"
import ETADisplay from "@/components/ETADisplay"
import StatusBadge from "@/components/StatusBadge"
import { Button } from "@/components/ui/button"
import Link from "next/link"

// Status colors and labels moved to StatusBadge component

export default function PackageDetailPage() {
  const params = useParams()
  const router = useRouter()
  const trackingId = params.tracking_id as string
  const [pkg, setPkg] = useState<Package | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [routeHistory, setRouteHistory] = useState<LocationUpdate[]>([])
  const [currentLocation, setCurrentLocation] = useState<LocationUpdate | null>(null)
  const [wsStatus, setWsStatus] = useState<"connecting" | "connected" | "disconnected">("disconnected")
  const [eta, setEta] = useState<ETA | null>(null)
  const [etaLoading, setEtaLoading] = useState(false)
  const wsRef = useRef<TrackingWebSocket | null>(null)

  const fetchPackage = async () => {
    try {
      setLoading(true)
      setError("")
      const packageData = await getPackageByTrackingId(trackingId)
      setPkg(packageData)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Package not found")
    } finally {
      setLoading(false)
    }
  }

  const fetchRouteHistory = async () => {
    try {
      const history = await getRouteHistory(trackingId)
      setRouteHistory(history.locations)
      
      // Set current location to the most recent update
      if (history.locations.length > 0) {
        setCurrentLocation(history.locations[history.locations.length - 1])
      }
    } catch (err) {
      console.error("Failed to fetch route history:", err)
      // Don't show error to user, just log it
    }
  }

  const fetchETA = async () => {
    if (!pkg || pkg.status === "delivered") {
      setEta(null)
      return
    }

    try {
      setEtaLoading(true)
      const etaData = await getETA(trackingId)
      setEta(etaData)
    } catch (err) {
      console.error("Failed to fetch ETA:", err)
      // Don't show error if ETA is not available (package might not have location updates yet)
      setEta(null)
    } finally {
      setEtaLoading(false)
    }
  }

  useEffect(() => {
    if (trackingId) {
      fetchPackage()
      fetchRouteHistory()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackingId])

  useEffect(() => {
    if (pkg && trackingId) {
      fetchETA()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pkg, trackingId])

  // WebSocket connection for real-time updates
  useEffect(() => {
    if (!trackingId || !pkg) return

    setWsStatus("connecting")
    wsRef.current = new TrackingWebSocket(trackingId, {
      onConnected: () => {
        setWsStatus("connected")
      },
      onLocationUpdate: (data: LocationUpdate) => {
        console.log("📍 Real-time location update received:", data)
        // Update current location immediately
        setCurrentLocation(data)
        
        // Add to route history if not already present
        setRouteHistory((prev) => {
          // Check if this location already exists
          const exists = prev.some(
            (loc) => loc.id === data.id || 
            (loc.timestamp === data.timestamp && 
             Math.abs(loc.latitude - data.latitude) < 0.0001 && 
             Math.abs(loc.longitude - data.longitude) < 0.0001)
          )
          
          if (!exists) {
            // Add new location and sort by timestamp
            const updated = [...prev, data].sort(
              (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
            )
            console.log("✅ Route history updated, total points:", updated.length)
            return updated
          }
          return prev
        })
        
        // Recalculate ETA after location update
        if (pkg && pkg.status !== "delivered") {
          fetchETA()
        }
      },
      onError: (error) => {
        console.error("WebSocket error:", error)
        setWsStatus("disconnected")
      },
      onDisconnect: () => {
        setWsStatus("disconnected")
      },
    })

    wsRef.current.connect()

    return () => {
      wsRef.current?.disconnect()
    }
  }, [trackingId, pkg])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  if (error || !pkg) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Package Not Found
            </h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="flex gap-4 justify-center">
              <Button onClick={() => router.back()}>Go Back</Button>
              <Link href="/packages">
                <Button variant="outline">View All Packages</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Link href="/packages">
              <Button variant="outline" className="mb-4">
                ← Back to Packages
              </Button>
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">
              Package Details
            </h1>
          </div>

          <div className="bg-white rounded-lg shadow-md p-8">
            {/* Header */}
            <div className="flex justify-between items-start mb-6 pb-6 border-b">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {pkg.tracking_id}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Created: {new Date(pkg.created_at).toLocaleString()}
                </p>
              </div>
              <StatusBadge status={pkg.status} size="lg" />
            </div>

            {/* ETA Display */}
            {eta && pkg.status !== "delivered" && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <ETADisplay
                  eta={eta.eta}
                  formattedEta={eta.formatted_eta}
                  timeRemainingMinutes={eta.time_remaining_minutes}
                />
              </div>
            )}
            
            {etaLoading && pkg.status !== "delivered" && (
              <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-sm text-gray-600">Calculating ETA...</p>
              </div>
            )}

            {/* Sender and Recipient */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
              <div className="bg-blue-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Sender
                </h3>
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="font-medium text-gray-900">{pkg.sender.name}</p>
                  <p className="text-sm text-gray-500">Address</p>
                  <p className="text-gray-700">{pkg.sender.address}</p>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="text-gray-700">{pkg.sender.phone}</p>
                </div>
              </div>

              <div className="bg-green-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Recipient
                </h3>
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="font-medium text-gray-900">
                    {pkg.recipient.name}
                  </p>
                  <p className="text-sm text-gray-500">Address</p>
                  <p className="text-gray-700">{pkg.recipient.address}</p>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="text-gray-700">{pkg.recipient.phone}</p>
                </div>
              </div>
            </div>

            {/* Real-time Tracking Map */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  📍 Route Map
                </h3>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      wsStatus === "connected"
                        ? "bg-green-500"
                        : wsStatus === "connecting"
                        ? "bg-yellow-500"
                        : "bg-red-500"
                    }`}
                  />
                  <span className="text-sm text-gray-600">
                    {wsStatus === "connected"
                      ? "Live Tracking"
                      : wsStatus === "connecting"
                      ? "Connecting..."
                      : "Disconnected"}
                  </span>
                </div>
              </div>
              {pkg && (
                <Map
                  senderLocation={{
                    latitude: pkg.sender.latitude,
                    longitude: pkg.sender.longitude,
                  }}
                  recipientLocation={{
                    latitude: pkg.recipient.latitude,
                    longitude: pkg.recipient.longitude,
                  }}
                  routeHistory={routeHistory.map((loc) => ({
                    latitude: loc.latitude,
                    longitude: loc.longitude,
                    timestamp: loc.timestamp,
                  }))}
                  currentLocation={
                    currentLocation
                      ? {
                          latitude: currentLocation.latitude,
                          longitude: currentLocation.longitude,
                          timestamp: currentLocation.timestamp,
                        }
                      : undefined
                  }
                  height="500px"
                />
              )}
              <div className="mt-2 space-y-1">
                {currentLocation && (
                  <p className="text-sm text-green-600 font-medium">
                    🚚 Delivery vehicle location updated: {new Date(currentLocation.timestamp).toLocaleTimeString()}
                  </p>
                )}
                {routeHistory.length > 0 && (
                  <p className="text-sm text-gray-500">
                    {routeHistory.length} location update{routeHistory.length !== 1 ? "s" : ""} recorded
                  </p>
                )}
                {!currentLocation && routeHistory.length === 0 && (
                  <p className="text-sm text-gray-500">
                    Waiting for delivery staff to start tracking...
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

