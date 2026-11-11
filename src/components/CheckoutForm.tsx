"use client";
import { ReservationFlow } from "./ReservationFlow";
import type { Tour } from "@/lib/types";
export function CheckoutForm(_: {tour:Tour;slotId:string;adults:number;children:number}) { return <ReservationFlow mode="checkout"/>; }
