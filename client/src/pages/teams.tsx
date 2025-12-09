import { TEAMS_DATA } from "@/lib/mockData";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Player } from "@/lib/types";

export default function Teams() {
  const [searchTerm, setSearchTerm] = useState("");
  const teams = Object.values(TEAMS_DATA);

  const filteredTeams = teams.filter(team => 
    team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    team.players.some((p: Player) => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Rosters</h1>
          <p className="text-muted-foreground">Manage and view active rosters</p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search teams or players..."
            className="pl-8 bg-card/50"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredTeams.map((team) => (
          <Card key={team.name} className="flex flex-col bg-card/50 backdrop-blur hover:bg-card/80 transition-colors border-primary/20">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="font-mono text-xl text-primary">{team.name}</CardTitle>
                <Badge variant={team.players.length >= team.max_size ? "destructive" : "secondary"}>
                  {team.players.length} / {team.max_size}
                </Badge>
              </div>
              <CardDescription className="font-mono text-xs">
                Owner ID: {team.owner_id}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <ScrollArea className="h-[250px] pr-4">
                <div className="space-y-2">
                  {team.players.map((player: Player) => (
                    <div
                      key={player.id}
                      className="flex items-center justify-between rounded-md border border-border/50 bg-background/50 p-2 text-sm"
                    >
                      <span className="font-medium">{player.name}</span>
                      <span className="font-mono text-xs text-muted-foreground">{player.id}</span>
                    </div>
                  ))}
                  {team.players.length === 0 && (
                    <div className="text-center text-sm text-muted-foreground py-8">
                      No players drafted
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
