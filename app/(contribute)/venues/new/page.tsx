"use client";

import { useState, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { uploadPhoto } from "@/lib/storage";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  MapPin,
  Upload,
  X,
  Plus,
  Loader2,
  Wine,
  Building,
  Camera,
  AlertCircle,
  Link as LinkIcon,
} from "lucide-react";
import Link from "next/link";
import { createVenue, updateVenuePhotos } from "@/lib/actions/venues";
import GoogleMapsLinkInput from "@/components/forms/GoogleMapsLinkInput";
import type { Coordinates, VenueInfo } from "@/lib/maps";

const VENUE_TYPES = [
  { value: "bar", label: "Cocktail Bar", icon: Wine },
  { value: "pub", label: "Pub", icon: Building },
  { value: "liquor_store", label: "Liquor Store", icon: Building },
] as const;

const PRICE_RANGES = [
  { value: "$", label: "$ - Budget friendly" },
  { value: "$$", label: "$$ - Moderate" },
  { value: "$$$", label: "$$$ - Upscale" },
  { value: "$$$$", label: "$$$$ - Luxury" },
];

const COMMON_BRANDS = [
  "Hennessy",
  "Bombay Sapphire",
  "Grey Goose",
  "Tanqueray",
  "Kettle One",
  "Aperol",
  "Hendricks",
  "Absolut",
  "Bacardi",
  "Captain Morgan",
  "Jack Daniels",
  "Johnnie Walker",
  "Chivas Regal",
  "Macallan",
  "Glenfiddich",
  "Patron",
  "Don Julio",
  "Cointreau",
  "Grand Marnier",
  "Baileys",
  "Kahlua",
  "Amaretto",
  "Campari",
  "Vermouth",
];

const COMMON_AMBIANCE = [
  "speakeasy",
  "intimate",
  "molecular",
  "rooftop",
  "outdoor",
  "live music",
  "dancing",
  "quiet",
  "romantic",
  "casual",
  "upscale",
  "vintage",
  "modern",
  "industrial",
  "cozy",
  "trendy",
  "classic",
  "sophisticated",
  "lively",
];

