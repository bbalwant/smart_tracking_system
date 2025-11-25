"use client"

import { useMemo, useState, useEffect } from "react"
import { GoogleMap, LoadScript, Marker, Polyline, InfoWindow, DirectionsRenderer } from "@react-google-maps/api"

export interface Location {
  latitude: number
  longitude: number
  timestamp?: string
}

interface MapProps {
  senderLocation: Location
  recipientLocation: Location
  routeHistory?: Location[]
  currentLocation?: Location
  height?: string
}

const containerStyle = {
  width: "100%",
  height: "400px",
}

const defaultCenter = {
  lat: 28.7041,
  lng: 77.1025,
}

export default function Map({
  senderLocation,
  recipientLocation,
  routeHistory = [],
  currentLocation,
  height = "400px",
}: MapProps) {
  // Get Google Maps API key from environment
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_MAPS_API_KEY || ""
  const [selectedMarker, setSelectedMarker] = useState<string | null>(null)
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null)
  const [directionsService, setDirectionsService] = useState<google.maps.DirectionsService | null>(null)
  const [isDirectionsLoading, setIsDirectionsLoading] = useState(false)

  // Calculate center point
  const center = useMemo(() => {
    const validLocations: { lat: number; lng: number }[] = []
    
    if (senderLocation.latitude !== 0 && senderLocation.longitude !== 0) {
      validLocations.push({
        lat: senderLocation.latitude,
        lng: senderLocation.longitude,
      })
    }
    
    if (recipientLocation.latitude !== 0 && recipientLocation.longitude !== 0) {
      validLocations.push({
        lat: recipientLocation.latitude,
        lng: recipientLocation.longitude,
      })
    }
    
    if (validLocations.length === 0) {
      return defaultCenter
    }
    
    if (validLocations.length === 1) {
      return validLocations[0]
    }
    
    // Calculate center of all points
    const avgLat = validLocations.reduce((sum, loc) => sum + loc.lat, 0) / validLocations.length
    const avgLng = validLocations.reduce((sum, loc) => sum + loc.lng, 0) / validLocations.length
    
    return { lat: avgLat, lng: avgLng }
  }, [senderLocation, recipientLocation])

  // Build route path for polyline (actual route taken)
  const routePath = useMemo(() => {
    const path: { lat: number; lng: number }[] = []
    
    // Start with sender location
    if (senderLocation.latitude !== 0 && senderLocation.longitude !== 0) {
      path.push({ lat: senderLocation.latitude, lng: senderLocation.longitude })
    }
    
    // Add route history points in chronological order
    if (routeHistory && routeHistory.length > 0) {
      const sortedHistory = [...routeHistory].sort(
        (a, b) => {
          const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0
          const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0
          return timeA - timeB
        }
      )
      
      sortedHistory.forEach((loc) => {
        if (loc.latitude !== 0 && loc.longitude !== 0) {
          // Avoid duplicate consecutive points
          const lastPoint = path[path.length - 1]
          if (!lastPoint || 
              Math.abs(lastPoint.lat - loc.latitude) > 0.0001 || 
              Math.abs(lastPoint.lng - loc.longitude) > 0.0001) {
            path.push({ lat: loc.latitude, lng: loc.longitude })
          }
        }
      })
    }
    
    // Add current location if exists and different from last route point
    if (currentLocation && currentLocation.latitude !== 0 && currentLocation.longitude !== 0) {
      const lastPoint = path[path.length - 1]
      if (!lastPoint || 
          Math.abs(lastPoint.lat - currentLocation.latitude) > 0.0001 || 
          Math.abs(lastPoint.lng - currentLocation.longitude) > 0.0001) {
        path.push({ lat: currentLocation.latitude, lng: currentLocation.longitude })
      }
    }
    
    console.log("🗺️ Route path calculated:", {
      pathLength: path.length,
      hasSender: senderLocation.latitude !== 0,
      historyPoints: routeHistory?.length || 0,
      hasCurrent: !!currentLocation,
      path: path
    })
    
    return path
  }, [senderLocation, routeHistory, currentLocation])

  // Calculate bounds for all markers
  const bounds = useMemo(() => {
    const allPoints: { lat: number; lng: number }[] = []
    
    if (senderLocation.latitude !== 0 && senderLocation.longitude !== 0) {
      allPoints.push({
        lat: senderLocation.latitude,
        lng: senderLocation.longitude,
      })
    }
    
    if (recipientLocation.latitude !== 0 && recipientLocation.longitude !== 0) {
      allPoints.push({
        lat: recipientLocation.latitude,
        lng: recipientLocation.longitude,
      })
    }
    
    routePath.forEach((point) => allPoints.push(point))
    
    if (allPoints.length === 0) {
      return undefined
    }
    
    const lats = allPoints.map((p) => p.lat)
    const lngs = allPoints.map((p) => p.lng)
    
    return {
      north: Math.max(...lats),
      south: Math.min(...lats),
      east: Math.max(...lngs),
      west: Math.min(...lngs),
    }
  }, [senderLocation, recipientLocation, routePath])

  const mapContainerStyle = {
    ...containerStyle,
    height,
  }

  // If no API key, show placeholder
  if (!apiKey) {
    return (
      <div
        style={{ height, width: "100%" }}
        className="rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300"
      >
        <div className="text-center p-8">
          <p className="text-gray-600 mb-2">📍 Google Maps</p>
          <p className="text-sm text-gray-500 mb-4">
            Please add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your .env.local file
          </p>
          <p className="text-xs text-gray-400">
            Get your API key from{" "}
            <a
              href="https://console.cloud.google.com/google/maps-apis"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              Google Cloud Console
            </a>
          </p>
        </div>
      </div>
    )
  }

  // Calculate actual route using Directions API
  useEffect(() => {
    if (!directionsService || !window.google) return
    
    // Only calculate route if we have valid sender and recipient
    if (
      senderLocation.latitude === 0 || senderLocation.longitude === 0 ||
      recipientLocation.latitude === 0 || recipientLocation.longitude === 0
    ) {
      return
    }

    // Determine origin and destination
    let origin: { lat: number; lng: number }
    let destination: { lat: number; lng: number } = {
      lat: recipientLocation.latitude,
      lng: recipientLocation.longitude
    }

    // If we have current location, use it as origin, otherwise use sender
    if (currentLocation && currentLocation.latitude !== 0 && currentLocation.longitude !== 0) {
      origin = {
        lat: currentLocation.latitude,
        lng: currentLocation.longitude
      }
    } else {
      origin = {
        lat: senderLocation.latitude,
        lng: senderLocation.longitude
      }
    }

    setIsDirectionsLoading(true)
    
    directionsService.route(
      {
        origin: origin,
        destination: destination,
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        setIsDirectionsLoading(false)
        if (status === window.google.maps.DirectionsStatus.OK && result) {
          console.log("✅ Directions calculated:", result)
          setDirections(result)
        } else {
          console.error("❌ Directions request failed:", status)
          setDirections(null)
        }
      }
    )
  }, [directionsService, senderLocation, recipientLocation, currentLocation])

  return (
    <div style={{ height, width: "100%" }} className="rounded-lg overflow-hidden">
      <LoadScript 
        googleMapsApiKey={apiKey}
        libraries={["places", "directions"]}
      >
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={center}
          zoom={13}
          options={{
            zoomControl: true,
            streetViewControl: false,
            mapTypeControl: true,
            fullscreenControl: true,
          }}
          onLoad={(map) => {
            // Initialize Directions Service
            if (typeof window !== "undefined" && window.google) {
              setDirectionsService(new window.google.maps.DirectionsService())
            }
            
            // Fit bounds to show all markers
            if (bounds && typeof window !== "undefined" && window.google) {
              const googleBounds = new window.google.maps.LatLngBounds()
              googleBounds.extend(new window.google.maps.LatLng(bounds.north, bounds.east))
              googleBounds.extend(new window.google.maps.LatLng(bounds.south, bounds.west))
              map.fitBounds(googleBounds, { padding: 50 })
            }
          }}
          key={`map-${routePath.length}-${currentLocation?.latitude || 0}-${currentLocation?.longitude || 0}`}
        >
          {/* Sender Marker */}
          {senderLocation.latitude !== 0 && senderLocation.longitude !== 0 && (
            <>
              <Marker
                position={{
                  lat: senderLocation.latitude,
                  lng: senderLocation.longitude,
                }}
                icon={{
                  url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
                }}
                label={{
                  text: "S",
                  color: "white",
                  fontWeight: "bold",
                }}
                onClick={() => setSelectedMarker("sender")}
              />
              {selectedMarker === "sender" && (
                <InfoWindow
                  position={{
                    lat: senderLocation.latitude,
                    lng: senderLocation.longitude,
                  }}
                  onCloseClick={() => setSelectedMarker(null)}
                >
                  <div>
                    <strong>Sender</strong>
                    <br />
                    Lat: {senderLocation.latitude.toFixed(6)}
                    <br />
                    Lng: {senderLocation.longitude.toFixed(6)}
                  </div>
                </InfoWindow>
              )}
            </>
          )}

          {/* Recipient Marker */}
          {recipientLocation.latitude !== 0 && recipientLocation.longitude !== 0 && (
            <>
              <Marker
                position={{
                  lat: recipientLocation.latitude,
                  lng: recipientLocation.longitude,
                }}
                icon={{
                  url: "http://maps.google.com/mapfiles/ms/icons/green-dot.png",
                }}
                label={{
                  text: "R",
                  color: "white",
                  fontWeight: "bold",
                }}
                onClick={() => setSelectedMarker("recipient")}
              />
              {selectedMarker === "recipient" && (
                <InfoWindow
                  position={{
                    lat: recipientLocation.latitude,
                    lng: recipientLocation.longitude,
                  }}
                  onCloseClick={() => setSelectedMarker(null)}
                >
                  <div>
                    <strong>Recipient</strong>
                    <br />
                    Lat: {recipientLocation.latitude.toFixed(6)}
                    <br />
                    Lng: {recipientLocation.longitude.toFixed(6)}
                  </div>
                </InfoWindow>
              )}
            </>
          )}

          {/* Route History Markers */}
          {routeHistory.map((location, index) => (
            <Marker
              key={index}
              position={{
                lat: location.latitude,
                lng: location.longitude,
              }}
              icon={{
                url: "http://maps.google.com/mapfiles/ms/icons/grey-dot.png",
                scaledSize:
                  typeof window !== "undefined" && window.google
                    ? new window.google.maps.Size(20, 20)
                    : undefined,
              }}
              onClick={() => setSelectedMarker(`route-${index}`)}
            >
              {selectedMarker === `route-${index}` && (
                <InfoWindow
                  position={{
                    lat: location.latitude,
                    lng: location.longitude,
                  }}
                  onCloseClick={() => setSelectedMarker(null)}
                >
                  <div>
                    <strong>Update #{index + 1}</strong>
                    <br />
                    {location.timestamp && new Date(location.timestamp).toLocaleString()}
                  </div>
                </InfoWindow>
              )}
            </Marker>
          ))}

          {/* Current Location Marker */}
          {currentLocation &&
            currentLocation.latitude !== 0 &&
            currentLocation.longitude !== 0 && (
              <>
                <Marker
                  position={{
                    lat: currentLocation.latitude,
                    lng: currentLocation.longitude,
                  }}
                  icon={{
                    url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
                  }}
                  label={{
                    text: "C",
                    color: "white",
                    fontWeight: "bold",
                  }}
                  animation={
                    typeof window !== "undefined" && window.google
                      ? window.google.maps.Animation.BOUNCE
                      : undefined
                  }
                  onClick={() => setSelectedMarker("current")}
                />
                {selectedMarker === "current" && (
                  <InfoWindow
                    position={{
                      lat: currentLocation.latitude,
                      lng: currentLocation.longitude,
                    }}
                    onCloseClick={() => setSelectedMarker(null)}
                  >
                    <div>
                      <strong>Current Location</strong>
                      <br />
                      {currentLocation.timestamp &&
                        new Date(currentLocation.timestamp).toLocaleString()}
                    </div>
                  </InfoWindow>
                )}
              </>
            )}

          {/* Actual Route using Directions API (shows real road route) */}
          {directions && (
            <DirectionsRenderer
              directions={directions}
              options={{
                polylineOptions: {
                  strokeColor: "#3b82f6",
                  strokeWeight: 5,
                  strokeOpacity: 0.8,
                  zIndex: 2,
                },
                suppressMarkers: true, // We use our own markers
              }}
            />
          )}

          {/* Fallback: Actual Route Path (from sender through route history to current location) if Directions API fails */}
          {!directions && routePath.length >= 2 && (
            <Polyline
              key={`route-${routePath.length}-${routePath[routePath.length - 1]?.lat}-${routePath[routePath.length - 1]?.lng}`}
              path={routePath}
              options={{
                strokeColor: "#3b82f6",
                strokeWeight: 5,
                strokeOpacity: 0.8,
                zIndex: 2,
                geodesic: true,
                icons:
                  typeof window !== "undefined" && window.google
                    ? [
                        {
                          icon: {
                            path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                            scale: 3,
                            strokeColor: "#3b82f6",
                          },
                          offset: "50%",
                          repeat: "80px",
                        },
                      ]
                    : undefined,
              }}
            />
          )}

          {/* Direct route from sender to recipient (base route - only show if no directions) */}
          {!directions &&
            senderLocation.latitude !== 0 &&
            senderLocation.longitude !== 0 &&
            recipientLocation.latitude !== 0 &&
            recipientLocation.longitude !== 0 && (
              <Polyline
                path={[
                  { lat: senderLocation.latitude, lng: senderLocation.longitude },
                  { lat: recipientLocation.latitude, lng: recipientLocation.longitude },
                ]}
                options={{
                  strokeColor: "#94a3b8",
                  strokeWeight: 3,
                  strokeOpacity: 0.4,
                  zIndex: 1,
                  geodesic: true,
                }}
              />
            )}
        </GoogleMap>
      </LoadScript>
    </div>
  )
}
