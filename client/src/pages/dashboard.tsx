import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TEAMS_DATA, TRADE_HISTORY } from "@/lib/mockData";
import { Users, ArrowRightLeft, TrendingUp, Activity } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line
} from "recharts";

export default function Dashboard() {
  const totalTeams = Object.keys(TEAMS_DATA).length;
  const totalPlayers = Object.values(TEAMS_DATA).reduce((acc, team) => acc + team.players.length, 0);
  const totalTrades = TRADE_HISTORY.length;
  
  // Calculate average team size
  const avgTeamSize = Math.round(totalPlayers / totalTeams);

  // Prepare chart data: Players per team
  const rosterSizeData = Object.values(TEAMS_DATA).map(team => ({
    name: team.name,
    players: team.players.length,
    max: team.max_size
  }));

  // Prepare chart data: Activity over time (mock based on history)
  // Group trades by date (simple version)
  const activityData = TRADE_HISTORY.map((trade, i) => ({
    date: new Date(trade.timestamp).toLocaleDateString(),
    trades: i + 1 // Cumulative for demo
  })).slice(-10);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">League Overview</h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="inline-block h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          System Online
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-primary bg-card/50 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Teams</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{totalTeams}</div>
            <p className="text-xs text-muted-foreground">Active franchises</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 bg-card/50 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Players</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{totalPlayers}</div>
            <p className="text-xs text-muted-foreground">Across the league</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500 bg-card/50 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trade Volume</CardTitle>
            <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{totalTrades}</div>
            <p className="text-xs text-muted-foreground">Completed transactions</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 bg-card/50 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Roster</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{avgTeamSize}</div>
            <p className="text-xs text-muted-foreground">Players per team</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1 bg-card/50">
          <CardHeader>
            <CardTitle>Roster Utilization</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rosterSizeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <Tooltip 
                    cursor={{fill: 'hsl(var(--muted)/0.2)'}}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      borderColor: 'hsl(var(--border))',
                      color: 'hsl(var(--foreground))'
                    }}
                  />
                  <Bar 
                    dataKey="players" 
                    fill="hsl(var(--primary))" 
                    radius={[4, 4, 0, 0]} 
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1 bg-card/50">
          <CardHeader>
            <CardTitle>Trade Activity Trend</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
             <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={activityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <Tooltip 
                     contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      borderColor: 'hsl(var(--border))',
                      color: 'hsl(var(--foreground))'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="trades" 
                    stroke="hsl(var(--accent-foreground))" 
                    strokeWidth={2} 
                    dot={{ fill: 'hsl(var(--accent-foreground))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {TRADE_HISTORY.slice(-5).reverse().map((trade, i) => (
              <div key={i} className="flex items-center">
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none text-foreground">
                    <span className="text-primary font-mono">{trade.team1}</span>
                    <span className="mx-2 text-muted-foreground">⇄</span>
                    <span className="text-blue-400 font-mono">{trade.team2}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Exchanged {trade.players1.length + trade.players2.length} players • {new Date(trade.timestamp).toLocaleDateString()}
                  </p>
                </div>
                <div className="ml-auto font-medium text-xs text-muted-foreground font-mono">
                  COMPLETED
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
