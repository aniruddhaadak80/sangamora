import { NextResponse } from "next/server";
import { MELA_DAYS } from "@sangamora/core";

export const GET = () => NextResponse.json(MELA_DAYS);