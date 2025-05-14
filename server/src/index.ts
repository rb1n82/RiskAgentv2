/* ------------------------------------------------------------------
   MARKET‑DATA SERVER  –  throttled for 100 Stocks + 20 ETFs
   • Stocks / ETFs via yahoo‑finance2  (with Bottleneck limiter)
   • Crypto via CoinGecko (also limited)
   • Saves unified snapshots (current, 1D, 7D, 30D, 90D, vol) in
     data/market_data.json
   ------------------------------------------------------------------ */
   import 'dotenv/config'; 
   import express, { RequestHandler } from 'express';
   import cors from 'cors';
   import fs from 'fs/promises';
   import path from 'path';
   import yf from 'yahoo-finance2';
   import Bottleneck from 'bottleneck';
   import axios from 'axios';
   import { format } from "date-fns";
   

   
   /* ----------------------- CONFIG ---------------------------------- */
   const DATA_PATH     = path.resolve('data', 'market_data.json');
   const PORT          = Number(process.env.PORT ?? 3001);
   const UPDATE_EVERY  = 4 * 60 * 60 * 1_000;          // 4 h

   const TS_PATH = path.resolve('data', 'timeseries');   // neues Unterverzeichnis

interface Bar {
  date: string;   // YYYY-MM-DD
  adj:  number;   // Adjusted Close
  vol:  number;   // Stückvolumen
}

interface Snapshot {
  symbol: string;
  type: 'stock' | 'etf' | 'crypto';
  currentPrice:      number;
  oneDayAgoPrice:    number;
  sevenDayAgoPrice:  number;
  thirtyDayAgoPrice: number;
  ninetyDayAgoPrice: number;
  volume:            number;
  lastUpdated:       number;
}

function pickLastBarPerDay(bars: Bar[]): Bar[] {
  const lastPerDay = new Map<string, Bar>();

  // 1) chronologisch sortieren, damit "last" wirklich zuletzt ist
  bars
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    // 2) jeden Eintrag in die Map setzen (überschreibt frühere mit demselben Key)
    .forEach(bar => {
      const day = format(new Date(bar.date), "yyyy-MM-dd");
      lastPerDay.set(day, bar);
    });

  // 3) Map.values() chronologisch zurückgeben
  return Array.from(lastPerDay.values()).sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
}

/* -- Datei‑I/O --------------------------------------------------- */
async function loadSeries(sym: string): Promise<Bar[]> {
  try {
    return JSON.parse(
      await fs.readFile(path.join(TS_PATH, `${sym}.json`), 'utf-8')
    ) as Bar[];
  } catch {
    return [];                                   // erste Ausführung
  }
}

async function saveSeries(sym: string, rows: Bar[]) {
  await fs.mkdir(TS_PATH, { recursive: true });
  await fs.writeFile(
    path.join(TS_PATH, `${sym}.json`),
    JSON.stringify(rows)
  );
}

/* ========  C R Y P T O – Timeseries  ================================= */

async function updateCryptoSeries(id: string, lookbackDays = 730): Promise<Bar[]> {
  const rows = await loadSeries(id);                         // wie bei Aktien
  const last = rows.at(-1)?.date;
  
  const fromUnix = last
    ? Math.floor((new Date(last).getTime() + 86_400_000) / 1000)  // +1 Tag
    : Math.floor((Date.now() - lookbackDays * 86_400_000) / 1000);

  const toUnix   = Math.floor(Date.now() / 1000);

  // CoinGecko‑Range (daily)
  const LOOKBACK = Math.min(lookbackDays, 90);                              // 2 Jahre
 const mcR = await cgGet(`/coins/${id}/market_chart`, {
   vs_currency: 'usd',
   days: LOOKBACK,            // Free‑Plan erlaubt bis 'max'
   // interval weglassen (free)  ->  liefert daily‑Bars ab 90 Tagen automatisch
 });
 const prices = (mcR.data as any).prices as [number, number][];
  const newRows: Bar[] = prices.map(([ts, price]) => ({
    date: new Date(ts).toISOString().slice(0,10),
    adj:  price,
    vol:  0                                       // daily Vol. nicht nötig
  }));

  if (newRows.length) {
    const combined = [...rows, ...newRows];
    const deduped  = pickLastBarPerDay(combined);
    await saveSeries(id, deduped);
    return deduped;
  }
  return rows;
}

