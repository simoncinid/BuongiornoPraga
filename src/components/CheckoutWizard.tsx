"use client";
import { ReservationFlow } from "./ReservationFlow";
import type { Tour,TourSlot } from "@/lib/types";
export function CheckoutWizard(_: {tour:Tour;slot:TourSlot;adults:number;children:number}) { return <ReservationFlow mode="checkout"/>; }
