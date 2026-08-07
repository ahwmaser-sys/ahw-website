import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/portal/db';

export async function GET() {
  try {
    const config = await prisma.integrationConfig.findFirst({
      where: { type: 'GOOGLE_BUSINESS' }
    });
    
    if (!config) return NextResponse.json({ error: 'No GOOGLE_BUSINESS config found' });
    
    const cred = config.metadata as { accessToken?: string };
    if (!cred?.accessToken) return NextResponse.json({ error: 'No access token found' });

    // Fetch accounts
    const accountsRes = await fetch('https://mybusinessaccountmanagement.googleapis.com/v1/accounts', {
      headers: { Authorization: `Bearer ${cred.accessToken}` }
    });
    
    const accountsData = await accountsRes.json();
    
    // Fetch locations for each account
    const results = [];
    if (accountsData.accounts) {
      for (const account of accountsData.accounts) {
        const locationsRes = await fetch(`https://mybusinessbusinessinformation.googleapis.com/v1/${account.name}/locations?readMask=name,title`, {
          headers: { Authorization: `Bearer ${cred.accessToken}` }
        });
        const locationsData = await locationsRes.json();
        results.push({ account, locations: locationsData.locations });
      }
    }

    return NextResponse.json({ accountsData, results });
  } catch (err: any) {
    return NextResponse.json({ error: err.message });
  }
}
