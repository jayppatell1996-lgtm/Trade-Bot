import { TEAMS_DATA } from "@/lib/mockData";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { ArrowRightLeft, AlertCircle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Player } from "@/lib/types";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export default function TradeSimulator() {
  const [team1Name, setTeam1Name] = useState<string>("");
  const [team2Name, setTeam2Name] = useState<string>("");
  
  const [team1SelectedPlayers, setTeam1SelectedPlayers] = useState<string[]>([]);
  const [team2SelectedPlayers, setTeam2SelectedPlayers] = useState<string[]>([]);

  const teams = Object.keys(TEAMS_DATA);

  const team1 = TEAMS_DATA[team1Name];
  const team2 = TEAMS_DATA[team2Name];

  const handleTogglePlayer = (playerId: string, isTeam1: boolean) => {
    if (isTeam1) {
      setTeam1SelectedPlayers(prev => 
        prev.includes(playerId) ? prev.filter(id => id !== playerId) : [...prev, playerId]
      );
    } else {
      setTeam2SelectedPlayers(prev => 
        prev.includes(playerId) ? prev.filter(id => id !== playerId) : [...prev, playerId]
      );
    }
  };

  const getTradeStatus = () => {
    if (!team1 || !team2) return null;
    if (team1SelectedPlayers.length === 0 && team2SelectedPlayers.length === 0) return null;

    const team1NewCount = team1.players.length - team1SelectedPlayers.length + team2SelectedPlayers.length;
    const team2NewCount = team2.players.length - team2SelectedPlayers.length + team1SelectedPlayers.length;

    const errors: string[] = [];
    if (team1NewCount > team1.max_size) errors.push(`${team1.name} will exceed max roster size (${team1NewCount}/${team1.max_size})`);
    if (team2NewCount > team2.max_size) errors.push(`${team2.name} will exceed max roster size (${team2NewCount}/${team2.max_size})`);
    if (team1SelectedPlayers.length > 5) errors.push(`${team1.name} cannot trade more than 5 players`);
    if (team2SelectedPlayers.length > 5) errors.push(`${team2.name} cannot trade more than 5 players`);

    if (errors.length > 0) return { type: 'error' as const, messages: errors };
    
    return { 
      type: 'success' as const, 
      message: 'Trade is valid!',
      details: `Trading ${team1SelectedPlayers.length} players from ${team1.name} for ${team2SelectedPlayers.length} players from ${team2.name}`
    };
  };

  const status = getTradeStatus();

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Trade Simulator</h1>
        <p className="text-muted-foreground">Propose and validate multi-player trades</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-11">
        {/* Team 1 Selection */}
        <Card className="lg:col-span-5 bg-card/50">
          <CardHeader>
            <Select onValueChange={(v) => { setTeam1Name(v); setTeam1SelectedPlayers([]); }}>
              <SelectTrigger>
                <SelectValue placeholder="Select Team 1" />
              </SelectTrigger>
              <SelectContent>
                {teams.filter(t => t !== team2Name).map(t => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            {team1 ? (
              <div className="space-y-4">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Roster: {team1.players.length}/{team1.max_size}</span>
                  <span>Selected: {team1SelectedPlayers.length}</span>
                </div>
                <div className="h-[400px] overflow-y-auto pr-2 space-y-2 border rounded-md p-2">
                  {team1.players.map((player: Player) => (
                    <div key={player.id} className="flex items-center space-x-3 p-2 hover:bg-muted/50 rounded transition-colors">
                      <Checkbox 
                        id={player.id} 
                        checked={team1SelectedPlayers.includes(player.id)}
                        onCheckedChange={() => handleTogglePlayer(player.id, true)}
                      />
                      <Label htmlFor={player.id} className="flex-1 cursor-pointer">
                        <div className="font-medium">{player.name}</div>
                        <div className="text-xs text-muted-foreground font-mono">{player.id}</div>
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                Select a team to view roster
              </div>
            )}
          </CardContent>
        </Card>

        {/* Middle Action Area */}
        <div className="lg:col-span-1 flex flex-col items-center justify-center gap-4">
          <div className="hidden lg:flex h-full w-[2px] bg-border/50" />
          <div className="bg-primary/10 p-4 rounded-full">
            <ArrowRightLeft className="h-6 w-6 text-primary" />
          </div>
          <div className="hidden lg:flex h-full w-[2px] bg-border/50" />
        </div>

        {/* Team 2 Selection */}
        <Card className="lg:col-span-5 bg-card/50">
          <CardHeader>
            <Select onValueChange={(v) => { setTeam2Name(v); setTeam2SelectedPlayers([]); }}>
              <SelectTrigger>
                <SelectValue placeholder="Select Team 2" />
              </SelectTrigger>
              <SelectContent>
                {teams.filter(t => t !== team1Name).map(t => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            {team2 ? (
              <div className="space-y-4">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Roster: {team2.players.length}/{team2.max_size}</span>
                  <span>Selected: {team2SelectedPlayers.length}</span>
                </div>
                <div className="h-[400px] overflow-y-auto pr-2 space-y-2 border rounded-md p-2">
                  {team2.players.map((player: Player) => (
                    <div key={player.id} className="flex items-center space-x-3 p-2 hover:bg-muted/50 rounded transition-colors">
                      <Checkbox 
                        id={player.id} 
                        checked={team2SelectedPlayers.includes(player.id)}
                        onCheckedChange={() => handleTogglePlayer(player.id, false)}
                      />
                      <Label htmlFor={player.id} className="flex-1 cursor-pointer">
                        <div className="font-medium">{player.name}</div>
                        <div className="text-xs text-muted-foreground font-mono">{player.id}</div>
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                Select a team to view roster
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Validation Status */}
      {status && (
        <Alert variant={status.type === 'error' ? "destructive" : "default"} className={status.type === 'success' ? "border-green-500/50 bg-green-500/10 text-green-500" : ""}>
          {status.type === 'error' ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
          <AlertTitle>{status.type === 'error' ? "Invalid Trade" : "Trade Validated"}</AlertTitle>
          <AlertDescription>
            {status.type === 'error' ? (
              <ul className="list-disc pl-4 mt-2">
                {status.messages?.map((m, i) => <li key={i}>{m}</li>)}
              </ul>
            ) : (
              <div className="flex flex-col gap-2 mt-2">
                <p>{status.details}</p>
                <Button className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white border-none mt-2">
                  Generate Discord Command
                </Button>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
