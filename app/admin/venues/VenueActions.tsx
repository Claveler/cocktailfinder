"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Check,
  X,
  Edit,
  MoreHorizontal,
  Loader2,
  ExternalLink,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { approveVenue, rejectVenue, updateVenue } from "@/lib/actions/admin";
import DeleteConfirmationModal from "@/components/admin/DeleteConfirmationModal";

interface Venue {
  id: string;
  name: string;
  type: "bar" | "pub" | "liquor_store";
  address: string;
  city: string;
  country: string;
  location?: { lat: number; lng: number } | null;
  brands: string[];
  price_range?: string | null;
  ambiance: string[];
  photos: string[];
  status: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  profile?: { full_name?: string | null };
}

interface VenueActionsProps {
  venue: Venue;
}

const VENUE_TYPES = [
  { value: "bar", label: "Cocktail Bar" },
  { value: "pub", label: "Pub" },
  { value: "liquor_store", label: "Liquor Store" },
  { value: "restaurant", label: "Restaurant" },
];

const PRICE_RANGES = [
  { value: "$", label: "$ - Budget friendly" },
  { value: "$$", label: "$$ - Moderate" },
  { value: "$$$", label: "$$$ - Upscale" },
  { value: "$$$$", label: "$$$$ - Luxury" },
];

export default function VenueActions({ venue }: VenueActionsProps) {
  const [isPending, startTransition] = useTransition();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: venue.name,
    type: venue.type,
    address: venue.address,
    city: venue.city,
    country: venue.country,
    latitude: venue.location?.lat?.toString() || "",
    longitude: venue.location?.lng?.toString() || "",
    price_range: venue.price_range || "none",
    brands: venue.brands.join(", "),
    ambiance: venue.ambiance.join(", "),
  });

  const handleApprove = () => {
    startTransition(async () => {
      const result = await approveVenue(venue.id);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.error);
      }
    });
  };

  const handleReject = () => {
    startTransition(async () => {
      const result = await rejectVenue(venue.id);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.error);
      }
    });
  };

  const handleEdit = () => {
    startTransition(async () => {
      const updates: any = {
        name: editForm.name.trim(),
        type: editForm.type,
        address: editForm.address.trim(),
        city: editForm.city.trim(),
        country: editForm.country.trim(),
        price_range: editForm.price_range === "none" ? null : editForm.price_range,
        brands: editForm.brands
          .split(",")
          .map((b) => b.trim())
          .filter(Boolean),
        ambiance: editForm.ambiance
          .split(",")
          .map((a) => a.trim())
          .filter(Boolean),
      };

      // Add coordinates if provided
      if (editForm.latitude && editForm.longitude) {
        const lat = parseFloat(editForm.latitude);
        const lng = parseFloat(editForm.longitude);
        if (!isNaN(lat) && !isNaN(lng)) {
          updates.latitude = lat;
          updates.longitude = lng;
        }
      }

      const result = await updateVenue(venue.id, updates);
      if (result.success) {
        toast.success(result.message);
        setEditDialogOpen(false);
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <div className="flex items-center gap-2">
      {/* Quick Actions */}
      <Button
        size="sm"
        variant="default"
        onClick={handleApprove}
        disabled={isPending}
        className="bg-green-600 hover:bg-green-700"
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Check className="h-4 w-4" />
        )}
      </Button>

      <Button
        size="sm"
        variant="destructive"
        onClick={handleReject}
        disabled={isPending}
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <X className="h-4 w-4" />
        )}
      </Button>

      {/* More Actions */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="ghost">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogTrigger asChild>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Details
              </DropdownMenuItem>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Venue: {venue.name}</DialogTitle>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-name">Name</Label>
                    <Input
                      id="edit-name"
                      value={editForm.name}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-type">Type</Label>
                    <Select
                      value={editForm.type}
                      onValueChange={(value) =>
                        setEditForm((prev) => ({ ...prev, type: value as any }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
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

                {/* Address */}
                <div>
                  <Label htmlFor="edit-address">Address</Label>
                  <Input
                    id="edit-address"
                    value={editForm.address}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        address: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-city">City</Label>
                    <Input
                      id="edit-city"
                      value={editForm.city}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          city: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-country">Country</Label>
                    <Input
                      id="edit-country"
                      value={editForm.country}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          country: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>

                {/* Coordinates */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-lat">Latitude</Label>
                    <Input
                      id="edit-lat"
                      type="number"
                      step="any"
                      value={editForm.latitude}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          latitude: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-lng">Longitude</Label>
                    <Input
                      id="edit-lng"
                      type="number"
                      step="any"
                      value={editForm.longitude}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          longitude: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>

                {/* Price Range */}
                <div>
                  <Label htmlFor="edit-price">Price Range</Label>
                  <Select
                    value={editForm.price_range}
                    onValueChange={(value) =>
                      setEditForm((prev) => ({ ...prev, price_range: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select price range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {PRICE_RANGES.map((range) => (
                        <SelectItem key={range.value} value={range.value}>
                          {range.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Brands */}
                <div>
                  <Label htmlFor="edit-brands">Brands (comma-separated)</Label>
                  <Textarea
                    id="edit-brands"
                    value={editForm.brands}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        brands: e.target.value,
                      }))
                    }
                    rows={2}
                  />
                </div>

                {/* Ambiance */}
                <div>
                  <Label htmlFor="edit-ambiance">
                    Ambiance (comma-separated)
                  </Label>
                  <Textarea
                    id="edit-ambiance"
                    value={editForm.ambiance}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        ambiance: e.target.value,
                      }))
                    }
                    rows={2}
                  />
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setEditDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleEdit} disabled={isPending}>
                    {isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <DropdownMenuItem asChild>
            <Link href={`/venues/${venue.id}`} target="_blank">
              <ExternalLink className="mr-2 h-4 w-4" />
              View Details
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem 
            onClick={() => setDeleteModalOpen(true)}
            className="text-red-600 focus:text-red-600 focus:bg-red-50"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Venue
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        venue={{
          id: venue.id,
          name: venue.name,
        }}
      />
    </div>
  );
}
