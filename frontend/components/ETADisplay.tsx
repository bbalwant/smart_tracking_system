"use client"

import { useState, useEffect } from "react"

interface ETADisplayProps {
  eta: string // ISO datetime string
  formattedEta?: string
  timeRemainingMinutes?: number
  className?: string
}

export default function ETADisplay({
  eta,
  formattedEta,
  timeRemainingMinutes,
  className = "",
}: ETADisplayProps) {
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)
  const [isOverdue, setIsOverdue] = useState(false)

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const etaDate = new Date(eta)
      const now = new Date()
      const diff = etaDate.getTime() - now.getTime()
      const minutes = Math.floor(diff / 60000)

      if (minutes < 0) {
        setIsOverdue(true)
        setTimeRemaining(0)
      } else {
        setIsOverdue(false)
        setTimeRemaining(minutes)
      }
    }

    calculateTimeRemaining()
    const interval = setInterval(calculateTimeRemaining, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [eta])

  const formatTime = (minutes: number) => {
    if (minutes < 0) return "Arrived"
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }

  const displayTime = timeRemainingMinutes !== undefined 
    ? timeRemainingMinutes 
    : timeRemaining ?? 0

  return (
    <div className={`${className}`}>
      {isOverdue ? (
        <div className="flex items-center gap-2">
          <span className="text-2xl">✅</span>
          <div>
            <p className="text-sm text-gray-500">Status</p>
            <p className="text-lg font-semibold text-green-600">Arrived / Delivered</p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <span className="text-2xl">⏰</span>
          <div>
            <p className="text-sm text-gray-500">Estimated Arrival</p>
            <p className="text-lg font-semibold text-blue-600">
              {formattedEta || formatTime(displayTime)}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {new Date(eta).toLocaleString()}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

