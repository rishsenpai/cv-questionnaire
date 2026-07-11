import { NextRequest, NextResponse } from 'next/server';
import { getClientIP } from '@/lib/server/auth';
import { getGeoFromIP } from '@/lib/server/analytics';

// Land van de bezoeker (ISO-code, bv. 'SR'), voor de standaard landfilter op
// de vacaturepagina. Op Vercel is dit gratis via de x-vercel-ip-country
// header; lokaal/elders valt het terug op dezelfde ip-api lookup die de
// analytics gebruikt. We slaan hier niets op.
export async function GET(req: NextRequest) {
    const vercelCountry = req.headers.get('x-vercel-ip-country');
    if (vercelCountry) {
        return NextResponse.json({ success: true, countryCode: vercelCountry });
    }
    const geo = await getGeoFromIP(getClientIP(req));
    return NextResponse.json({ success: true, countryCode: geo?.countryCode || null });
}