/* ---- aktueller Preis + 24h‑Volumen ---------------------------------- */
async function fetchCryptoPrice(id: string) {
  const r = await fetchWithRetry(() =>
    cgGet<CoinGeckoPriceResponse>('/simple/price', {
      ids: id,
      vs_currencies: 'usd',
      include_24hr_vol: true
    })
  );
  const cur = (r.data as any)[id];
  return { price: cur.usd as number, vol24: cur.usd_24h_vol as number };
}

/* ---- Snapshot ------------------------------------------------------- */
function buildCryptoSnapshot(
  id: string,
  bars: Bar[],
  cur: { price: number; vol24: number }
): Snapshot {

  // sicherstellen, dass "heute" in der Serie ist
  const today = new Date().toISOString().slice(0,10);
  if (bars.at(-1)?.date !== today) {
    bars.push({ date: today, adj: cur.price, vol: cur.vol24 });
    saveSeries(id, bars);                        // async fire‑and‑forget
  }

  const pick = (n:number)=>bars.at(-1-n)?.adj ?? cur.price;

  return {
    symbol: id,
    type:   'crypto',
    currentPrice:      cur.price,
    oneDayAgoPrice:    pick(1),
    sevenDayAgoPrice:  pick(7),
    thirtyDayAgoPrice: pick(30),
    ninetyDayAgoPrice: pick(90),
    volume:            cur.vol24,
    lastUpdated:       Date.now()
  };
}
/* -- Inkrementelles Nachladen ------------------------------------ */
async function updateSeries(sym: string, lookbackDays = 730): Promise<Bar[]> {
  const rows = await loadSeries(sym);
  const last = rows.at(-1)?.date;

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0); // Setzt das heutige Datum auf Mitternacht UTC

  let period1: Date;
  let period2: Date;

  if (last) {
    const lastDate = new Date(last + 'T00:00:00Z'); // 00:00 UTC des letzten Balkens
    if (lastDate >= today) {
      return rows;  // Bereits auf dem neuesten Stand → keine Aktualisierung nötig
    }
    // Setze period1 auf den nächsten Tag nach dem letzten Datum
    period1 = new Date(lastDate.getTime() + 86_400_000); // +1 Tag
    // Setze period2 auf den heutigen Tag
    period2 = today;
  } else {
    // Wenn keine Daten vorhanden sind, dann starte mit den letzten 730 Tagen
    period1 = new Date(Date.now() - lookbackDays * 86_400_000); // Erstes Setup
    period2 = today; // Heute
  }

  // Überprüfe, dass period1 und period2 unterschiedliche Werte haben
  if (period1.getTime() === period2.getTime()) {
    period1.setDate(period1.getDate() - 1); // Setze period1 auf einen Tag vor period2
  }

  const hist = await yf.historical(sym, {
    period1,
    period2,  // Stelle sicher, dass period1 und period2 unterschiedliche Werte haben
    interval: '1d',
    includeAdjustedClose: true
  });

  const newRows: Bar[] = hist.map(c => ({
    date: c.date.toISOString().slice(0, 10),
    adj: c.close,
    vol: c.volume ?? 0
  }));

  if (!newRows.length) return rows;

  const combined = [...rows, ...newRows];
    const deduped  = pickLastBarPerDay(combined);
    await saveSeries(sym, deduped);
    return deduped;
}

