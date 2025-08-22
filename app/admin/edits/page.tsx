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
import { Edit, Clock, User, FileText } from "lucide-react";
import { getSuggestedEdits } from "@/lib/actions/admin";
import EditActions from "./EditActions";

// Loading component
function EditsTableSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-20 bg-gray-100 rounded animate-pulse" />
      ))}
    </div>
  );
}

async function EditsTable() {
  const { data: edits, error } = await getSuggestedEdits();

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Error loading suggested edits: {error}</p>
      </div>
    );
  }

  if (!edits || edits.length === 0) {
    return (
      <div className="text-center py-12">
        <Edit className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">No pending edits</h3>
        <p className="text-muted-foreground">
          No suggested edits waiting for review.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Venue</TableHead>
            <TableHead>Suggested By</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Changes</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {edits.map((edit) => (
            <TableRow key={edit.id}>
              <TableCell>
                <div>
                  <div className="font-medium">{edit.venue?.name || "Unknown Venue"}</div>
                  <div className="text-sm text-muted-foreground">
                    Edit ID: {edit.id.slice(0, 8)}...
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {edit.profile?.full_name || "Unknown User"}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div className="text-sm">
                    {new Date(edit.created_at).toLocaleDateString()}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="max-w-md">
                  <div className="mb-2">
                    <Badge variant="outline" className="mb-2">
                      <FileText className="mr-1 h-3 w-3" />
                      {Object.keys(edit.suggested_json).length} field(s)
                    </Badge>
                  </div>
                  <details className="text-sm">
                    <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                      View proposed changes
                    </summary>
                    <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                      <pre className="text-xs overflow-x-auto">
                        {JSON.stringify(edit.suggested_json, null, 2)}
                      </pre>
                    </div>
                  </details>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <EditActions edit={edit} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default function AdminEditsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Suggested Edits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Review and approve suggested edits from community members. Accept useful improvements or reject inappropriate changes.
          </p>
        </CardContent>
      </Card>

      {/* Edits Table */}
      <Card>
        <CardContent className="p-0">
          <Suspense fallback={<EditsTableSkeleton />}>
            <EditsTable />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
