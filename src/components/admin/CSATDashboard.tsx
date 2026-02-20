import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, TrendingUp, MessageSquare, ThumbsUp } from "lucide-react";
import { useCSATRatings } from "@/hooks/useCSATRatings";
import { format } from "date-fns";

const starColors = [
  "text-red-500",
  "text-orange-500",
  "text-yellow-500",
  "text-lime-500",
  "text-emerald-500",
];

function RatingStars({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  const iconSize = size === "sm" ? "h-3 w-3" : "h-4 w-4";
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${iconSize} ${
            star <= rating ? `${starColors[rating - 1]} fill-current` : "text-muted-foreground/30"
          }`}
        />
      ))}
    </div>
  );
}

export function CSATDashboard() {
  const {
    ratings,
    isLoading,
    averageRating,
    ratingDistribution,
    satisfactionRate,
    totalRatings,
  } = useCSATRatings();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-yellow-100 dark:bg-yellow-900/30">
                <Star className="h-5 w-5 text-yellow-600 fill-yellow-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Avg Rating</p>
                <p className="text-2xl font-bold">{averageRating.toFixed(1)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                <ThumbsUp className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Satisfaction Rate</p>
                <p className="text-2xl font-bold">{satisfactionRate.toFixed(0)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30">
                <MessageSquare className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Ratings</p>
                <p className="text-2xl font-bold">{totalRatings}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">4-5 Stars</p>
                <p className="text-2xl font-bold">
                  {ratingDistribution[4] + ratingDistribution[5]}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Distribution */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Rating Distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = ratingDistribution[star as keyof typeof ratingDistribution];
              const percentage = totalRatings > 0 ? (count / totalRatings) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-16">
                    <span className="text-sm font-medium">{star}</span>
                    <Star className={`h-3 w-3 ${starColors[star - 1]} fill-current`} />
                  </div>
                  <Progress value={percentage} className="flex-1 h-2" />
                  <span className="text-sm text-muted-foreground w-12 text-right">
                    {count} ({percentage.toFixed(0)}%)
                  </span>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Recent Ratings */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Recent Ratings</CardTitle>
            <CardDescription>Latest feedback</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[200px]">
              {ratings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No ratings found
                </div>
              ) : (
                <div className="divide-y">
                  {ratings.slice(0, 10).map((rating) => (
                    <div key={rating.id} className="p-3 hover:bg-muted/50">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">
                          {rating.customer_name || rating.customer_email || "Unknown"}
                        </span>
                        <RatingStars rating={rating.rating} />
                      </div>
                      {rating.feedback && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {rating.feedback}
                        </p>
                      )}
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {format(new Date(rating.created_at), "dd MMM yyyy, hh:mm a")}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export { RatingStars };
