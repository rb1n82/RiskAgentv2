import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Trash2, X } from "lucide-react";
import { Asset } from "@/lib/types";

interface PortfolioAssetItemProps {
  asset: Asset;
  quantity: number;
  onUpdateQuantity: (assetId: string, quantity: number) => void;
  onRemoveAsset: (assetId: string) => void;
}

export default function PortfolioAssetItem({
  asset,
  quantity: initialQuantity,
  onUpdateQuantity,
  onRemoveAsset
}: PortfolioAssetItemProps) {
  const [quantity, setQuantity] = useState(initialQuantity);
  const [isEditing, setIsEditing] = useState(false);
  
  const value = asset.price * quantity;
  
  return (
    <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
          {asset.symbol.charAt(0)}
        </div>
        <div>
          <div className="font-medium">{asset.name}</div>
          <div className="text-sm text-muted-foreground">{asset.symbol}</div>
        </div>
      </div>
      
      <div className="sm:text-right">
        <div className="font-medium">${asset.price.toFixed(2)}</div>
        <div className="text-sm text-muted-foreground">Current Price</div>
      </div>
      
      <div className="space-y-1 min-w-[160px]">
        {isEditing ? (
          <div className="flex items-center gap-1">
            <Input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
              min="0"
              step="0.0001"
              className="h-8"
            />
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-8 w-8" 
              onClick={() => {
                onUpdateQuantity(asset.id, quantity);
                setIsEditing(false);
              }}
            >
              <Check size={14} />
            </Button>
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-8 w-8" 
              onClick={() => {
                setQuantity(initialQuantity);
                setIsEditing(false);
              }}
            >
              <X size={14} />
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="font-medium">{initialQuantity} {asset.symbol}</div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 px-2" 
              onClick={() => setIsEditing(true)}
            >
              Edit
            </Button>
          </div>
        )}
        <div className="text-sm text-muted-foreground">
          Value: ${value.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}
        </div>
      </div>
      
      <div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-100/10"
          onClick={() => onRemoveAsset(asset.id)}
        >
          <Trash2 size={16} />
        </Button>
      </div>
    </div>
  );
}