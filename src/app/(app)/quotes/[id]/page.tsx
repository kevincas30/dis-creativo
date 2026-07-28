import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import { serializeQuote } from "@/lib/quote-presenter";
import QuoteWorkspace from "@/components/quotes/QuoteWorkspace";

export default async function QuotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();

  const quote = await prisma.quote.findUnique({
    where: { id },
    include: {
      client: true,
      lineItems: { orderBy: { sortOrder: "asc" } },
      messages: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!quote || quote.userId !== user.id) {
    notFound();
  }

  const initialMessages = quote.messages.map((message) => ({
    role: (message.role === "assistant" ? "assistant" : "user") as "user" | "assistant",
    content: message.content,
  }));

  return (
    <QuoteWorkspace
      quoteId={quote.id}
      initialMessages={initialMessages}
      initialQuote={serializeQuote(quote)}
      isNew={initialMessages.length === 0}
    />
  );
}
