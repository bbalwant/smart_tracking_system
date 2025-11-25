/**
 * Next.js API route proxy for package operations
 * This routes requests through Next.js server to avoid CORS issues
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const authHeader = request.headers.get("authorization");

    if (!authHeader) {
      return Response.json(
        { detail: "Authentication required" },
        { status: 401 }
      );
    }

    const response = await fetch(`${BACKEND_URL}/api/packages`, {
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
    console.error("Package creation error:", error);
    return Response.json(
      {
        detail: error.message || "Failed to create package",
        error: String(error),
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const url = new URL(request.url);
    const status = url.searchParams.get("status");

    if (!authHeader) {
      return Response.json(
        { detail: "Authentication required" },
        { status: 401 }
      );
    }

    const backendUrl = status
      ? `${BACKEND_URL}/api/packages?status=${status}`
      : `${BACKEND_URL}/api/packages`;

    const response = await fetch(backendUrl, {
      method: "GET",
      headers: {
        Authorization: authHeader,
      },
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

    return Response.json(data);
  } catch (error: any) {
    console.error("Package list error:", error);
    return Response.json(
      {
        detail: error.message || "Failed to fetch packages",
        error: String(error),
      },
      { status: 500 }
    );
  }
}

