import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const CHANNEL_ID = process.env.THINGSPEAK_CHANNEL_ID || '3147539';
    const url = `https://api.thingspeak.com/channels/${CHANNEL_ID}/feeds.json?results=1`;

    const response = await fetch(url, { cache: 'no-store' });
    const json = await response.json();

    if (!json.feeds || json.feeds.length === 0) {
      return NextResponse.json({ message: 'Nenhum dado retornado do ThingSpeak.' }, { status: 404 });
    }

    const parseField = (val: any) => {
      if (val === undefined || val === null || val === '') return null;
      const parsed = parseFloat(val);
      return isNaN(parsed) ? null : parsed;
    };

    const feed = json.feeds[0];
    const novoId = feed.entry_id;

    const supabase = getServiceSupabase();

    const payload = {
      entry_id: novoId,
      data_hora: feed.created_at,
      temperatura_c: parseField(feed.field1),
      umidade_pct: parseField(feed.field2),
      pressao_hpa: parseField(feed.field3),
      gas_mq135: parseField(feed.field4),
      gas_mq02: parseField(feed.field5),
      chuva_diaria_mm: parseField(feed.field6),
      memoria: parseField(feed.field7),
    };

    const { data, error } = await supabase
      .from('dados_estacao')
      .upsert(payload, { onConflict: 'entry_id', ignoreDuplicates: true })
      .select();

    if (error) {
      console.error('Supabase Insert Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (data && data.length === 0) {
      return NextResponse.json({ message: `Dado repetido (ID ${novoId}). Nenhuma nova inserção.` });
    }

    return NextResponse.json({ message: `Novo registro salvo: ID ${novoId}`, data });

  } catch (error: any) {
    console.error('API Sync Error:', error);
    return NextResponse.json({ error: error.toString() }, { status: 500 });
  }
}
