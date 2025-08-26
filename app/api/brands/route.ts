import { NextResponse } from "next/server";
import { getBrands } from "@/lib/venues";

export async function GET() {
  try {
    const result = await getBrands();
    
    if (result.error) {
      console.error("Error fetching brands:", result.error);
      return NextResponse.json(
        { error: "Failed to fetch brands" },
        { status: 500 }
      );
    }

    return NextResponse.json(result.data || []);
  } catch (error) {
    console.error("Error in brands API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
