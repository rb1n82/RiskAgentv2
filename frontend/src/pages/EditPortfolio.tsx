import { useEffect, useState } from "react";
import { usePortfolio } from "@/lib/PortfolioContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  ArrowLeft, 
  Plus, 
  Save, 
  AlertTriangle,
  Check,
  X
} from "lucide-react";
import { Section } from "@/lib/types";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "@/components/ui/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Portfolio } from "@/lib/types";
import PortfolioAssetItem from "@/components/PortfolioAssetItem";

interface EditPortfolioProps {
  portfolioId?: string;
  onNavigate?: (section: Section, params?: any) => void;
}

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Portfolio name must be at least 2 characters.",
  }),
  description: z.string().optional(),
});

export default function EditPortfolio({ portfolioId, onNavigate }: EditPortfolioProps) {
  const { 
    portfolios, 
    assets, 
    updatePortfolio,
    updateAssetQuantity,
    isLoading, 
    refreshData 
  } = usePortfolio();

  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [showAddAssetForm, setShowAddAssetForm] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<string>("");
  const [assetQuantity, setAssetQuantity] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form for the portfolio details
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  // Fetch portfolio data
  useEffect(() => {
    if (portfolioId) {
      const foundPortfolio = portfolios.find(p => p.id === portfolioId);
      if (foundPortfolio) {
        setPortfolio(foundPortfolio);
        form.reset({
          name: foundPortfolio.name,
          description: foundPortfolio.description,
        });
      }
    }
  }, [portfolioId, portfolios, form]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg">Loading portfolio data...</p>
        </div>
      </div>
    );
  }

  if (!portfolio) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center">
        <AlertTriangle size={48} className="text-yellow-500 mb-4" />
        <h1 className="text-2xl font-semibold mb-2">Portfolio Not Found</h1>
        <p className="text-muted-foreground mb-6">
          The portfolio you're looking for doesn't exist or has been deleted.
        </p>
        <div className="flex gap-4">
          <Button onClick={() => onNavigate && onNavigate('dashboard')}>
            Return to Dashboard
          </Button>
          <Button variant="outline" onClick={() => onNavigate && onNavigate('portfolios')}>
            View All Portfolios
          </Button>
        </div>
      </div>
    );
  }

  // Save portfolio changes
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    
    // Update portfolio with new values
    const updatedPortfolio: Portfolio = {
      ...portfolio,
      name: values.name,
      description: values.description || "",
      updatedAt: new Date().toISOString()
    };
    
    updatePortfolio(updatedPortfolio);
    
    toast({
      title: "Portfolio updated",
      description: "Your portfolio has been successfully updated.",
    });
    
    setIsSubmitting(false);
    
    // Navigate back to portfolio detail
    if (onNavigate) {
      onNavigate('portfolio-detail', { portfolioId: portfolio.id });
    }
  };

  // Add a new asset to the portfolio
  const handleAddAsset = () => {
    if (!selectedAsset || assetQuantity <= 0) {
      toast({
        title: "Invalid input",
        description: "Please select an asset and enter a valid quantity.",
        variant: "destructive",
      });
      return;
    }
    
    updateAssetQuantity(portfolio.id, selectedAsset, assetQuantity);
    
    toast({
      title: "Asset added",
      description: "The asset has been added to your portfolio.",
    });
    
    // Reset form
    setSelectedAsset("");
    setAssetQuantity(0);
    setShowAddAssetForm(false);
  };

  // Update asset quantity
  const handleUpdateAsset = (assetId: string, quantity: number) => {
    updateAssetQuantity(portfolio.id, assetId, quantity);
    
    toast({
      description: "Asset quantity updated",
    });
  };

  // Remove asset from portfolio
  const handleRemoveAsset = (assetId: string) => {
    updateAssetQuantity(portfolio.id, assetId, 0);
    
    toast({
      description: "Asset removed from portfolio",
    });
  };

  // Get available assets (ones not already in the portfolio with quantity > 0)
  const getAvailableAssets = () => {
    const portfolioAssetIds = portfolio.assets
      .filter(a => a.quantity > 0)
      .map(a => a.assetId);
    return assets.filter(asset => !portfolioAssetIds.includes(asset.id));
  };

  // Get visible assets (ones with quantity > 0)
  const visibleAssets = portfolio.assets.filter(a => a.quantity > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => onNavigate && onNavigate('portfolio-detail', { portfolioId: portfolio.id })}
          className="h-8 w-8"
        >
          <ArrowLeft size={16} />
        </Button>
        <h1 className="text-2xl font-semibold">Edit Portfolio</h1>
      </div>
      
      {/* Portfolio Details Form */}
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Details</CardTitle>
          <CardDescription>Update your portfolio information</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Portfolio Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter portfolio name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter a brief description" {...field} />
                    </FormControl>
                    <FormDescription>
                      Optional description for your portfolio.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button type="submit" disabled={isSubmitting} className="flex items-center gap-1">
                <Save size={16} />
                <span>Save Changes</span>
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      {/* Assets Management */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Portfolio Assets</CardTitle>
            <CardDescription>Manage your portfolio assets</CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowAddAssetForm(true)}
            className="flex items-center gap-1"
          >
            <Plus size={14} />
            <span>Add Asset</span>
          </Button>
        </CardHeader>
        <CardContent>
          {/* Add Asset Form */}
          {showAddAssetForm && (
            <div className="border rounded-md p-4 mb-6 bg-secondary/20">
              <h3 className="text-sm font-medium mb-3">Add New Asset</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="col-span-1">
                  <label className="text-sm font-medium mb-1 block">Asset</label>
                  <Select value={selectedAsset} onValueChange={setSelectedAsset}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select asset" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableAssets().map(asset => (
                        <SelectItem key={asset.id} value={asset.id}>
                          {asset.name} ({asset.symbol})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-1">
                  <label className="text-sm font-medium mb-1 block">Quantity</label>
                  <Input 
                    type="number"
                    min="0"
                    step="0.0001"
                    value={assetQuantity || ''}
                    onChange={(e) => setAssetQuantity(parseFloat(e.target.value) || 0)}
                    placeholder="Enter quantity"
                  />
                </div>
                <div className="col-span-1 flex items-end">
                  <div className="flex gap-2 w-full">
                    <Button 
                      onClick={handleAddAsset} 
                      className="flex-1 flex items-center justify-center gap-1"
                    >
                      <Check size={14} />
                      <span>Add</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setShowAddAssetForm(false)} 
                      className="flex items-center justify-center gap-1"
                    >
                      <X size={14} />
                      <span>Cancel</span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Assets List */}
          <div className="divide-y">
            {visibleAssets.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-muted-foreground">No assets in this portfolio</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => setShowAddAssetForm(true)}
                >
                  Add your first asset
                </Button>
              </div>
            ) : (
              visibleAssets.map((portfolioAsset) => {
                const asset = assets.find(a => a.id === portfolioAsset.assetId);
                if (!asset) return null;
                
                return (
                  <PortfolioAssetItem
                    key={asset.id}
                    asset={asset}
                    quantity={portfolioAsset.quantity}
                    onUpdateQuantity={handleUpdateAsset}
                    onRemoveAsset={handleRemoveAsset}
                  />
                );
              })
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button 
            variant="outline"
            onClick={() => onNavigate && onNavigate('portfolio-detail', { portfolioId: portfolio.id })}
          >
            Back to Portfolio
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}