export default function NewVenuePage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    type: "" as "bar" | "pub" | "liquor_store" | "",
    address: "",
    city: "",
    country: "",
    latitude: "",
    longitude: "",
    price_range: "",
    google_maps_url: "",
  });

  const [brands, setBrands] = useState<string[]>([]);
  const [newBrand, setNewBrand] = useState("");
  const [ambiance, setAmbiance] = useState<string[]>([]);
  const [newAmbiance, setNewAmbiance] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCoordinatesExtracted = (
    coordinates: Coordinates,
    originalUrl?: string,
    venueInfo?: VenueInfo
  ) => {
    setFormData((prev) => ({
      ...prev,
      latitude: coordinates.lat.toString(),
      longitude: coordinates.lng.toString(),
      google_maps_url: originalUrl || "",
      // Auto-populate venue information if available
      name: venueInfo?.name || prev.name,
      address: venueInfo?.address || prev.address,
      city: venueInfo?.city || prev.city,
      country: venueInfo?.country || prev.country,
    }));
  };

  const addBrand = (brand: string) => {
    const trimmed = brand.trim();
    if (trimmed && !brands.includes(trimmed)) {
      setBrands((prev) => [...prev, trimmed]);
    }
  };

  const removeBrand = (brand: string) => {
    setBrands((prev) => prev.filter((b) => b !== brand));
  };

  const addAmbiance = (amb: string) => {
    const trimmed = amb.trim();
    if (trimmed && !ambiance.includes(trimmed)) {
      setAmbiance((prev) => [...prev, trimmed]);
    }
  };

  const removeAmbiance = (amb: string) => {
    setAmbiance((prev) => prev.filter((a) => a !== amb));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    // Limit to 10 photos max
    const newPhotos = files.slice(0, 10 - photos.length);
    setPhotos((prev) => [...prev, ...newPhotos]);
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic validation
    if (
      !formData.name ||
      !formData.type ||
      !formData.address ||
      !formData.city ||
      !formData.country
    ) {
      setError("Please fill in all required fields");
      return;
    }

    if (!formData.latitude || !formData.longitude) {
      setError("Please provide venue coordinates");
      return;
    }

    const lat = parseFloat(formData.latitude);
    const lng = parseFloat(formData.longitude);

    if (isNaN(lat) || isNaN(lng)) {
      setError("Please provide valid numeric coordinates");
      return;
    }

    startTransition(async () => {
      try {
        // First, create the venue to get an ID
        const submitFormData = new FormData();

        // Add basic fields
        Object.entries(formData).forEach(([key, value]) => {
          submitFormData.append(key, value);
        });

        // Add arrays as JSON
        submitFormData.append("brands", JSON.stringify(brands));
        submitFormData.append("ambiance", JSON.stringify(ambiance));

        // Create venue without photos first
        const result = await createVenue(submitFormData);

        if (!result.success) {
          setError(result.error || "Failed to submit venue");
          return;
        }

        const venueId = result.venueId;

        // Upload photos if any
        const photoUrls: string[] = [];
        if (photos.length > 0) {
          setUploadingPhotos(true);
          toast.info(`Uploading ${photos.length} photo(s)...`);

          for (const file of photos) {
            try {
              const uploadResult = await uploadPhoto(file, venueId);
              if (uploadResult.error) {
                console.error("Upload error:", uploadResult.error);
                toast.error(`Failed to upload ${file.name}`);
              } else if (uploadResult.data) {
                photoUrls.push(uploadResult.data.publicUrl);
              }
            } catch (uploadError) {
              console.error("Upload error:", uploadError);
              toast.error(`Failed to upload ${file.name}`);
            }
          }

          setUploadingPhotos(false);

          // Update venue with photo URLs if any were uploaded
          if (photoUrls.length > 0) {
            const updateResult = await updateVenuePhotos(venueId, photoUrls);
            if (updateResult.success) {
              toast.success(`${photoUrls.length} photo(s) uploaded successfully!`);
            } else {
              toast.error("Failed to save photos to venue");
              console.error("Photo update error:", updateResult.error);
            }
          }
        }

        router.push(`/venues/new/success?venueId=${venueId}`);
      } catch (error) {
        console.error("Error submitting venue:", error);
        setError("An unexpected error occurred. Please try again.");
        setUploadingPhotos(false);
      }
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/venues"
          className="text-primary hover:underline text-sm mb-2 block"
        >
          ← Back to Venues
        </Link>
        <h1 className="text-2xl font-bold mb-2">Submit a New Venue</h1>
        <p className="text-muted-foreground">
          Help build our community by adding venues where you can enjoy pisco.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Google Maps Link - First Step */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LinkIcon className="h-5 w-5" />
              Step 1: Find Your Venue on Google Maps
            </CardTitle>
            <p className="text-muted-foreground text-sm">
              Start by sharing a Google Maps link to automatically populate venue details
            </p>
          </CardHeader>
          <CardContent>
            <GoogleMapsLinkInput
              onCoordinatesExtracted={handleCoordinatesExtracted}
              currentCoordinates={
                formData.latitude && formData.longitude
                  ? {
                      lat: parseFloat(formData.latitude),
                      lng: parseFloat(formData.longitude),
                    }
                  : undefined
              }
              disabled={isPending}
            />
          </CardContent>
        </Card>

        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Step 2: Venue Details
            </CardTitle>
            <p className="text-muted-foreground text-sm">
              Review and complete the venue information below
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Venue Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="e.g., The Cocktail Lab"
                  required
                />
              </div>
              <div>
                <Label htmlFor="type">Venue Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => handleInputChange("type", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select venue type" />
                  </SelectTrigger>
                  <SelectContent>
                    {VENUE_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <type.icon className="h-4 w-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="address">Address *</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                placeholder="e.g., 123 Main Street, Downtown"
                required
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleInputChange("city", e.target.value)}
                  placeholder="e.g., London"
                  required
                />
              </div>
              <div>
                <Label htmlFor="country">Country *</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => handleInputChange("country", e.target.value)}
                  placeholder="e.g., United Kingdom"
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location Coordinates (Advanced/Manual) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Step 3: Location Coordinates
              <Badge variant="outline" className="text-xs">
                Advanced
              </Badge>
            </CardTitle>
            <p className="text-muted-foreground text-sm">
              Coordinates should be automatically populated from the Google Maps link above
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="latitude">Latitude *</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  value={formData.latitude}
                  onChange={(e) =>
                    handleInputChange("latitude", e.target.value)
                  }
                  placeholder="e.g., 51.5074"
                  required
                />
              </div>
              <div>
                <Label htmlFor="longitude">Longitude *</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  value={formData.longitude}
                  onChange={(e) =>
                    handleInputChange("longitude", e.target.value)
                  }
                  placeholder="e.g., -0.1278"
                  required
                />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              💡 If coordinates are missing, please use the Google Maps link in Step 1 above
            </p>
          </CardContent>
        </Card>

        {/* Details */}
        <Card>
          <CardHeader>
            <CardTitle>Step 4: Additional Details</CardTitle>
            <p className="text-muted-foreground text-sm">
              Add pricing, brands, and atmosphere information
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Price Range */}
            <div>
              <Label htmlFor="price_range">Price Range</Label>
              <Select
                value={formData.price_range}
                onValueChange={(value) =>
                  handleInputChange("price_range", value)
                }
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

            <Separator />

            {/* Brands */}
            <div>
              <Label>Featured Brands</Label>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    value={newBrand}
                    onChange={(e) => setNewBrand(e.target.value)}
                    placeholder="Add a brand..."
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addBrand(newBrand);
                        setNewBrand("");
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      addBrand(newBrand);
                      setNewBrand("");
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {/* Common brands */}
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Common brands:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {COMMON_BRANDS.map((brand) => (
                      <Badge
                        key={brand}
                        variant={brands.includes(brand) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() =>
                          brands.includes(brand)
                            ? removeBrand(brand)
                            : addBrand(brand)
                        }
                      >
                        {brand}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Selected brands */}
                {brands.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Selected brands:</p>
                    <div className="flex flex-wrap gap-2">
                      {brands.map((brand) => (
                        <Badge
                          key={brand}
                          variant="default"
                          className="flex items-center gap-1"
                        >
                          {brand}
                          <X
                            className="h-3 w-3 cursor-pointer"
                            onClick={() => removeBrand(brand)}
                          />
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Ambiance */}
            <div>
              <Label>Ambiance & Atmosphere</Label>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    value={newAmbiance}
                    onChange={(e) => setNewAmbiance(e.target.value)}
                    placeholder="Add ambiance tag..."
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addAmbiance(newAmbiance);
                        setNewAmbiance("");
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      addAmbiance(newAmbiance);
                      setNewAmbiance("");
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {/* Common ambiance */}
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Common tags:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {COMMON_AMBIANCE.map((amb) => (
                      <Badge
                        key={amb}
                        variant={ambiance.includes(amb) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() =>
                          ambiance.includes(amb)
                            ? removeAmbiance(amb)
                            : addAmbiance(amb)
                        }
                      >
                        {amb}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Selected ambiance */}
                {ambiance.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Selected tags:</p>
                    <div className="flex flex-wrap gap-2">
                      {ambiance.map((amb) => (
                        <Badge
                          key={amb}
                          variant="default"
                          className="flex items-center gap-1"
                        >
                          {amb}
                          <X
                            className="h-3 w-3 cursor-pointer"
                            onClick={() => removeAmbiance(amb)}
                          />
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Photos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Step 5: Photos (Optional)
            </CardTitle>
            <p className="text-muted-foreground text-sm">
              Upload photos to showcase the venue's atmosphere
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="photos">Upload Photos</Label>
              <Input
                id="photos"
                type="file"
                multiple
                accept="image/*"
                onChange={handlePhotoChange}
                className="cursor-pointer"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Upload up to 10 photos. Supported formats: JPG, PNG, WebP
              </p>
            </div>

            {photos.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">
                  Selected photos ({photos.length}/10):
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {photos.map((photo, index) => (
                    <div key={index} className="relative">
                      <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                        <Camera className="h-8 w-8 text-gray-400" />
                      </div>
                      <p className="text-xs mt-1 truncate">{photo.name}</p>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute -top-2 -right-2 h-6 w-6 p-0"
                        onClick={() => removePhoto(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Error message */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-red-800">Error</h4>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Submit */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-1">
                  Review Process
                </h4>
                <p className="text-blue-700 text-sm">
                  Your submission will be reviewed by our team before appearing
                  publicly. We typically review submissions within 24-48 hours.
                </p>
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={isPending || uploadingPhotos}
              >
                {isPending || uploadingPhotos ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {uploadingPhotos ? "Uploading Photos..." : "Submitting Venue..."}
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Submit Venue for Review
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
