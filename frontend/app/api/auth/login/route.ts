/**
 * Next.js API route proxy for login
 * This routes requests through Next.js server to avoid CORS issues
 */

export async function POST(request: Request) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  
  try {
    const body = await request.json();
    
    const response = await fetch(`${apiUrl}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return Response.json(data, { status: response.status });
    }
    
    return Response.json(data);
  } catch (error: any) {
    return Response.json(
      {
        detail: error.message || "Login failed",
        error: String(error),
      },
      { status: 500 }
    );
  }
}