/* -- Snapshot für Frontend‑JSON ---------------------------------- */
function buildSnapshot(
  sym: string,
  type: Snapshot['type'],
  bars: Bar[]
): Snapshot {
  const deduped = pickLastBarPerDay(bars);
  const pick = (n: number) => deduped.at(-1 - n)?.adj ?? deduped.at(-1)!.adj;
  return {
    symbol: sym,
    type,
    currentPrice:      pick(0),
    oneDayAgoPrice:    pick(1),
    sevenDayAgoPrice:  pick(7),
    thirtyDayAgoPrice: pick(30),
    ninetyDayAgoPrice: pick(90),
    volume:            bars.at(-1)?.vol ?? 0,
    lastUpdated:       Date.now()
  };
}
   
   // Bis zu 100 Aktien + 20 ETFs  – du kannst hier beliebig erweitern
   export const STOCKS: string[] = [
    'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA',
    'NVDA', 'META', 'BRK.B', 'TSM', 'V',
    'JNJ', 'WMT', 'MA', 'JPM', 'PG',
    'UNH', 'HD', 'DIS', 'ADBE', 'PYPL',
    'NFLX', 'KO', 'PEP', 'XOM', 'CVX',
    'INTC', 'CSCO', 'CRM', 'ORCL', 'PFE',
    'MRK', 'ABT', 'TMO', 'ASML', 'AVGO',
    'MCD', 'NKE', 'LLY', 'TXN', 'COST',
    'BAC', 'C',   'WFC', 'GS',  'MS',
    'UPS', 'NEE', 'DHR', 'BMY', 'HON'
  ];
  
  export const ETFS: string[] = [
    'SPY', 'QQQ', 'VTI', 'IWM', 'EEM',
    'EFA', 'AGG', 'LQD', 'HYG', 'VNQ',
    'XLF', 'XLY', 'XLP', 'XLV', 'XLI',
    'XLE', 'XLK', 'XLB', 'XLC', 'GLD', 'XWD.TO', // iShares MSCI World UCITS ETF (Acc) :contentReference[oaicite:0]{index=0}
  'XDWL.DE' 
  ];
   const CRYPTOS = ['bitcoin','ethereum','ripple','solana'];
   
   /* ----------------------- RATE‑LIMITER ----------------------------- */
   // Yahoo Finance – 60 req/min ist erfahrungsgemäß sicher; wir peilen 45 an
   const yahooLimiter = new Bottleneck({ maxConcurrent: 3, minTime: 1_300 });
   // CoinGecko – Limit 50 req/min; wir peilen 30 an
   const cgLimiter    = new Bottleneck({ maxConcurrent: 1, minTime: 12_500 });
   
   /* ----------------------- FILE HELPERS ----------------------------- */
   async function loadFile<T = any>(): Promise<Record<string, T>> {
     try { return JSON.parse(await fs.readFile(DATA_PATH,'utf-8')); } catch { return {}; }
   }
   async function saveFile(obj: Record<string, any>){
     await fs.mkdir(path.dirname(DATA_PATH),{ recursive:true });
     await fs.writeFile(DATA_PATH, JSON.stringify(obj,null,2));
   }
   
   /* ----------------------- YF HELPERS ------------------------------- */
   async function quote(symbol: string){
     return yahooLimiter.schedule(() => yf.quote(symbol)) as Awaited<ReturnType<typeof yf.quote>>;
   }
   async function history(symbol: string, days = 90){
     const to = new Date();
     const from = new Date(to.getTime() - days * 86_400_000);
     // Stelle sicher, dass die Zeiträume mindestens 1 Tag auseinander liegen
     if (from.getTime() === to.getTime()) {
       from.setDate(from.getDate() - 1);
     }
     return yahooLimiter.schedule(() => yf.historical(symbol,{period1:from,period2:to,interval:'1d'}));
   }
   interface Candle { date: Date; close: number; volume: number }
   function pick(c: Candle[]){ const s=c.sort((a,b)=>a.date.getTime()-b.date.getTime());const at=(i:number)=>s.at(-1-i)?.close??s.at(-1)!.close;return{cur:at(0),d1:at(1),d7:at(7),d30:at(30),d90:at(90),vol:s.at(-1)!.volume}; }
   
   /* ----------------------- COINGECKO ------------------------------- */
   interface CoinGeckoPriceResponse {
     [key: string]: {
       usd: number;
       usd_24h_vol: number;
       usd_24h_change: number;
     }
   }

   interface CoinGeckoChartResponse {
     prices: [number, number][];
   }

   // --- Retry + Proxy  (wie früher) -----------------------------------
   async function fetchWithRetry<T>(
     fn: () => Promise<T>,
     retries = 0,
     maxRetries = 3
   ): Promise<T> {
     try {
       return await fn();
     } catch (e: any) {
       console.error('API Error:', {
         status: e.response?.status,
         statusText: e.response?.statusText,
         headers: e.response?.headers,
         data: e.response?.data
       });
       if (retries >= maxRetries) throw e;
       const delay =
         e.response?.status === 429 ? 61_000 * 2 ** retries : 2_000 * 2 ** retries;
       console.warn(`⏳ Retry in ${delay / 1000}s`);
       await new Promise(r => setTimeout(r, delay));
       return fetchWithRetry(fn, retries + 1, maxRetries);
     }
   }

   // --- Preis + 90‑Tage‑Historie --------------------------------------
   if (!process.env.COINGECKO_KEY) {
    console.error('❌  COINGECKO_KEY fehlt! 401 garantiert.');
    process.exit(1);
  }
  
  const cgHeaderName =
    process.env.COINGECKO_KEY.startsWith('cg_pro_') ? 'x-cg-pro-api-key'
                                                    : 'x-cg-demo-api-key';
  
  const cgHeaders: Record<string, string> = {
    'User-Agent': 'MarketBot/1.0',
    [cgHeaderName]: process.env.COINGECKO_KEY
  };
  
  /* 2)  Axios‑Instance mit Default‑Header ------------------------------ */
  const coingeckoClient = axios.create({
    baseURL: 'https://api.coingecko.com/api/v3',
    timeout: 10_000,
    headers: cgHeaders                     //  ←  Header IMMER drin
  });
  
  
  /* 4)  Wrapper – behält Header UND Proxy params ----------------------- */
  function cgGet<T>(url: string, params: any) {
    return cgLimiter.schedule(async () => {
      
      const response = await coingeckoClient.get<T>(url, { 
        params, 
        headers: cgHeaders 
      });
      
      return response;
    });
  }

   /* --- fetchCryptoData  ------------------------------------------- */
   async function fetchCryptoData(id: string): Promise<Snapshot> {
     console.log(`Fetching ${id} …`);

     // 1) Preis (ein Sammel‑Call würde noch weniger Requests bedeuten)
     const priceR = await fetchWithRetry(() =>
       cgGet<CoinGeckoPriceResponse>('/simple/price', {
         ids: id,
         vs_currencies: 'usd',
         include_24hr_vol: true,
         include_24hr_change: true
       })
     );

     // 2) Historie – wird automatisch erst ≥1,2 s später gesendet
     const histR = await fetchWithRetry(() =>
       cgGet<CoinGeckoChartResponse>(`/coins/${id}/market_chart`, {
         vs_currency: 'usd',
         days: 90,
         
       })
     );

     /* --- unveränderter Auswertungs‑Teil --- */
     const cur    = priceR.data[id];
     const prices = histR.data.prices as [number, number][];
     const at = (n: number) => prices.at(-1 - n)?.[1] ?? cur.usd;

     return {
       symbol: id,
       type: 'crypto' as const,
       currentPrice: cur.usd,
       oneDayAgoPrice:  cur.usd / (1 + (cur.usd_24h_change || 0) / 100),
       sevenDayAgoPrice: at(7),
       thirtyDayAgoPrice: at(30),
       ninetyDayAgoPrice: prices[0]?.[1] ?? cur.usd,
       volume: cur.usd_24h_vol || 0,
       lastUpdated: Date.now()
     };
   }
   
   /* ----------------------- MAIN UPDATE ----------------------------- */
   async function updateAll() {
    console.log('⏳ updating series + snapshots …');
  
    const db: Record<string, Snapshot> = {};
  
    /* --- STOCKS & ETFs  ------------------------------------------ */
    for (const symbol of [...STOCKS, ...ETFS]) {
      try {
        const bars  = await updateSeries(symbol);    // ≤1 Request / Run
        const snap  = buildSnapshot(
          symbol,
          ETFS.includes(symbol) ? 'etf' : 'stock',
          bars
        );
        db[symbol] = snap;
        console.log('✔', symbol, snap.currentPrice);
      } catch (e) {
        console.warn('✖', symbol, (e as Error).message);
      }
    }
  
    /* --- CRYPTOS  (alter Code – unverändert) --------------------- */
    console.log('💰 Kryptowährungen …');
for (const id of CRYPTOS) {
  try {
    const bars = await updateCryptoSeries(id);            // ≤1 Request
    const cur  = await fetchCryptoPrice(id);               // 1 Request
    const snap = buildCryptoSnapshot(id, bars, cur);
    db[id] = snap;
    console.log('✔', id, snap.currentPrice);
  } catch (e) {
    console.warn('✖', id, (e as Error).message);
  }
  // kleiner Puffer, CoinGecko‑free mag ~10 req/min sicher
  await new Promise(r => setTimeout(r, 7_000));
}
  
    await saveFile(db);            // schreibt market_data.json (Frontend‑Payload)
    console.log('✅ snapshot saved');
  }
   
   /* ----------------------- EXPRESS API ----------------------------- */
   const app = express(); 
   app.use(cors());
   
   const PROJECT_ROOT = process.cwd();
   const dataDir = path.join(PROJECT_ROOT, 'data');
