"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  CHILE_WARNING_TEXT,
  ChileWarningModal,
  useChileValidation,
} from "@/lib/chile-validation";
import { Save, Loader2, X, Plus, Upload, Trash2, Image } from "lucide-react";
import { updateVenueAction } from "@/lib/actions/admin";
import DeleteConfirmationModal from "@/components/admin/DeleteConfirmationModal";
import { uploadPhoto, deletePhoto } from "@/lib/storage";
import { toast } from "sonner";
import type { VenueWithComments } from "@/lib/venues";
import GoogleMapsLinkInput from "@/components/forms/GoogleMapsLinkInput";
import type { Coordinates, VenueInfo } from "@/lib/maps";

interface VenueEditFormProps {
  venue: VenueWithComments;
}

const VENUE_TYPES = [
  { value: "bar", label: "Cocktail Bar" },
  { value: "pub", label: "Pub" },
  { value: "liquor_store", label: "Liquor Store" },
  { value: "restaurant", label: "Restaurant" },
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

const COUNTRIES = [
  "Afghanistan",
  "Albania",
  "Algeria",
  "Andorra",
  "Angola",
  "Antigua and Barbuda",
  "Argentina",
  "Armenia",
  "Australia",
  "Austria",
  "Azerbaijan",
  "Bahamas",
  "Bahrain",
  "Bangladesh",
  "Barbados",
  "Belarus",
  "Belgium",
  "Belize",
  "Benin",
  "Bhutan",
  "Bolivia",
  "Bosnia and Herzegovina",
  "Botswana",
  "Brazil",
  "Brunei",
  "Bulgaria",
  "Burkina Faso",
  "Burundi",
  "Cambodia",
  "Cameroon",
  "Canada",
  "Cape Verde",
  "Central African Republic",
  "Chad",
  "Chile",
  "China",
  "Colombia",
  "Comoros",
  "Congo",
  "Costa Rica",
  "Croatia",
  "Cuba",
  "Cyprus",
  "Czech Republic",
  "Democratic Republic of the Congo",
  "Denmark",
  "Djibouti",
  "Dominica",
  "Dominican Republic",
  "East Timor",
  "Ecuador",
  "Egypt",
  "El Salvador",
  "Equatorial Guinea",
  "Eritrea",
  "Estonia",
  "Eswatini",
  "Ethiopia",
  "Fiji",
  "Finland",
  "France",
  "Gabon",
  "Gambia",
  "Georgia",
  "Germany",
  "Ghana",
  "Greece",
  "Grenada",
  "Guatemala",
  "Guinea",
  "Guinea-Bissau",
  "Guyana",
  "Haiti",
  "Honduras",
  "Hungary",
  "Iceland",
  "India",
  "Indonesia",
  "Iran",
  "Iraq",
  "Ireland",
  "Israel",
  "Italy",
  "Ivory Coast",
  "Jamaica",
  "Japan",
  "Jordan",
  "Kazakhstan",
  "Kenya",
  "Kiribati",
  "Kuwait",
  "Kyrgyzstan",
  "Laos",
  "Latvia",
  "Lebanon",
  "Lesotho",
  "Liberia",
  "Libya",
  "Liechtenstein",
  "Lithuania",
  "Luxembourg",
  "Madagascar",
  "Malawi",
  "Malaysia",
  "Maldives",
  "Mali",
  "Malta",
  "Marshall Islands",
  "Mauritania",
  "Mauritius",
  "Mexico",
  "Micronesia",
  "Moldova",
  "Monaco",
  "Mongolia",
  "Montenegro",
  "Morocco",
  "Mozambique",
  "Myanmar",
  "Namibia",
  "Nauru",
  "Nepal",
  "Netherlands",
  "New Zealand",
  "Nicaragua",
  "Niger",
  "Nigeria",
  "North Korea",
  "North Macedonia",
  "Norway",
  "Oman",
  "Pakistan",
  "Palau",
  "Palestine",
  "Panama",
  "Papua New Guinea",
  "Paraguay",
  "Peru",
  "Philippines",
  "Poland",
  "Portugal",
  "Qatar",
  "Romania",
  "Russia",
  "Rwanda",
  "Saint Kitts and Nevis",
  "Saint Lucia",
  "Saint Vincent and the Grenadines",
  "Samoa",
  "San Marino",
  "Sao Tome and Principe",
  "Saudi Arabia",
  "Senegal",
  "Serbia",
  "Seychelles",
  "Sierra Leone",
  "Singapore",
  "Slovakia",
  "Slovenia",
  "Solomon Islands",
  "Somalia",
  "South Africa",
  "South Korea",
  "South Sudan",
  "Spain",
  "Sri Lanka",
  "Sudan",
  "Suriname",
  "Sweden",
  "Switzerland",
  "Syria",
  "Taiwan",
  "Tajikistan",
  "Tanzania",
  "Thailand",
  "Togo",
  "Tonga",
  "Trinidad and Tobago",
  "Tunisia",
  "Turkey",
  "Turkmenistan",
  "Tuvalu",
  "Uganda",
  "Ukraine",
  "United Arab Emirates",
  "United Kingdom",
  "United States",
  "Uruguay",
  "Uzbekistan",
  "Vanuatu",
  "Vatican City",
  "Venezuela",
  "Vietnam",
  "Yemen",
  "Zambia",
  "Zimbabwe",
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
    google_maps_url: venue.google_maps_url || "",
    featured_verification_id: venue.featured_verification_id || "",
  });

  // Photo management state
  const [currentPhotos, setCurrentPhotos] = useState<string[]>(
    venue.photos || []
  );
  const [photosToDelete, setPhotosToDelete] = useState<string[]>([]);
  const [newPhotos, setNewPhotos] = useState<File[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  // Chile validation hook
  const {
    chileWarningOpen,
    handleCountryChange: chileHandleCountryChange,
    handleGoogleMapsExtraction,
    validateFormSubmission,
    closeModal,
  } = useChileValidation();

  // Brand management
  const [newBrand, setNewBrand] = useState("");
  const [newAmbiance, setNewAmbiance] = useState("");

  const addBrand = () => {
    if (newBrand.trim() && !formData.brands.includes(newBrand.trim())) {
      setFormData((prev) => ({
        ...prev,
        brands: [...prev.brands, newBrand.trim()],
      }));
      setNewBrand("");
    }
  };

  const removeBrand = (brandToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      brands: prev.brands.filter((brand) => brand !== brandToRemove),
    }));
  };

  const addAmbiance = () => {
    if (newAmbiance.trim() && !formData.ambiance.includes(newAmbiance.trim())) {
      setFormData((prev) => ({
        ...prev,
        ambiance: [...prev.ambiance, newAmbiance.trim()],
      }));
      setNewAmbiance("");
    }
  };

  const removeAmbiance = (ambianceToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      ambiance: prev.ambiance.filter((amb) => amb !== ambianceToRemove),
    }));
  };

  const handleCoordinatesExtracted = (
    coordinates: Coordinates,
    originalUrl?: string,
    venueInfo?: VenueInfo
  ) => {
    // Always populate the form data first
    setFormData((prev) => ({
      ...prev,
      latitude: coordinates.lat,
      longitude: coordinates.lng,
      google_maps_url: originalUrl || prev.google_maps_url,
      // Only update venue info if current fields are empty or if user confirms
      name: venueInfo?.name && !prev.name ? venueInfo.name : prev.name,
      address:
        venueInfo?.address && !prev.address ? venueInfo.address : prev.address,
      city: venueInfo?.city && !prev.city ? venueInfo.city : prev.city,
      country:
        venueInfo?.country && !prev.country ? venueInfo.country : prev.country,
    }));

    // Check if the extracted location is in Chile and show warning
    handleGoogleMapsExtraction(venueInfo?.country);
  };

  // Photo management functions
  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files) {
        const newFiles = Array.from(files).slice(0, 5); // Limit to 5 new photos
        setNewPhotos((prev) => [...prev, ...newFiles].slice(0, 5));
      }
    },
    []
  );

  const removeNewPhoto = useCallback((index: number) => {
    setNewPhotos((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const markPhotoForDeletion = useCallback((photoUrl: string) => {
    setPhotosToDelete((prev) => [...prev, photoUrl]);
    setCurrentPhotos((prev) => prev.filter((photo) => photo !== photoUrl));
  }, []);

  const restorePhoto = useCallback((photoUrl: string) => {
    setPhotosToDelete((prev) => prev.filter((url) => url !== photoUrl));
    setCurrentPhotos((prev) => [...prev, photoUrl]);
  }, []);

  const handleImageError = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const img = e.currentTarget;
      img.style.display = "none";
      if (img.parentElement) {
        const placeholder = document.createElement("div");
        placeholder.className =
          "w-full h-full flex items-center justify-center bg-gray-200 text-gray-500 text-xs";
        placeholder.textContent = "Image failed to load";
        img.parentElement.appendChild(placeholder);
      }
    },
    []
  );

  const handleCountryChange = (value: string) => {
    chileHandleCountryChange(value, (validCountry) => {
      setFormData((prev) => ({ ...prev, country: validCountry }));
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setUploadingPhotos(false);

    // Prevent venues in Chile (should be caught by modal, but double-check)
    if (!validateFormSubmission(formData.country)) {
      setIsSubmitting(false);
      return;
    }

    setUploadingPhotos(true);

    try {
      // Handle photo deletions first
      if (photosToDelete.length > 0) {
        toast.info(`Deleting ${photosToDelete.length} photo(s)...`);
        for (const photoUrl of photosToDelete) {
          try {
            // Extract path from URL for deletion
            const urlParts = photoUrl.split("/venue-photos/");
            if (urlParts.length === 2) {
              const path = urlParts[1];
              await deletePhoto(path);
            }
          } catch (deleteError) {
            console.warn("Failed to delete photo:", photoUrl, deleteError);
            // Continue with other deletions
          }
        }
      }

      // Handle new photo uploads
      const uploadedPhotoUrls: string[] = [];
      if (newPhotos.length > 0) {
        toast.info(`Uploading ${newPhotos.length} new photo(s)...`);

        for (const file of newPhotos) {
          try {
            const uploadResult = await uploadPhoto(file, venue.id);
            if (uploadResult.error) {
              console.error("Upload error:", uploadResult.error);
              toast.error(`Failed to upload ${file.name}`);
            } else if (uploadResult.data) {
              uploadedPhotoUrls.push(uploadResult.data.publicUrl);
            }
          } catch (uploadError) {
            console.error("Upload error:", uploadError);
            toast.error(`Failed to upload ${file.name}`);
          }
        }
      }

      setUploadingPhotos(false);

      // Combine remaining current photos with newly uploaded photos
      const finalPhotos = [...currentPhotos, ...uploadedPhotoUrls];

      // Update venue with all data including photos
      const venueUpdateData = {
        ...formData,
        photos: finalPhotos,
      };

      const result = await updateVenueAction(venue.id, venueUpdateData);

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
      setUploadingPhotos(false);
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
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, name: e.target.value }))
            }
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="type">Type *</Label>
          <Select
            value={formData.type}
            onValueChange={(value) =>
              setFormData((prev) => ({
                ...prev,
                type: value as "bar" | "pub" | "liquor_store",
              }))
            }
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
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, address: e.target.value }))
            }
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
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, city: e.target.value }))
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="country">Country *</Label>
            <Select
              value={formData.country}
              onValueChange={handleCountryChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent>
                {COUNTRIES.map((country) => (
                  <SelectItem key={country} value={country}>
                    {country}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              {CHILE_WARNING_TEXT}
            </p>
          </div>
        </div>

        {/* Google Maps Link Input */}
        <GoogleMapsLinkInput
          onCoordinatesExtracted={handleCoordinatesExtracted}
          currentCoordinates={
            formData.latitude && formData.longitude
              ? {
                  lat: formData.latitude,
                  lng: formData.longitude,
                }
              : undefined
          }
          disabled={isSubmitting}
        />

        <Separator />

        {/* Manual Coordinate Entry (as fallback) */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">Manual Entry</Label>
            <Badge variant="outline" className="text-xs">
              Advanced
            </Badge>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="latitude">Latitude</Label>
              <Input
                id="latitude"
                type="number"
                step="any"
                value={formData.latitude}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    latitude: parseFloat(e.target.value) || 0,
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="longitude">Longitude</Label>
              <Input
                id="longitude"
                type="number"
                step="any"
                value={formData.longitude}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    longitude: parseFloat(e.target.value) || 0,
                  }))
                }
              />
            </div>
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
            onValueChange={(value) =>
              setFormData((prev) => ({ ...prev, price_range: value }))
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

        {/* Brands */}
        <div className="space-y-2">
          <Label>Featured Brands</Label>
          <div className="flex gap-2">
            <Input
              value={newBrand}
              onChange={(e) => setNewBrand(e.target.value)}
              placeholder="Add a brand"
              onKeyPress={(e) =>
                e.key === "Enter" && (e.preventDefault(), addBrand())
              }
            />
            <Button type="button" onClick={addBrand} size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {formData.brands.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.brands.map((brand) => (
                <Badge
                  key={brand}
                  variant="secondary"
                  className="flex items-center gap-1"
                >
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
              onKeyPress={(e) =>
                e.key === "Enter" && (e.preventDefault(), addAmbiance())
              }
            />
            <Button type="button" onClick={addAmbiance} size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {formData.ambiance.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.ambiance.map((amb) => (
                <Badge
                  key={amb}
                  variant="outline"
                  className="flex items-center gap-1"
                >
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

      {/* Photo Management */}
      <Separator />
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Photo Management</h3>

        {/* Current Photos */}
        {currentPhotos.length > 0 && (
          <div className="space-y-2">
            <Label>Current Photos</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {currentPhotos.map((photo, index) => (
                <div key={photo} className="relative group">
                  <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={photo}
                      alt={`Venue photo ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={handleImageError}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => markPhotoForDeletion(photo)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Photos Marked for Deletion */}
        {photosToDelete.length > 0 && (
          <div className="space-y-2">
            <Label className="text-red-600">Photos Marked for Deletion</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {photosToDelete.map((photo, index) => (
                <div key={photo} className="relative group">
                  <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden opacity-50">
                    <img
                      src={photo}
                      alt={`Deleted photo ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-red-500 bg-opacity-20 flex items-center justify-center">
                      <Trash2 className="h-6 w-6 text-red-600" />
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="absolute top-1 right-1 h-6 w-6 p-0"
                    onClick={() => restorePhoto(photo)}
                    title="Restore photo"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* New Photos */}
        {newPhotos.length > 0 && (
          <div className="space-y-2">
            <Label className="text-green-600">New Photos to Upload</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {newPhotos.map((file, index) => (
                <div key={index} className="relative group">
                  <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 border-green-200">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`New photo ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeNewPhoto(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                  <div className="absolute bottom-1 left-1 bg-black bg-opacity-75 text-white text-xs px-1 rounded">
                    {file.name.length > 15
                      ? file.name.substring(0, 12) + "..."
                      : file.name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload New Photos */}
        <div className="space-y-2">
          <Label htmlFor="photoUpload">Add New Photos</Label>
          <div className="flex items-center gap-4">
            <Input
              id="photoUpload"
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="flex-1"
              disabled={isSubmitting || newPhotos.length >= 5}
            />
            <Badge variant="secondary" className="whitespace-nowrap">
              {newPhotos.length}/5 selected
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Upload up to 5 photos. Supported formats: JPG, PNG, WEBP
          </p>
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
            onValueChange={(value) =>
              setFormData((prev) => ({
                ...prev,
                status: value as "pending" | "approved" | "rejected",
              }))
            }
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

      {/* Featured Verification */}
      {venue.verifications && venue.verifications.length > 0 && (
        <>
          <Separator />
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">
              Featured Community Comment
            </h3>
            <p className="text-sm text-muted-foreground">
              Select one verification comment to highlight in venue cards and
              the venue page.
            </p>

            <div className="space-y-2">
              <Label htmlFor="featured_verification">Featured Comment</Label>
              <Select
                value={formData.featured_verification_id}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    featured_verification_id: value === "none" ? "" : value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a comment to feature" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No featured comment</SelectItem>
                  {venue.verifications
                    .filter((verification) => verification.pisco_notes)
                    .map((verification) => (
                      <SelectItem key={verification.id} value={verification.id}>
                        <div className="max-w-md">
                          <div className="font-medium">
                            {verification.verified_by}
                          </div>
                          <div className="text-sm text-muted-foreground truncate">
                            "{verification.pisco_notes}"
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Preview of selected comment */}
            {formData.featured_verification_id && (
              <div className="p-3 bg-muted/50 rounded-lg border">
                <div className="text-sm font-medium mb-1">Preview:</div>
                {(() => {
                  const selectedVerification = venue.verifications?.find(
                    (v) => v.id === formData.featured_verification_id
                  );
                  return selectedVerification ? (
                    <div className="text-sm italic">
                      "{selectedVerification.pisco_notes}" —{" "}
                      {selectedVerification.verified_by}
                    </div>
                  ) : null;
                })()}
              </div>
            )}
          </div>
        </>
      )}

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

        <Button
          type="button"
          variant="destructive"
          onClick={() => setDeleteModalOpen(true)}
          disabled={isSubmitting}
          className="sm:ml-auto"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete Venue
        </Button>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        venue={{
          id: venue.id,
          name: venue.name,
        }}
        redirectAfterDelete="/admin/venues"
      />

      {/* Chile Warning Modal */}
      <ChileWarningModal
        isOpen={chileWarningOpen}
        onClose={closeModal}
        context="edit"
      />
    </form>
  );
}
