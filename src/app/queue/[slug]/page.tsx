import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { QueueDisplay } from "@/components/queue/queue-display";

interface QueuePageProps {
  params: Promise<{ slug: string }>;
}

export default async function QueuePage({ params }: QueuePageProps) {
  const { slug } = await params;

  // Find shop by slug
  const shop = await prisma.shop.findFirst({
    where: {
      slug,
      isActive: true,
    },
  });

  if (!shop) {
    notFound();
  }

  return <QueueDisplay shopId={shop.id} shopName={shop.name} />;
}