app.use('/data', express.static(dataDir));

   type ExpressHandler = (req: express.Request, res: express.Response) => Promise<void>;
   
   app.get('/api/market-data', (async (_, res) => {
     res.json(Object.values(await loadFile()));
   }) as ExpressHandler);
   
   app.get('/api/stocks', (async (_, res) => {
     const d = await loadFile(); 
     res.json(Object.values(d).filter(x => x.type === 'stock')); 
   }) as ExpressHandler);
   
   app.get('/api/etfs', (async (_, res) => {
     const d = await loadFile(); 
     res.json(Object.values(d).filter(x => x.type === 'etf')); 
   }) as ExpressHandler);
   
   app.get('/api/crypto', (async (_, res) => {
     const d = await loadFile(); 
     res.json(Object.values(d).filter(x => x.type === 'crypto')); 
   }) as ExpressHandler);
   
   app.get('/api/yfinance/price', (async (req, res) => {
     try { 
       const s = String(req.query.symbol); 
       if (!s) return res.status(400).json({error:'symbol'});
       const q = await yahooLimiter.schedule(() => quote(s));
       res.json(q); 
     } catch (e) {
       res.status(502).json({error:(e as Error).message});
     }
   }) as ExpressHandler);
   
   app.get('/api/yfinance/history', (async (req, res) => {
     try { 
       const s = String(req.query.symbol); 
       const days = Number(req.query.days ?? 365);
       if (!s) return res.status(400).json({error:'symbol'});
       const h = await history(s, days); 
       res.json(h);
     } catch (e) {
       res.status(502).json({error:(e as Error).message});
     }
   }) as ExpressHandler);
   
   app.post('/api/update', (async (_, res) => {
     await updateAll(); 
     res.json({ok:true}); 
   }) as ExpressHandler);

   const frontDir = path.join(PROJECT_ROOT, 'frontend', 'build');
// Statische Assets (CSS, JS, Bilder…)
app.use(express.static(frontDir));

// Fallback für alle anderen Requests
app.get('*', (_req, res) => {
  res.sendFile(path.join(frontDir, 'index.html'));
});

app.get("/", (_req, res) => {
  res.status(200).send("OK");
});
   
   
   app.listen(PORT,()=>{ console.log(`🚀 API @ http://localhost:${PORT}`); console.log('CG_KEY', process.env.CG_PRO_KEY?.slice(0,6)); updateAll(); setInterval(updateAll,UPDATE_EVERY); });
