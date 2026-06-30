import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const CHANNEL_ID = process.env.THINGSPEAK_CHANNEL_ID || '3147539';
    // Buscamos os últimos 50 registros para evitar travamentos em dados intermediários
    const url = `https://api.thingspeak.com/channels/${CHANNEL_ID}/feeds.json?results=50`;

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

    let tempFilteredCount = 0;
    let humFilteredCount = 0;

    const payloads = json.feeds.map((feed: any) => {
      // Filtragem de dados inválidos de sensores
      let temp = parseField(feed.field1);
      if (temp !== null && (temp >= 100 || temp < -10)) {
        temp = null;
        tempFilteredCount++;
      }

      let hum = parseField(feed.field2);
      if (hum !== null && hum === 0) {
        hum = null;
        humFilteredCount++;
      }

      return {
        entry_id: feed.entry_id,
        data_hora: feed.created_at,
        temperatura_c: temp,
        umidade_pct: hum,
        pressao_hpa: parseField(feed.field3),
        gas_mq135: parseField(feed.field4),
        gas_mq02: parseField(feed.field5),
        chuva_diaria_mm: parseField(feed.field6),
        memoria: parseField(feed.field7),
      };
    });

    const supabase = getServiceSupabase();

    const { data, error } = await supabase
      .from('dados_estacao')
      .upsert(payloads, { onConflict: 'entry_id', ignoreDuplicates: true })
      .select();

    if (error) {
      console.error('Supabase Insert Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const insertedCount = data ? data.length : 0;

    return NextResponse.json({
      message: `${insertedCount} novos registros sincronizados com sucesso.`,
      insertedCount,
      filteredSummary: {
        temperaturaDiscarded: tempFilteredCount,
        umidadeDiscarded: humFilteredCount
      },
      data
    });

  } catch (error: any) {
    console.error('API Sync Error:', error);
    return NextResponse.json({ error: error.toString() }, { status: 500 });
  }
}
