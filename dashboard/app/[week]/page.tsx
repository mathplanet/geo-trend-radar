import { notFound } from "next/navigation";
import DigestView from "@/components/DigestView";
import { getDigestByWeek } from "@/lib/queries";

export default async function WeekPage({
  params,
}: {
  params: Promise<{ week: string }>;
}) {
  const { week } = await params;
  const digest = await getDigestByWeek(week);

  if (!digest) {
    notFound();
  }

  return <DigestView digest={digest} />;
}
