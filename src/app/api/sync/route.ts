import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic'; // Prevent static caching

export async function GET(request: Request) {
  try {
    const CHANNEL_ID = '3147539';
    // If you have a read API key for thingspeak, you can add it here.
    const url = `https://api.thingspeak.com/channels/${CHANNEL_ID}/feeds.json?results=1`;

    const response = await fetch(url, { cache: 'no-store' });
    const json = await response.json();

    if (!json.feeds || json.feeds.length === 0) {
      return NextResponse.json({ message: 'Nenhum dado retornado do ThingSpeak.' }, { status: 404 });
    }

    const feed = json.feeds[0];
    const novoId = feed.entry_id;

    const supabase = getServiceSupabase();

    // The Supabase table 'dados_thingspeak' expects these columns.
    // field1 = Temperatura (C)
    // field2 = Umidade (%)
    // field3 = Pressão (hPa)
    // field4 = Gás (MQ135)
    // field5 = Gás (MQ02)
    // field6 = Chuva Diária (mm)
    // field7 = Memória

    const payload = {
      entry_id: novoId,
      data_hora: feed.created_at, // Postgres will handle the ISO string
      temperatura_c: feed.field1 ? parseFloat(feed.field1) : null,
      umidade_pct: feed.field2 ? parseFloat(feed.field2) : null,
      pressao_hpa: feed.field3 ? parseFloat(feed.field3) : null,
      gas_mq135: feed.field4 ? parseFloat(feed.field4) : null,
      gas_mq02: feed.field5 ? parseFloat(feed.field5) : null,
      chuva_diaria_mm: feed.field6 ? parseFloat(feed.field6) : null,
      memoria: feed.field7 ? parseFloat(feed.field7) : null,
    };

    // Insert ignoring duplicates based on entry_id (assuming it has a UNIQUE or PRIMARY KEY constraint on it, or we simply rely on 'id' if 'entry_id' is uniquely constrained)
    // If 'entry_id' is unique, we can use upsert or just catch the duplicate error.
    // However, Supabase's `upsert` works best when specifying the conflict column if we want it to ignore.
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
