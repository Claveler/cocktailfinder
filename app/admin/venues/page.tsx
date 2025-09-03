import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users, Clock, MapPin, AlertTriangle } from "lucide-react";
import { getPendingVenues } from "@/lib/actions/admin";
import VenueActions from "./VenueActions";

// Loading component
function VenuesTableSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
      ))}
    </div>
  );
}

async function VenuesTable() {
  const { data: venues, error } = await getPendingVenues();

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Error loading venues: {error}</p>
      </div>
    );
  }

  if (!venues || venues.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">No pending venues</h3>
        <p className="text-muted-foreground">
          All venue submissions have been reviewed.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Venue Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Submitted By</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Details</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {venues.map((venue) => (
            <TableRow key={venue.id}>
              <TableCell>
                <div>
                  <div className="font-medium">{venue.name}</div>
                  <div className="text-sm text-muted-foreground">
                    ID: {venue.id.slice(0, 8)}...
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="capitalize">
                  {venue.type.replace("_", " ")}
                </Badge>
              </TableCell>
              <TableCell>
                {/* Check if venue needs coordinate verification */}
                {venue.address?.includes("(coordinates need verification)") ? (
                  <div className="space-y-2">
                    {/* Warning banner */}
                    <div className="flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded-md">
                      <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                      <div className="text-sm">
                        <div className="font-medium text-amber-800">
                          ⚠️ Coordinates Need Verification
                        </div>
                        <div className="text-amber-700 text-xs">
                          From mobile app URL - placeholder coordinates used
                        </div>
                      </div>
                    </div>
                    {/* Location info */}
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div className="text-sm">
                        <div>
                          {venue.city}, {venue.country}
                        </div>
                        <div className="text-muted-foreground">
                          {venue.address?.replace(
                            " (coordinates need verification)",
                            ""
                          )}
                        </div>
                        {venue.location && (
                          <div className="text-xs text-amber-600 font-medium">
                            📍 Placeholder: {venue.location.lat.toFixed(4)},{" "}
                            {venue.location.lng.toFixed(4)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="text-sm">
                      <div>
                        {venue.city}, {venue.country}
                      </div>
                      <div className="text-muted-foreground">
                        {venue.address}
                      </div>
                      {venue.location && (
                        <div className="text-xs text-muted-foreground">
                          {venue.location.lat.toFixed(4)},{" "}
                          {venue.location.lng.toFixed(4)}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  {venue.profile?.full_name || "Unknown"}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div className="text-sm">
                    {new Date(venue.created_at).toLocaleDateString()}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-1 text-sm">
                  {venue.brands.length > 0 && (
                    <div>
                      <span className="text-muted-foreground">Brands:</span>{" "}
                      {venue.brands.slice(0, 2).join(", ")}
                      {venue.brands.length > 2 &&
                        ` +${venue.brands.length - 2} more`}
                    </div>
                  )}
                  {venue.ambiance.length > 0 && (
                    <div>
                      <span className="text-muted-foreground">Ambiance:</span>{" "}
                      {venue.ambiance.slice(0, 2).join(", ")}
                      {venue.ambiance.length > 2 &&
                        ` +${venue.ambiance.length - 2} more`}
                    </div>
                  )}
                  {venue.price_range && (
                    <div>
                      <span className="text-muted-foreground">Price:</span>{" "}
                      {venue.price_range}
                    </div>
                  )}
                  {venue.photos.length > 0 && (
                    <div>
                      <span className="text-muted-foreground">Photos:</span>{" "}
                      {venue.photos.length}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <VenueActions venue={venue} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default function AdminVenuesPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Pending Venues
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Review and moderate venue submissions. Approve quality venues or
            reject inappropriate content.
          </p>
        </CardContent>
      </Card>

      {/* Venues Table */}
      <Card>
        <CardContent className="p-0">
          <Suspense fallback={<VenuesTableSkeleton />}>
            <VenuesTable />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
