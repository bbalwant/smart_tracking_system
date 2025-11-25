/**
 * Next.js API route proxy for location updates
 * This routes requests through Next.js server to avoid CORS issues
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function POST(
  request: Request,
  context: { params: Promise<{ tracking_id: string }> | { tracking_id: string } }
) {
  try {
    const params = await Promise.resolve(context.params);
    const { tracking_id } = params;
    const body = await request.json();
    const authHeader = request.headers.get("authorization");

    if (!authHeader) {
      return Response.json(
        { detail: "Authentication required" },
        { status: 401 }
      );
    }

    if (!tracking_id) {
      return Response.json(
        { detail: "Tracking ID is required" },
        { status: 400 }
      );
    }

    const response = await fetch(`${BACKEND_URL}/api/tracking/${tracking_id}/update`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify(body),
    });

    // Handle non-JSON responses
    const contentType = response.headers.get("content-type");
    let data;
    
    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = { detail: text || "Unknown error" };
    }

    if (!response.ok) {
      return Response.json(data, { status: response.status });
    }

    return Response.json(data, { status: 201 });
  } catch (error: any) {
    console.error("Location update error:", error);
    return Response.json(
      {
        detail: error.message || "Failed to update location",
        error: String(error),
      },
      { status: 500 }
    );
  }
}

