"use client"

import { Package } from "@/lib/api/packages"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import StatusBadge from "@/components/StatusBadge"

interface PackageCardProps {
  package: Package
}

export function PackageCard({ package: pkg }: PackageCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {pkg.tracking_id}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Created: {new Date(pkg.created_at).toLocaleDateString()}
          </p>
        </div>
        <StatusBadge status={pkg.status} size="sm" />
      </div>

      <div className="space-y-3 mb-4">
        <div>
          <p className="text-xs text-gray-500 uppercase">From</p>
          <p className="text-sm font-medium text-gray-900">{pkg.sender.name}</p>
          <p className="text-xs text-gray-600">{pkg.sender.address}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase">To</p>
          <p className="text-sm font-medium text-gray-900">
            {pkg.recipient.name}
          </p>
          <p className="text-xs text-gray-600">{pkg.recipient.address}</p>
        </div>
      </div>

      <Link href={`/packages/${pkg.tracking_id}`}>
        <Button variant="outline" className="w-full">
          View Details
        </Button>
      </Link>
    </div>
  )
}

