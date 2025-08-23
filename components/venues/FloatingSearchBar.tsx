"use client";

import { useState } from "react";
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
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Filter,
  X,
} from "lucide-react";
import Link from "next/link";
import type { VenueFilters } from "@/lib/venues";

interface FloatingSearchBarProps {
  defaultValues: VenueFilters;
  cities: string[];
  brands: string[];
  resultCount: number;
}

export default function FloatingSearchBar({
  defaultValues,
  cities,
  brands,
  resultCount,
}: FloatingSearchBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState(defaultValues.q || "");
  const [selectedCity, setSelectedCity] = useState(
    defaultValues.city || "all"
  );
  const [selectedType, setSelectedType] = useState(
    defaultValues.type || "all"
  );
  const [selectedBrand, setSelectedBrand] = useState(
    defaultValues.brand || "all"
  );

  const hasActiveFilters =
    searchQuery ||
    selectedCity !== "all" ||
    selectedType !== "all" ||
    selectedBrand !== "all";

  const getActiveFiltersCount = () => {
    let count = 0;
    if (searchQuery) count++;
    if (selectedCity !== "all") count++;
    if (selectedType !== "all") count++;
    if (selectedBrand !== "all") count++;
    return count;
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCity("all");
    setSelectedType("all");
    setSelectedBrand("all");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const params = new URLSearchParams();

    // Build query parameters
    const query = formData.get("q")?.toString();
    const city = formData.get("city")?.toString();
    const type = formData.get("type")?.toString();
    const brand = formData.get("brand")?.toString();

    if (query) params.set("q", query);
    if (city && city !== "all") params.set("city", city);
    if (type && type !== "all") params.set("type", type);
    if (brand && brand !== "all") params.set("brand", brand);

    // Navigate to venues page with filters
    window.location.href = `/venues?${params.toString()}`;
  };

  return (
    <>
      {/* Mobile: Bottom sticky search bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 p-4">
        <Card className="shadow-lg border-2 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
          <CardContent className="p-4">
            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Main search row */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    name="q"
                    placeholder="Search venues..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 bg-white"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="relative shrink-0"
                >
                  <Filter className="h-4 w-4" />
                  {hasActiveFilters && (
                    <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs">
                      {getActiveFiltersCount()}
                    </Badge>
                  )}
                </Button>
                <Button type="submit" size="sm" className="shrink-0">
                  Search
                </Button>
              </div>

              {/* Expandable filters for mobile */}
              {isExpanded && (
                <div className="border-t pt-3 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">City</Label>
                      <Select
                        name="city"
                        value={selectedCity}
                        onValueChange={setSelectedCity}
                      >
                        <SelectTrigger className="h-8 text-sm bg-white">
                          <SelectValue placeholder="All cities" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All cities</SelectItem>
                          {cities.map((city) => (
                            <SelectItem key={city} value={city}>
                              {city}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-xs text-muted-foreground">Type</Label>
                      <Select
                        name="type"
                        value={selectedType}
                        onValueChange={setSelectedType}
                      >
                        <SelectTrigger className="h-8 text-sm bg-white">
                          <SelectValue placeholder="All types" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All types</SelectItem>
                          <SelectItem value="bar">Bar</SelectItem>
                          <SelectItem value="pub">Pub</SelectItem>
                          <SelectItem value="liquor_store">Store</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground">Brand</Label>
                    <Select
                      name="brand"
                      value={selectedBrand}
                      onValueChange={setSelectedBrand}
                    >
                      <SelectTrigger className="h-8 text-sm bg-white">
                        <SelectValue placeholder="All brands" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All brands</SelectItem>
                        {brands.map((brand) => (
                          <SelectItem key={brand} value={brand}>
                            {brand}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {hasActiveFilters && (
                    <div className="flex justify-between items-center pt-2 border-t">
                      <span className="text-xs text-muted-foreground">
                        {resultCount} venues found
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                        className="h-7 text-xs"
                      >
                        Clear
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Active filters display for mobile */}
              {hasActiveFilters && !isExpanded && (
                <div className="flex items-center gap-1 flex-wrap">
                  {searchQuery && (
                    <Badge variant="secondary" className="text-xs h-6">
                      {searchQuery}
                    </Badge>
                  )}
                  {selectedCity !== "all" && (
                    <Badge variant="secondary" className="text-xs h-6">
                      {selectedCity}
                    </Badge>
                  )}
                  {selectedType !== "all" && (
                    <Badge variant="secondary" className="text-xs h-6">
                      {selectedType}
                    </Badge>
                  )}
                  {selectedBrand !== "all" && (
                    <Badge variant="secondary" className="text-xs h-6">
                      {selectedBrand}
                    </Badge>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="ml-auto h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Desktop: Search bar */}
      <div className="hidden lg:block">
        <Card className="shadow-lg border-2 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
          <CardContent className="p-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Main search row */}
              <div className="flex items-center gap-3">
                {/* Search Input */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    name="q"
                    placeholder="Search venues..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 bg-white"
                  />
                </div>

                {/* Quick City Filter */}
                <div className="min-w-[140px]">
                  <Select
                    name="city"
                    value={selectedCity}
                    onValueChange={setSelectedCity}
                  >
                    <SelectTrigger className="text-sm bg-white">
                      <SelectValue placeholder="All cities" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All cities</SelectItem>
                      {cities.map((city) => (
                        <SelectItem key={city} value={city}>
                          {city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Filter Toggle Button */}
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="relative"
                >
                  <Filter className="h-4 w-4" />
                  {hasActiveFilters && (
                    <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs">
                      {getActiveFiltersCount()}
                    </Badge>
                  )}
                </Button>

                {/* Search Button */}
                <Button type="submit" className="px-6">
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>

              {/* Quick Brand Filters */}
              {brands.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-muted-foreground">Popular brands:</span>
                  {brands.slice(0, 6).map((brand) => (
                    <Button
                      key={brand}
                      type="button"
                      variant={selectedBrand === brand ? "default" : "outline"}
                      size="sm"
                      className="text-xs h-7"
                      onClick={() => {
                        setSelectedBrand(selectedBrand === brand ? "all" : brand);
                        // Auto-submit when brand is selected
                        setTimeout(() => {
                          const form = document.querySelector('form') as HTMLFormElement;
                          if (form) form.requestSubmit();
                        }, 100);
                      }}
                    >
                      {brand}
                    </Button>
                  ))}
                  {brands.length > 6 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-xs h-7 text-muted-foreground"
                      onClick={() => setIsExpanded(true)}
                    >
                      +{brands.length - 6} more
                    </Button>
                  )}
                </div>
              )}

              {/* Expandable filters */}
              {isExpanded && (
                <div className="border-t pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    {/* Type Filter */}
                    <div>
                      <Label className="text-sm text-muted-foreground">
                        Venue Type
                      </Label>
                      <Select
                        name="type"
                        value={selectedType}
                        onValueChange={setSelectedType}
                      >
                        <SelectTrigger className="bg-white">
                          <SelectValue placeholder="All types" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All types</SelectItem>
                          <SelectItem value="bar">Cocktail Bar</SelectItem>
                          <SelectItem value="pub">Pub</SelectItem>
                          <SelectItem value="liquor_store">Liquor Store</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Brand Filter */}
                    <div>
                      <Label className="text-sm text-muted-foreground">
                        Brand
                      </Label>
                      <Select
                        name="brand"
                        value={selectedBrand}
                        onValueChange={setSelectedBrand}
                      >
                        <SelectTrigger className="bg-white">
                          <SelectValue placeholder="All brands" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All brands</SelectItem>
                          {brands.map((brand) => (
                            <SelectItem key={brand} value={brand}>
                              {brand}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Clear Filters */}
                  {hasActiveFilters && (
                    <div className="flex justify-between items-center mt-4 pt-4 border-t">
                      <span className="text-sm text-muted-foreground">
                        {resultCount} venues found
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Clear Filters
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Active Filters Display */}
              {hasActiveFilters && !isExpanded && (
                <div className="flex items-center gap-2 pt-2 border-t">
                  <span className="text-sm text-muted-foreground">Filters:</span>
                  {searchQuery && (
                    <Badge variant="secondary">Search: {searchQuery}</Badge>
                  )}
                  {selectedCity !== "all" && (
                    <Badge variant="secondary">City: {selectedCity}</Badge>
                  )}
                  {selectedType !== "all" && (
                    <Badge variant="secondary">Type: {selectedType}</Badge>
                  )}
                  {selectedBrand !== "all" && (
                    <Badge variant="secondary">Brand: {selectedBrand}</Badge>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="ml-auto"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </form>

            {/* Results count */}
            {!isExpanded && (
              <div className="flex items-center justify-between mt-2 pt-2 border-t">
                <span className="text-sm text-muted-foreground">
                  {resultCount} venues found
                </span>
                {hasActiveFilters && (
                  <Button asChild variant="ghost" size="sm">
                    <Link href="/venues">View all venues</Link>
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}