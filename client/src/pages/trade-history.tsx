import { TRADE_HISTORY } from "@/lib/mockData";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Calendar } from "lucide-react";
import { format } from "date-fns";
import { Player } from "@/lib/types";

export default function TradeHistory() {
  const sortedTrades = [...TRADE_HISTORY].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Trade History</h1>
        <p className="text-muted-foreground">Official record of all completed transactions</p>
      </div>

      <div className="space-y-4">
        {sortedTrades.map((trade, index) => (
          <Card key={index} className="overflow-hidden bg-card/50 border-l-4 border-l-primary/50 hover:bg-card/80 transition-all">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span className="font-mono">{format(new Date(trade.timestamp), "PPP p")}</span>
                </div>
                <Badge variant="outline" className="font-mono text-xs">
                  ID: TRD-{index + 1000}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-7 gap-4 items-center">
                {/* Team 1 Side */}
                <div className="md:col-span-3 space-y-3">
                  <div className="flex items-center justify-between border-b border-border/50 pb-2">
                    <span className="font-bold text-lg text-primary">{trade.team1}</span>
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">Sending</span>
                  </div>
                  <div className="space-y-1">
                    {trade.players1.map((p: Player) => (
                      <div key={p.id} className="flex items-center justify-between text-sm bg-background/30 p-2 rounded">
                        <span>{p.name}</span>
                        <span className="font-mono text-xs text-muted-foreground">{p.id}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Arrow */}
                <div className="md:col-span-1 flex justify-center py-4 md:py-0">
                  <div className="bg-muted p-2 rounded-full">
                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>

                {/* Team 2 Side */}
                <div className="md:col-span-3 space-y-3">
                  <div className="flex items-center justify-between border-b border-border/50 pb-2">
                    <span className="font-bold text-lg text-blue-400">{trade.team2}</span>
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">Sending</span>
                  </div>
                  <div className="space-y-1">
                    {trade.players2.map((p: Player) => (
                      <div key={p.id} className="flex items-center justify-between text-sm bg-background/30 p-2 rounded">
                        <span>{p.name}</span>
                        <span className="font-mono text-xs text-muted-foreground">{p.id}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
