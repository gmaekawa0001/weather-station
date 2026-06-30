import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const CHANNEL_ID = process.env.THINGSPEAK_CHANNEL_ID || '3147539';
    const url = `https://api.thingspeak.com/channels/${CHANNEL_ID}/feeds.json?results=1`;

    const tsResponse = await fetch(url, { cache: 'no-store' });
    const tsJson = await tsResponse.json();

    if (!tsJson.feeds || tsJson.feeds.length === 0) {
      return NextResponse.json({
        equipmentStatus: 'offline',
        syncStatus: 'unknown',
        message: 'Nenhum dado retornado do ThingSpeak.'
      });
    }

    const latestFeed = tsJson.feeds[0];
    const latestTsTime = new Date(latestFeed.created_at).getTime();
    const currentTime = Date.now();
    const diffTsMinutes = (currentTime - latestTsTime) / (1000 * 60);

    // Equipamento travado se não houver atualizações no ThingSpeak por mais de 20 minutos
    const isEquipmentStuck = diffTsMinutes > 20;

    const supabase = getServiceSupabase();
    const { data: latestDb } = await supabase
      .from('dados_estacao')
      .select('data_hora')
      .order('data_hora', { ascending: false })
      .limit(1);

    let isSyncStuck = false;
    let diffDbMinutes = 0;
    let latestDbTime = null;

    if (latestDb && latestDb.length > 0) {
      latestDbTime = new Date(latestDb[0].data_hora).getTime();
      diffDbMinutes = (currentTime - latestDbTime) / (1000 * 60);

      // Sincronização travada se houver novos dados no ThingSpeak mas não no banco
      // Considera-se travado se a diferença entre ThingSpeak e Banco for > 5 minutos
      if (latestTsTime - latestDbTime > 5 * 60 * 1000) {
        isSyncStuck = true;
      }
    } else {
      isSyncStuck = true;
    }

    return NextResponse.json({
      equipmentStatus: isEquipmentStuck ? 'stuck' : 'normal',
      syncStatus: isSyncStuck ? 'stuck' : 'normal',
      latestThingSpeakTime: latestFeed.created_at,
      latestSupabaseTime: latestDb && latestDb.length > 0 ? latestDb[0].data_hora : null,
      diffTsMinutes: Math.round(diffTsMinutes),
      diffDbMinutes: Math.round(diffDbMinutes)
    });

  } catch (error: any) {
    console.error('API Status Error:', error);
    return NextResponse.json({ error: error.toString() }, { status: 500 });
  }
}
