"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, Image as ImageIcon, Trash2, Eye } from "lucide-react";
import {
  uploadPhoto,
  getPublicUrl,
  deletePhoto,
  listVenuePhotos,
} from "@/lib/storage-client";

export default function StorageTestPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [venueId, setVenueId] = useState("test-venue-123");
  const [uploadResult, setUploadResult] = useState<{
    path: string;
    fullPath: string;
    publicUrl: string;
  } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [photos, setPhotos] = useState<
    Array<{ path: string; publicUrl: string; name: string }>
  >([]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadResult(null);
      setUploadError(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setUploadError(null);
    setUploadResult(null);

    try {
      const result = await uploadPhoto(selectedFile, venueId);

      if (result.error) {
        setUploadError(result.error.message);
      } else {
        setUploadResult(result.data);
        // Refresh photo list
        await loadPhotos();
      }
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const loadPhotos = async () => {
    try {
      const result = await listVenuePhotos(venueId);
      if (result.data) {
        setPhotos(result.data);
      }
    } catch (error) {
      console.error("Error loading photos:", error);
    }
  };

  const handleDelete = async (path: string) => {
    try {
      const result = await deletePhoto(path);
      if (result.success) {
        await loadPhotos(); // Refresh list
      } else {
        console.error("Delete failed:", result.error);
      }
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  const testPublicUrl = () => {
    const testPath = "user-123/venue-456/test-photo.jpg";
    const url = getPublicUrl(testPath);
    alert(`Public URL for "${testPath}":\n\n${url}`);
  };

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">🧪 Storage System Test</h1>
        <p className="text-muted-foreground">
          Test the complete Supabase Storage setup for venue photos
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Upload Test */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Test
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Venue ID:</label>
              <Input
                value={venueId}
                onChange={(e) => setVenueId(e.target.value)}
                placeholder="test-venue-123"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Select Photo:</label>
              <Input type="file" accept="image/*" onChange={handleFileSelect} />
            </div>

            {selectedFile && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm">
                  <strong>File:</strong> {selectedFile.name}
                </p>
                <p className="text-sm">
                  <strong>Size:</strong> {(selectedFile.size / 1024).toFixed(1)}{" "}
                  KB
                </p>
                <p className="text-sm">
                  <strong>Type:</strong> {selectedFile.type}
                </p>
              </div>
            )}

            <Button
              onClick={handleUpload}
              disabled={!selectedFile || loading}
              className="w-full"
            >
              {loading ? "Uploading..." : "Upload Photo"}
            </Button>

            {uploadError && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-600 dark:text-red-400 text-sm font-medium">
                  Upload Failed:
                </p>
                <p className="text-red-600 dark:text-red-400 text-sm">
                  {uploadError}
                </p>
              </div>
            )}

            {uploadResult && (
              <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-green-600 dark:text-green-400 text-sm font-medium">
                  Upload Successful!
                </p>
                <p className="text-green-600 dark:text-green-400 text-sm break-all">
                  <strong>Path:</strong> {uploadResult.path}
                </p>
                <p className="text-green-600 dark:text-green-400 text-sm break-all">
                  <strong>URL:</strong> {uploadResult.publicUrl}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* URL Test */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              URL Test
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Test the getPublicUrl function with a sample path
            </p>

            <Button
              onClick={testPublicUrl}
              variant="outline"
              className="w-full"
            >
              Test Public URL Generation
            </Button>

            <Button onClick={loadPhotos} variant="outline" className="w-full">
              Load Photos for Venue
            </Button>

            {photos.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  Photos for venue &quot;{venueId}&quot;:
                </p>
                {photos.map((photo, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-muted rounded"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {photo.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {photo.path}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(photo.publicUrl, "_blank")}
                      >
                        <ImageIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(photo.path)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* System Status */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>🔍 System Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <span>Supabase URL:</span>
              <Badge
                variant={
                  process.env.NEXT_PUBLIC_SUPABASE_URL
                    ? "default"
                    : "destructive"
                }
              >
                {process.env.NEXT_PUBLIC_SUPABASE_URL
                  ? "Configured"
                  : "Missing"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Supabase Key:</span>
              <Badge
                variant={
                  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
                    ? "default"
                    : "destructive"
                }
              >
                {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
                  ? "Configured"
                  : "Missing"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Storage Module:</span>
              <Badge variant="default">Loaded</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
