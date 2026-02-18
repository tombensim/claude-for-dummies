import { redirect } from "next/navigation";

/**
 * Entry page — server-side redirect to setup.
 * Once the app is running, client-side navigation handles step routing.
 */
export default function EntryPage() {
  redirect("/setup");
}
