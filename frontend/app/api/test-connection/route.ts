/**
 * API route to test backend connection from server-side
 * This helps debug connection issues
 */

export async function GET() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  
  try {
    const response = await fetch(`${apiUrl}/health`, {
      cache: "no-store",
    });
    
    const data = await response.json();
    
    return Response.json({
      success: true,
      apiUrl,
      backendStatus: data,
      message: "Backend is reachable from Next.js server"
    });
  } catch (error: any) {
    return Response.json({
      success: false,
      apiUrl,
      error: error.message || String(error),
      errorType: error.constructor?.name,
      message: "Cannot reach backend from Next.js server"
    }, { status: 500 });
  }
}

