import {NextResponse} from "next/server";
const gone=()=>NextResponse.json({error:"Endpoint sostituito: usare /api/platform"},{status:410});
export {gone as GET,gone as POST};
