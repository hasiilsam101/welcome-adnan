import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { BookOpen, Search, Copy, Check, ExternalLink } from "lucide-react";
import { toast } from "sonner";

const knowledgeBaseItems = [
  {
    id: "1",
    category: "Order",
    question: "How do I track my order?",
    answer: "You can track your order by visiting our Track Order page and entering your order number. You'll receive tracking updates via email and SMS once your order is shipped.",
    keywords: ["track", "order", "shipping", "status", "delivery"],
  },
  {
    id: "2",
    category: "Payment",
    question: "What payment methods do you accept?",
    answer: "We accept bKash, Nagad, Rocket, bank transfers, and Cash on Delivery (COD). All online payments are secure and encrypted.",
    keywords: ["payment", "bkash", "nagad", "rocket", "cod", "bank"],
  },
  {
    id: "3",
    category: "Shipping",
    question: "How long does delivery take?",
    answer: "Delivery times vary by location. Inside Dhaka: 1-2 business days. Outside Dhaka: 3-5 business days. Express delivery options are available at checkout.",
    keywords: ["delivery", "shipping", "time", "days", "dhaka"],
  },
  {
    id: "4",
    category: "Return",
    question: "What is your return policy?",
    answer: "We offer a 7-day return policy for unused items in original packaging. Please visit our Returns & Exchange page for detailed instructions.",
    keywords: ["return", "refund", "exchange", "policy", "cancel"],
  },
  {
    id: "5",
    category: "Product",
    question: "How do I find my size?",
    answer: "Check our Size Guide page for detailed measurements. If you're between sizes, we recommend going up a size for a comfortable fit.",
    keywords: ["size", "guide", "measurement", "fit"],
  },
  {
    id: "6",
    category: "Order",
    question: "Can I cancel my order?",
    answer: "Orders can be cancelled within 2 hours of placement. After that, please wait for delivery and initiate a return if needed.",
    keywords: ["cancel", "order", "refund"],
  },
  {
    id: "7",
    category: "Shipping",
    question: "Do you offer international shipping?",
    answer: "Currently, we only ship within Bangladesh. We're working on expanding to international markets soon!",
    keywords: ["international", "shipping", "abroad", "outside"],
  },
  {
    id: "8",
    category: "Support",
    question: "How can I contact customer support?",
    answer: "You can reach us via email at hello@ektaclothing.com, call us at +880 1XXX-XXXXXX, or use the contact form on our Contact page.",
    keywords: ["contact", "support", "email", "phone", "help"],
  },
  {
    id: "9",
    category: "Product",
    question: "Are the product colors accurate?",
    answer: "We try our best to display accurate colors, but slight variations may occur due to screen settings. If you have any concerns, feel free to contact us before ordering.",
    keywords: ["color", "accurate", "difference", "variation"],
  },
  {
    id: "10",
    category: "General",
    question: "Do you have a physical store?",
    answer: "Yes! Visit us at 123 Fashion Street, Dhanmondi, Dhaka 1205. Our store is open Saturday to Thursday, 10AM - 8PM.",
    keywords: ["store", "physical", "location", "address", "visit"],
  },
];

interface KnowledgeBasePanelProps {
  onInsertAnswer?: (text: string) => void;
}

export function KnowledgeBasePanel({ onInsertAnswer }: KnowledgeBasePanelProps) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const categories = useMemo(
    () => [...new Set(knowledgeBaseItems.map((item) => item.category))],
    []
  );

  const filteredItems = useMemo(() => {
    return knowledgeBaseItems.filter((item) => {
      const matchesCategory = !selectedCategory || item.category === selectedCategory;
      if (!search) return matchesCategory;
      const query = search.toLowerCase();
      const matchesSearch =
        item.question.toLowerCase().includes(query) ||
        item.answer.toLowerCase().includes(query) ||
        item.keywords.some((kw) => kw.includes(query));
      return matchesSearch && matchesCategory;
    });
  }, [search, selectedCategory]);

  const handleCopy = (item: typeof knowledgeBaseItems[0]) => {
    navigator.clipboard.writeText(item.answer);
    setCopiedId(item.id);
    toast.success("Answer copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleInsert = (item: typeof knowledgeBaseItems[0]) => {
    if (onInsertAnswer) {
      onInsertAnswer(item.answer);
      toast.success("Answer inserted");
    }
  };

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search knowledge base..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-1">
        <Badge
          variant={selectedCategory === null ? "default" : "outline"}
          className="cursor-pointer"
          onClick={() => setSelectedCategory(null)}
        >
          All
        </Badge>
        {categories.map((cat) => (
          <Badge
            key={cat}
            variant={selectedCategory === cat ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setSelectedCategory(cat === selectedCategory ? null : cat)}
          >
            {cat}
          </Badge>
        ))}
      </div>

      {/* Results */}
      <ScrollArea className="h-[400px]">
        <div className="space-y-2 pr-2">
          {filteredItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No matching articles found</p>
            </div>
          ) : (
            filteredItems.map((item) => (
              <Card key={item.id} className="border">
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className="text-xs">
                          {item.category}
                        </Badge>
                      </div>
                      <h4 className="font-medium text-sm mb-1">{item.question}</h4>
                      <p className="text-xs text-muted-foreground line-clamp-3">
                        {item.answer}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleCopy(item)}
                        title="Copy answer"
                      >
                        {copiedId === item.id ? (
                          <Check className="h-3.5 w-3.5 text-green-600" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </Button>
                      {onInsertAnswer && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleInsert(item)}
                          title="Insert into reply"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

// Sheet version for use as a sidebar
interface KnowledgeBaseSheetProps {
  onInsertAnswer?: (text: string) => void;
  trigger?: React.ReactNode;
}

export function KnowledgeBaseSheet({ onInsertAnswer, trigger }: KnowledgeBaseSheetProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <BookOpen className="h-4 w-4" />
            Knowledge Base
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[450px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Knowledge Base
          </SheetTitle>
          <SheetDescription>
            Quick access to FAQ answers for customer support
          </SheetDescription>
        </SheetHeader>
        <div className="mt-4">
          <KnowledgeBasePanel onInsertAnswer={onInsertAnswer} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
