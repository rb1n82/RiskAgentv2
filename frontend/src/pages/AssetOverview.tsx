// src/pages/AssetOverview.tsx
import { useState, useEffect } from 'react';
import { Section } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowUpDown, Search } from 'lucide-react';
import axios from 'axios';
import { assetIdMap } from '@/lib/assetIdMap';

export type AssetType = 'stock' | 'etf' | 'crypto';

export interface Snapshot {
  symbol:            string;
  type:              AssetType;
  currentPrice:      number;
  oneDayAgoPrice:    number;
  sevenDayAgoPrice:  number;
  thirtyDayAgoPrice: number;
  ninetyDayAgoPrice: number;
  volume:            number;
  lastUpdated:       number;
}

interface AssetOverviewProps {
  type?: AssetType;
  onNavigate?: (section: Section, params?: any) => void;
}

export default function AssetOverview({ type, onNavigate }: AssetOverviewProps) {
  const [assets, setAssets] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<keyof Snapshot | 'dayChange' | 'monthChange' | 'quarterChange' | 'volume'>('symbol');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAssets();
  }, [type]);

  const fetchAssets = async () => {
    try {
      setLoading(true);
      setError(null);

      // immer das gesamte market_data.json abrufen
      const { data: obj } = await axios.get<Record<string, Snapshot>>(
        'data/market-data'
      );
      const all = Object.values(obj);
      setAssets(all);
    } catch (err) {
      console.error('❌ Fehler beim Laden der Daten:', err);
      setError(err instanceof Error ? err.message : 'Ein unbekannter Fehler ist aufgetreten');
    } finally {
      setLoading(false);
    }
  };

  const filteredAssets = assets
    .filter(asset => 
      (!type || asset.type === type) &&
      (searchQuery === '' ||
       asset.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||  // Suche nach Symbol
       (assetIdMap[asset.symbol] && assetIdMap[asset.symbol].toLowerCase().includes(searchQuery.toLowerCase())))  // Suche nach Namen
    );

  const showEmptyTable = searchQuery && filteredAssets.length === 0;

  const handleSort = (field: keyof Snapshot | 'dayChange' | 'monthChange' | 'quarterChange' | 'volume') => {
    if (field === sortField) {
      setSortDirection(dir => dir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'USD'
    }).format(value);

  const formatPercentage = (value: number) =>
    `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p>Lade Marktdaten...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-red-500">
          <p>Fehler beim Laden der Daten:</p>
          <p>{error}</p>
          <Button onClick={fetchAssets} className="mt-4">
            Erneut versuchen
          </Button>
        </div>
      </div>
    );
  }

  const calculateDayChange = (asset: Snapshot) =>
    ((asset.currentPrice - asset.oneDayAgoPrice) / asset.oneDayAgoPrice) * 100;

  const calculateMonthChange = (asset: Snapshot) =>
    ((asset.currentPrice - asset.thirtyDayAgoPrice) / asset.thirtyDayAgoPrice) * 100;

  const calculateQuarterChange = (asset: Snapshot) =>
    ((asset.currentPrice - asset.ninetyDayAgoPrice) / asset.ninetyDayAgoPrice) * 100;

  const compareChanges = (
    a: Snapshot, 
    b: Snapshot, 
    changeFunction: (asset: Snapshot) => number
  ) => {
    const aChange = changeFunction(a);
    const bChange = changeFunction(b);

    return sortDirection === 'asc' ? aChange - bChange : bChange - aChange;
  };

  const compareVolume = (a: Snapshot, b: Snapshot) => {
    const aVolume = a.volume;
    const bVolume = b.volume;
    return sortDirection === 'asc' ? aVolume - bVolume : bVolume - aVolume;
  };

  const sortedAssets = filteredAssets.sort((a, b) => {
    if (sortField === 'symbol' || sortField === 'type' || sortField === 'currentPrice') {
      const aValue = a[sortField];
      const bValue = b[sortField];
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc'
          ? aValue - bValue
          : bValue - aValue;
      }
    }

    switch (sortField) {
      case 'dayChange':
        return compareChanges(a, b, calculateDayChange);
      case 'monthChange':
        return compareChanges(a, b, calculateMonthChange);
      case 'quarterChange':
        return compareChanges(a, b, calculateQuarterChange);
      case 'volume':
        return compareVolume(a, b);
      default:
        return 0;
    }
  });


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">
          {type
            ? `${type.charAt(0).toUpperCase() + type.slice(1)} Assets`
            : 'Alle Assets'}
        </h1>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Suche nach Assets..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          <Button onClick={fetchAssets}>Aktualisieren</Button>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">
              Name
            </TableHead>
            <TableHead>
              <Button variant="ghost" onClick={() => handleSort('symbol')}>
                Symbol <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead className="text-right">
              <Button variant="ghost" onClick={() => handleSort('currentPrice')}>
                Aktueller Preis <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead className="text-right">
              <Button variant="ghost" onClick={() => handleSort('dayChange')}>
                24h Änderung <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead className="text-right">
              <Button variant="ghost" onClick={() => handleSort('monthChange')}>
                30d Änderung <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead className="text-right">
              <Button variant="ghost" onClick={() => handleSort('quarterChange')}>
                90d Änderung <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead className="text-right">
              <Button variant="ghost" onClick={() => handleSort('volume')}>
                24h Volumen <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedAssets.map(asset => {
            const dayChange = calculateDayChange(asset);
            const monthChange = calculateMonthChange(asset);
            const quarterChange = calculateQuarterChange(asset);

            return (
              <TableRow 
                key={asset.symbol}
                className="cursor-pointer hover:bg-secondary/30"
                onClick={() => onNavigate?.('asset-detail', { assetId: asset.symbol })}
              >
                <TableCell className="font-medium">{assetIdMap[asset.symbol] || asset.symbol}</TableCell>
                <TableCell>
                  {asset.symbol}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(asset.currentPrice)}
                </TableCell>
                <TableCell className={`text-right ${dayChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {formatPercentage(dayChange)}
                </TableCell>
                <TableCell className={`text-right ${monthChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {formatPercentage(monthChange)}
                </TableCell>
                <TableCell className={`text-right ${quarterChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {formatPercentage(quarterChange)}
                </TableCell>
                <TableCell className="text-right">{asset.volume.toLocaleString()}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {/* Keine Ergebnisse gefunden */}
      {showEmptyTable && (
        <div className="flex justify-center mt-4 text-red-500">
          <p>Keine Ergebnisse gefunden</p>
        </div>
      )}
    </div>
  );
}
