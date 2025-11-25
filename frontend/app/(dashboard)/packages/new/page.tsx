"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/AuthContext"
import { createPackage, SenderRecipient } from "@/lib/api/packages"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function NewPackagePage() {
  const router = useRouter()
  const { isAuthenticated, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState<{
    sender: SenderRecipient
    recipient: SenderRecipient
  }>({
    sender: {
      name: "",
      address: "",
      phone: "",
      latitude: 0,
      longitude: 0,
    },
    recipient: {
      name: "",
      address: "",
      phone: "",
      latitude: 0,
      longitude: 0,
    },
  })

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    router.push("/login")
    return null
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    type: "sender" | "recipient"
  ) => {
    const value = e.target.type === "number" 
      ? parseFloat(e.target.value) || 0
      : e.target.value;
    
    setFormData({
      ...formData,
      [type]: {
        ...formData[type],
        [e.target.name]: value,
      },
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    // Check authentication
    if (!isAuthenticated) {
      setError("You must be logged in to create a package")
      setLoading(false)
      router.push("/login")
      return
    }

    // Validate form data with detailed checks
    if (!formData.sender.name || formData.sender.name.trim().length < 2) {
      setError("Sender name must be at least 2 characters")
      setLoading(false)
      return
    }

    if (!formData.sender.address || formData.sender.address.trim().length < 5) {
      setError("Sender address must be at least 5 characters")
      setLoading(false)
      return
    }

    if (!formData.sender.phone || formData.sender.phone.trim().length < 10) {
      setError("Sender phone must be at least 10 characters")
      setLoading(false)
      return
    }

    if (!formData.recipient.name || formData.recipient.name.trim().length < 2) {
      setError("Recipient name must be at least 2 characters")
      setLoading(false)
      return
    }

    if (!formData.recipient.address || formData.recipient.address.trim().length < 5) {
      setError("Recipient address must be at least 5 characters")
      setLoading(false)
      return
    }

    if (!formData.recipient.phone || formData.recipient.phone.trim().length < 10) {
      setError("Recipient phone must be at least 10 characters")
      setLoading(false)
      return
    }

    // Validate coordinates
    const senderLat = Number(formData.sender.latitude)
    const senderLng = Number(formData.sender.longitude)
    const recipientLat = Number(formData.recipient.latitude)
    const recipientLng = Number(formData.recipient.longitude)

    if (isNaN(senderLat) || isNaN(senderLng) || senderLat === 0 || senderLng === 0) {
      setError("Please provide valid sender location coordinates (latitude and longitude)")
      setLoading(false)
      return
    }

    if (senderLat < -90 || senderLat > 90 || senderLng < -180 || senderLng > 180) {
      setError("Sender coordinates are out of range. Latitude: -90 to 90, Longitude: -180 to 180")
      setLoading(false)
      return
    }

    if (isNaN(recipientLat) || isNaN(recipientLng) || recipientLat === 0 || recipientLng === 0) {
      setError("Please provide valid recipient location coordinates (latitude and longitude)")
      setLoading(false)
      return
    }

    if (recipientLat < -90 || recipientLat > 90 || recipientLng < -180 || recipientLng > 180) {
      setError("Recipient coordinates are out of range. Latitude: -90 to 90, Longitude: -180 to 180")
      setLoading(false)
      return
    }

    try {
      // Prepare data with proper types
      const packageData = {
        sender: {
          name: formData.sender.name.trim(),
          address: formData.sender.address.trim(),
          phone: formData.sender.phone.trim(),
          latitude: senderLat,
          longitude: senderLng,
        },
        recipient: {
          name: formData.recipient.name.trim(),
          address: formData.recipient.address.trim(),
          phone: formData.recipient.phone.trim(),
          latitude: recipientLat,
          longitude: recipientLng,
        },
        status: "registered" as const,
      }

      console.log("📦 Submitting package:", packageData)
      const newPackage = await createPackage(packageData)
      console.log("✅ Package created:", newPackage.tracking_id)
      router.push(`/packages/${newPackage.tracking_id}`)
    } catch (err) {
      console.error("❌ Package creation error:", err)
      const errorMessage = err instanceof Error ? err.message : "Failed to create package"
      
      // Provide helpful error messages
      if (errorMessage.includes("authentication") || errorMessage.includes("401") || errorMessage.includes("Invalid") || errorMessage.includes("Authentication required")) {
        setError("Authentication failed. Please log in again.")
        setTimeout(() => router.push("/login"), 2000)
      } else if (errorMessage.includes("Cannot connect")) {
        setError("Cannot connect to server. Please check if the backend is running on port 8000.")
      } else if (errorMessage.includes("422") || errorMessage.includes("validation") || errorMessage.includes("String should")) {
        // Parse validation errors from backend
        try {
          const errorDetails = JSON.parse(errorMessage)
          if (errorDetails.detail && Array.isArray(errorDetails.detail)) {
            const validationErrors = errorDetails.detail.map((err: any) => {
              const field = err.loc?.join(".") || "field"
              return `${field}: ${err.msg}`
            }).join(", ")
            setError(`Validation error: ${validationErrors}`)
          } else {
            setError(errorMessage)
          }
        } catch {
          setError(errorMessage)
        }
      } else {
        setError(errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Create New Package
          </h1>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Sender Information */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Sender Information
                </h2>
                <div className="space-y-2">
                  <Label htmlFor="sender-name">Name</Label>
                  <Input
                    id="sender-name"
                    name="name"
                    type="text"
                    required
                    value={formData.sender.name}
                    onChange={(e) => handleChange(e, "sender")}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sender-address">Address</Label>
                  <Input
                    id="sender-address"
                    name="address"
                    type="text"
                    required
                    value={formData.sender.address}
                    onChange={(e) => handleChange(e, "sender")}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sender-phone">Phone</Label>
                  <Input
                    id="sender-phone"
                    name="phone"
                    type="tel"
                    required
                    value={formData.sender.phone}
                    onChange={(e) => handleChange(e, "sender")}
                    disabled={loading}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label htmlFor="sender-latitude">Latitude</Label>
                    <Input
                      id="sender-latitude"
                      name="latitude"
                      type="number"
                      step="any"
                      required
                      placeholder="28.7041"
                      value={formData.sender.latitude || ""}
                      onChange={(e) => handleChange(e, "sender")}
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sender-longitude">Longitude</Label>
                    <Input
                      id="sender-longitude"
                      name="longitude"
                      type="number"
                      step="any"
                      required
                      placeholder="77.1025"
                      value={formData.sender.longitude || ""}
                      onChange={(e) => handleChange(e, "sender")}
                      disabled={loading}
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  💡 Tip: Use Google Maps to find coordinates. Right-click on location → "What's here?" to see lat/long
                </p>
              </div>

              {/* Recipient Information */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Recipient Information
                </h2>
                <div className="space-y-2">
                  <Label htmlFor="recipient-name">Name</Label>
                  <Input
                    id="recipient-name"
                    name="name"
                    type="text"
                    required
                    value={formData.recipient.name}
                    onChange={(e) => handleChange(e, "recipient")}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="recipient-address">Address</Label>
                  <Input
                    id="recipient-address"
                    name="address"
                    type="text"
                    required
                    value={formData.recipient.address}
                    onChange={(e) => handleChange(e, "recipient")}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="recipient-phone">Phone</Label>
                  <Input
                    id="recipient-phone"
                    name="phone"
                    type="tel"
                    required
                    value={formData.recipient.phone}
                    onChange={(e) => handleChange(e, "recipient")}
                    disabled={loading}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label htmlFor="recipient-latitude">Latitude</Label>
                    <Input
                      id="recipient-latitude"
                      name="latitude"
                      type="number"
                      step="any"
                      required
                      placeholder="28.7041"
                      value={formData.recipient.latitude || ""}
                      onChange={(e) => handleChange(e, "recipient")}
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="recipient-longitude">Longitude</Label>
                    <Input
                      id="recipient-longitude"
                      name="longitude"
                      type="number"
                      step="any"
                      required
                      placeholder="77.1025"
                      value={formData.recipient.longitude || ""}
                      onChange={(e) => handleChange(e, "recipient")}
                      disabled={loading}
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  💡 Tip: Use Google Maps to find coordinates. Right-click on location → "What's here?" to see lat/long
                </p>
              </div>
            </div>

            <div className="mt-8 flex gap-4">
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Package"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

