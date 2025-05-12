import React, { useState, useMemo, useRef, useEffect } from "react";
import { usePortfolio } from "@/lib/PortfolioContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Plus, Trash, Wallet } from "lucide-react";
import { Section } from "@/lib/types";

interface NewPortfolioProps {
  onNavigate?: (section: Section, params?: any) => void;
}

interface PortfolioAssetForm {
  assetId: string;
  quantity: number;
}

export default function NewPortfolio({ onNavigate }: NewPortfolioProps) {
  const { assets, createPortfolio } = usePortfolio();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [portfolioAssets, setPortfolioAssets] = useState<PortfolioAssetForm[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeLetter, setActiveLetter] = useState(""); // Zustand für den aktiven Buchstaben
  const [dropdownOpen, setDropdownOpen] = useState(false); // Zustand für das Dropdown
  const [isScrolling, setIsScrolling] = useState(false); // Zustand um mehrfaches Scrollen zu verhindern

  // Verwenden eines Refs, um jedes Asset zu referenzieren und zum Ziel zu scrollen
  const assetRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Sortiere die Assets nach Namen
  const sortedAssets = useMemo(() => {
    return assets.sort((a, b) => a.name.localeCompare(b.name));
  }, [assets]);

  // Füge ein neues Asset zum Portfolio hinzu
  const addAsset = (assetId: string) => {
    setPortfolioAssets((prev) => [
      ...prev,
      { assetId, quantity: 0 }, // Asset wird hier initialisiert mit 0 Menge
    ]);
  };

  // Update für Asset-ID
  const updateAssetId = (index: number, assetId: string) => {
    setPortfolioAssets((prev) =>
      prev.map((asset, i) => {
        if (i === index) {
          return { ...asset, assetId };
        }
        return asset;
      })
    );
  };

  // Update für Asset-Menge
  const updateAssetQuantity = (index: number, quantity: number) => {
    setPortfolioAssets((prev) =>
      prev.map((asset, i) => {
        if (i === index) {
          return { ...asset, quantity };
        }
        return asset;
      })
    );
  };

  // Entferne Asset aus dem Portfolio
  const removeAsset = (index: number) => {
    setPortfolioAssets((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle Form Submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Filter out assets with zero or negative quantity
    const validAssets = portfolioAssets.filter((asset) => asset.quantity > 0);

    createPortfolio({
      name,
      description,
      assets: validAssets,
    });

    setTimeout(() => {
      setIsLoading(false);
      onNavigate && onNavigate("portfolios");
    }, 1000);
  };

  // Handle key press for jumping to assets starting with a certain letter
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const letter = e.key.toUpperCase();

    if (letter.match(/[A-Z]/)) {
      // Wenn das Dropdown geöffnet ist, schließen wir es
      if (dropdownOpen) {
        setDropdownOpen(false);
      }

      setActiveLetter(letter); // Setze den aktiven Buchstaben
      const firstAsset = getFirstAssetWithLetter(letter);

      if (firstAsset) {
        setIsScrolling(true); // Setze Scrolling-Flag

        // Verzögere das Scrollen leicht, um sicherzustellen, dass das Asset gerendert ist
        setTimeout(() => {
          const ref = assetRefs.current[firstAsset.id];
          if (ref) {
            ref.scrollIntoView({ behavior: "smooth", block: "center" });
            // Nach dem Scrollen das Flag zurücksetzen
            setTimeout(() => {
              setIsScrolling(false);
            }, 500); // Warte etwas Zeit nach dem Scrollen
          }
        }, 100); // Warte 100 ms, um sicherzustellen, dass das Element im DOM ist
      }
    }
  };

  // Finde das erste Asset, das mit dem aktiven Buchstaben beginnt
  const getFirstAssetWithLetter = (letter: string) => {
    return sortedAssets.find((asset) => asset.name[0].toUpperCase() === letter);
  };

  return (
    <div className="space-y-6" onKeyDown={handleKeyDown}>
      {/* Page Header */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onNavigate && onNavigate("portfolios")}
          className="h-8 w-8"
        >
          <ArrowLeft size={16} />
        </Button>
        <h1 className="text-2xl font-semibold">Create New Portfolio</h1>
      </div>

      {/* Portfolio Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-lg border border-border bg-card p-6 gradient-border">
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="text-sm font-medium block mb-1">
                Portfolio Name
              </label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Conservative Portfolio"
                required
              />
            </div>

            <div>
              <label htmlFor="description" className="text-sm font-medium block mb-1">
                Description
              </label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your portfolio strategy or goals"
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* Assets Section */}
        <div className="rounded-lg border border-border bg-card p-6 gradient-border">
          <div className="flex items-center gap-2 mb-4">
            <Wallet size={16} className="text-primary" />
            <h3 className="font-medium">Portfolio Assets</h3>
          </div>

          <div className="space-y-4">
            {portfolioAssets.length === 0 ? (
              <div className="text-center py-6 bg-secondary/20 rounded-lg border border-dashed border-border">
                <p className="text-muted-foreground mb-2">No assets added yet</p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => addAsset(sortedAssets[0].id)} // Adding the first asset (can be improved)
                  className="flex items-center gap-1"
                >
                  <Plus size={14} />
                  <span>Add your first asset</span>
                </Button>
              </div>
            ) : (
              <>
                {portfolioAssets.map((asset, index) => (
                  <div
                    key={index}
                    className="flex gap-3 items-end"
                    id={`asset-${index}`}
                    ref={(el) => {
                      if (el) assetRefs.current[asset.assetId] = el;
                    }}
                  >
                    <div className="flex-1">
                      <label className="text-sm font-medium block mb-1">Asset</label>
                      <select
                        value={asset.assetId}
                        onChange={(e) => updateAssetId(index, e.target.value)}
                        className="w-full bg-secondary border border-border text-foreground rounded-md px-3 py-2"
                        required
                      >
                        {sortedAssets.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.name} ({a.symbol})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="w-1/3">
                      <label className="text-sm font-medium block mb-1">Quantity</label>
                      <Input
                        type="number"
                        value={asset.quantity === 0 ? "" : asset.quantity}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value);
                          updateAssetQuantity(index, isNaN(value) ? 0 : value);
                        }}
                        min="0"
                        step="any"
                        placeholder="0"
                        required
                      />
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeAsset(index)}
                      className="h-10 w-10 text-muted-foreground hover:text-destructive"
                    >
                      <Trash size={16} />
                    </Button>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => addAsset(sortedAssets[0].id)} // Adding another asset (can be improved)
                  className="flex items-center gap-1 mt-2"
                >
                  <Plus size={14} />
                  <span>Add another asset</span>
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => onNavigate && onNavigate("portfolios")}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isLoading || name.trim() === "" || portfolioAssets.length === 0}
            className="min-w-[120px]"
          >
            {isLoading ? (
              <>
                <div className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-primary-foreground rounded-full"></div>
                Creating...
              </>
            ) : "Create Portfolio"}
          </Button>
        </div>
      </form>
    </div>
  );
}
