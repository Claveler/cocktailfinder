"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Save, Loader2, X, Plus } from "lucide-react";
import { updateVenueAction } from "@/lib/actions/admin";
import { toast } from "sonner";
import type { VenueWithComments } from "@/lib/venues";

interface VenueEditFormProps {
  venue: VenueWithComments;
}

const VENUE_TYPES = [
  { value: "bar", label: "Cocktail Bar" },
  { value: "pub", label: "Pub" },
  { value: "liquor_store", label: "Liquor Store" },
];

const PRICE_RANGES = [
  { value: "$", label: "$ - Budget" },
  { value: "$$", label: "$$ - Moderate" },
  { value: "$$$", label: "$$$ - Upscale" },
  { value: "$$$$", label: "$$$$ - Luxury" },
];

const VENUE_STATUS = [
  { value: "pending", label: "Pending Review" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

export default function VenueEditForm({ venue }: VenueEditFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: venue.name,
    type: venue.type,
    address: venue.address,
    city: venue.city,
    country: venue.country,
    latitude: venue.location?.lat || 0,
    longitude: venue.location?.lng || 0,
    brands: venue.brands,
    price_range: venue.price_range || "",
    ambiance: venue.ambiance,
    status: venue.status,
  });

  // Brand management
  const [newBrand, setNewBrand] = useState("");
  const [newAmbiance, setNewAmbiance] = useState("");

  const addBrand = () => {
    if (newBrand.trim() && !formData.brands.includes(newBrand.trim())) {
      setFormData(prev => ({
        ...prev,
        brands: [...prev.brands, newBrand.trim()]
      }));
      setNewBrand("");
    }
  };

  const removeBrand = (brandToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      brands: prev.brands.filter(brand => brand !== brandToRemove)
    }));
  };

  const addAmbiance = () => {
    if (newAmbiance.trim() && !formData.ambiance.includes(newAmbiance.trim())) {
      setFormData(prev => ({
        ...prev,
        ambiance: [...prev.ambiance, newAmbiance.trim()]
      }));
      setNewAmbiance("");
    }
  };

  const removeAmbiance = (ambianceToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      ambiance: prev.ambiance.filter(amb => amb !== ambianceToRemove)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await updateVenueAction(venue.id, formData);
      
      if (result.success) {
        toast.success("Venue updated successfully!");
        router.push(`/venues/${venue.id}`);
        router.refresh();
      } else {
        toast.error(result.error || "Failed to update venue");
      }
    } catch (error) {
      console.error("Error updating venue:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Venue Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="type">Type *</Label>
          <Select 
            value={formData.type} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select venue type" />
            </SelectTrigger>
            <SelectContent>
              {VENUE_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Location */}
      <Separator />
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Location</h3>
        
        <div className="space-y-2">
          <Label htmlFor="address">Address *</Label>
          <Textarea
            id="address"
            value={formData.address}
            onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
            rows={2}
            required
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="city">City *</Label>
            <Input
              id="city"
              value={formData.city}
              onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="country">Country *</Label>
            <Input
              id="country"
              value={formData.country}
              onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
              required
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="latitude">Latitude</Label>
            <Input
              id="latitude"
              type="number"
              step="any"
              value={formData.latitude}
              onChange={(e) => setFormData(prev => ({ ...prev, latitude: parseFloat(e.target.value) || 0 }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="longitude">Longitude</Label>
            <Input
              id="longitude"
              type="number"
              step="any"
              value={formData.longitude}
              onChange={(e) => setFormData(prev => ({ ...prev, longitude: parseFloat(e.target.value) || 0 }))}
            />
          </div>
        </div>
      </div>

      {/* Venue Details */}
      <Separator />
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Details</h3>
        
        <div className="space-y-2">
          <Label htmlFor="price_range">Price Range</Label>
          <Select 
            value={formData.price_range} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, price_range: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select price range" />
            </SelectTrigger>
            <SelectContent>
              {PRICE_RANGES.map((range) => (
                <SelectItem key={range.value} value={range.value}>
                  {range.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Brands */}
        <div className="space-y-2">
          <Label>Featured Brands</Label>
          <div className="flex gap-2">
            <Input
              value={newBrand}
              onChange={(e) => setNewBrand(e.target.value)}
              placeholder="Add a brand"
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addBrand())}
            />
            <Button type="button" onClick={addBrand} size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {formData.brands.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.brands.map((brand) => (
                <Badge key={brand} variant="secondary" className="flex items-center gap-1">
                  {brand}
                  <button
                    type="button"
                    onClick={() => removeBrand(brand)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Ambiance */}
        <div className="space-y-2">
          <Label>Ambiance Tags</Label>
          <div className="flex gap-2">
            <Input
              value={newAmbiance}
              onChange={(e) => setNewAmbiance(e.target.value)}
              placeholder="Add ambiance tag"
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAmbiance())}
            />
            <Button type="button" onClick={addAmbiance} size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {formData.ambiance.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.ambiance.map((amb) => (
                <Badge key={amb} variant="outline" className="flex items-center gap-1">
                  {amb}
                  <button
                    type="button"
                    onClick={() => removeAmbiance(amb)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Admin Status */}
      <Separator />
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Admin Settings</h3>
        
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select 
            value={formData.status} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {VENUE_STATUS.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 pt-4">
        <Button 
          type="submit" 
          disabled={isSubmitting}
          className="flex-1 sm:flex-none"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
        
        <Button 
          type="button" 
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
