import { notFound } from "next/navigation";
import WatchClient from "@/components/WatchClient";
import { getContentDetails } from "@/services/content";

export const revalidate = 1800;

interface WatchPageProps {
  params: Promise<{ type: string; id: string }>;
}

export default async function WatchPage({ params }: WatchPageProps) {
  const { type, id } = await params;

  if (type !== "movie" && type !== "tv") {
    notFound();
  }

  const details = await getContentDetails(id, type);

  if (!details) {
    notFound();
  }

  return <WatchClient details={details} type={type} id={id} />;
}
