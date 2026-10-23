import { NextResponse } from "next/server";
import { SCENARIOS } from "@sangamora/core";

export const GET = () => NextResponse.json(SCENARIOS);