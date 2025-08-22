import { redirect } from "next/navigation";

// Admin index page - redirect to venues by default
export default function AdminPage() {
  redirect("/admin/venues");
}
