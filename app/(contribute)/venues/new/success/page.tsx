import { Suspense } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CheckCircle,
  Clock,
  Eye,
  MessageCircle,
  ArrowRight,
  Home,
  Search,
} from "lucide-react";

interface SuccessPageProps {
  searchParams: {
    venueId?: string;
  };
}

function SuccessContent({ venueId }: { venueId?: string }) {
  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <div className="text-center space-y-6">
        {/* Success Icon */}
        <div className="flex justify-center">
          <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
        </div>

        {/* Title and Message */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-green-800">
            Venue Submitted Successfully!
          </h1>
          <p className="text-lg text-muted-foreground">
            Thank you for contributing to our community
          </p>
        </div>

        {/* Venue ID */}
        {venueId && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              Submission ID:{" "}
              <code className="font-mono bg-white px-2 py-1 rounded">
                {venueId}
              </code>
            </p>
          </div>
        )}
      </div>

      {/* What Happens Next */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            What Happens Next?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                <Eye className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium">Review Process</h3>
                <p className="text-sm text-muted-foreground">
                  Our team will review your submission within 24-48 hours to
                  ensure accuracy and quality.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <h3 className="font-medium">Approval & Publication</h3>
                <p className="text-sm text-muted-foreground">
                  Once approved, your venue will appear in search results and be
                  visible to all users.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center shrink-0">
                <MessageCircle className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <h3 className="font-medium">Community Engagement</h3>
                <p className="text-sm text-muted-foreground">
                  Users can leave reviews and ratings once your venue is live.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Guidelines */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Review Guidelines</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              • <strong>Accuracy:</strong> We verify location details and basic
              information
            </p>
            <p>
              • <strong>Quality:</strong> Photos should be clear and represent
              the venue well
            </p>
            <p>
              • <strong>Completeness:</strong> All required fields should be
              properly filled
            </p>
            <p>
              • <strong>Uniqueness:</strong> We check that the venue isn't
              already listed
            </p>
            <p>
              • <strong>Guidelines:</strong> Content must follow our community
              standards
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="mt-8 space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <Button asChild variant="default" size="lg">
            <Link href="/">
              <Search className="mr-2 h-4 w-4" />
              Browse Venues
            </Link>
          </Button>

          <Button asChild variant="outline" size="lg">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>

        <div className="text-center">
          <Button asChild variant="ghost">
            <Link href="/venues/new">
              Submit Another Venue
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Footer Message */}
      <div className="mt-12 text-center">
        <div className="p-6 bg-blue-50 rounded-lg">
          <h3 className="font-medium text-blue-800 mb-2">
            🙏 Thank You for Contributing!
          </h3>
          <p className="text-blue-700 text-sm">
            Your submission helps fellow Piscola enthusiasts discover amazing
            venues. We'll notify you once your venue is approved and live.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function VenueSubmissionSuccess({
  searchParams,
}: SuccessPageProps) {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-12 max-w-2xl">
          <div className="text-center">
            <div className="h-20 w-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-12 w-12 text-gray-400" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Loading...</h1>
          </div>
        </div>
      }
    >
      <SuccessContent venueId={searchParams.venueId} />
    </Suspense>
  );
}
