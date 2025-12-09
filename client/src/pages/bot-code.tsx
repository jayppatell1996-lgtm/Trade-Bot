import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Copy, Check, Code, Terminal, Activity, Users, ArrowRightLeft } from "lucide-react";
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";

const ANALYTICS_COG = `import discord
from discord.ext import commands
from discord import app_commands
from utils.data_manager import DataManager
from typing import Optional
import logging
import asyncio
from datetime import datetime, timedelta

logger = logging.getLogger('discord')

class Analytics(commands.Cog):
    def __init__(self, bot):
        self.bot = bot
        self.data_manager = DataManager()

    @app_commands.command(
        name="league-stats",
        description="View league-wide statistics and analytics"
    )
    async def league_stats(self, interaction: discord.Interaction):
        """
        Displays a professional dashboard of league statistics.
        """
        try:
            await interaction.response.defer()

            data = self.data_manager._load_data()
            teams = list(data.values())
            history = self.data_manager._load_history().get("trades", [])

            total_teams = len(teams)
            total_players = sum(len(t['players']) for t in teams)
            total_trades = len(history)
            
            # Calculate averages
            avg_roster_size = round(total_players / total_teams) if total_teams > 0 else 0
            
            # Calculate recent activity (last 7 days)
            now = datetime.now()
            recent_trades = [
                t for t in history 
                if (now - datetime.fromisoformat(t['timestamp'])) < timedelta(days=7)
            ]
            recent_volume = len(recent_trades)

            embed = discord.Embed(
                title="📊 League Analytics Dashboard",
                description="Real-time overview of league performance",
                color=discord.Color.from_rgb(0, 255, 128)  # Neon Green
            )
            
            # Key Metrics Grid
            embed.add_field(
                name="Franchises",
                value=f"\`\`\`md\\n{total_teams} Active\\n\`\`\`",
                inline=True
            )
            embed.add_field(
                name="Player Pool",
                value=f"\`\`\`md\\n{total_players} Total\\n\`\`\`",
                inline=True
            )
            embed.add_field(
                name="Avg Roster",
                value=f"\`\`\`md\\n{avg_roster_size} Players\\n\`\`\`",
                inline=True
            )

            # Trade Activity Section
            embed.add_field(
                name="🔄 Trade Market",
                value=(
                    f"• **Total Volume:** {total_trades} completed\\n"
                    f"• **Recent Activity (7d):** {recent_volume} trades\\n"
                    f"• **Market Status:** {'🔥 Active' if recent_volume > 2 else '🧊 Quiet'}"
                ),
                inline=False
            )

            # Largest Rosters
            sorted_teams = sorted(teams, key=lambda x: len(x['players']), reverse=True)
            top_3_teams = sorted_teams[:3]
            
            top_teams_text = ""
            for i, team in enumerate(top_3_teams):
                bar_length = int((len(team['players']) / team['max_size']) * 10)
                progress_bar = "█" * bar_length + "░" * (10 - bar_length)
                top_teams_text += f"{i+1}. **{team['name']}** ({len(team['players'])}/{team['max_size']})\\n\`{progress_bar}\`\\n"

            if top_teams_text:
                embed.add_field(
                    name="📈 Largest Rosters",
                    value=top_teams_text,
                    inline=False
                )

            embed.set_footer(text=f"Generated at {datetime.now().strftime('%H:%M:%S')}")
            
            await interaction.followup.send(embed=embed)

        except Exception as e:
            logger.error(f"Error in league-stats: {str(e)}")
            await interaction.followup.send("An error occurred generating stats.", ephemeral=True)

async def setup(bot):
    await bot.add_cog(Analytics(bot))
`;

const TRADING_COG = `import discord
from discord.ext import commands
from discord import app_commands
from utils.data_manager import DataManager
from typing import Optional
import logging
import asyncio

logger = logging.getLogger('discord')

class Trading(commands.Cog):
    def __init__(self, bot):
        self.bot = bot
        self.data_manager = DataManager()

    @app_commands.command(
        name="propose-trade",
        description="Trade multiple players between teams (Smart Trade)"
    )
    @app_commands.describe(
        target_team="Name of the team to trade with",
        offer_player_ids="Your player IDs (comma-separated, e.g. 'p1,p2')",
        request_player_ids="Requested player IDs (comma-separated, e.g. 'p3,p4')"
    )
    async def propose_trade(
        self,
        interaction: discord.Interaction,
        target_team: str,
        offer_player_ids: str,
        request_player_ids: str
    ):
        try:
            await interaction.response.defer()

            # Parse IDs
            offer_ids = [pid.strip() for pid in offer_player_ids.split(',') if pid.strip()]
            request_ids = [pid.strip() for pid in request_player_ids.split(',') if pid.strip()]

            # Basic Validation
            if not offer_ids or not request_ids:
                await interaction.followup.send("❌ You must offer and request at least one player.", ephemeral=True)
                return
            
            if len(offer_ids) > 5 or len(request_ids) > 5:
                await interaction.followup.send("❌ Cannot trade more than 5 players per side.", ephemeral=True)
                return

            # Execute Trade Logic (Data Manager handles deep validation)
            proposing_team = self.data_manager.get_team_by_owner(interaction.user.id)
            if not proposing_team:
                await interaction.followup.send("❌ You don't own a team!", ephemeral=True)
                return
                
            target_team_data = self.data_manager.get_team_by_name(target_team)
            if not target_team_data:
                await interaction.followup.send(f"❌ Target team '{target_team}' not found!", ephemeral=True)
                return

            success, message = self.data_manager.execute_propose_trade(
                proposing_team['name'],
                target_team_data['name'],
                offer_ids,
                request_ids
            )

            if success:
                embed = discord.Embed(
                    title="✅ Trade Completed Successfully",
                    description=f"Transaction between **{proposing_team['name']}** and **{target_team_data['name']}**",
                    color=discord.Color.green()
                )
                
                embed.add_field(
                    name=f"📤 {proposing_team['name']} Sent",
                    value="\\n".join([f"• {pid}" for pid in offer_ids]),
                    inline=True
                )
                
                embed.add_field(
                    name=f"📥 {target_team_data['name']} Sent",
                    value="\\n".join([f"• {pid}" for pid in request_ids]),
                    inline=True
                )
                
                embed.set_footer(text="Rosters have been updated automatically.")
                await interaction.followup.send(embed=embed)
            else:
                await interaction.followup.send(f"❌ Trade Failed: {message}", ephemeral=True)

        except Exception as e:
            logger.error(f"Error in propose_trade: {str(e)}")
            await interaction.followup.send("An unexpected error occurred.", ephemeral=True)

    @app_commands.command(name="trade-history", description="View visual trade history")
    async def trade_history(self, interaction: discord.Interaction, limit: int = 5):
        try:
            trades = self.data_manager.get_trade_history(limit=limit)
            
            if not trades:
                await interaction.response.send_message("No trade history found.", ephemeral=True)
                return

            embed = discord.Embed(
                title="📜 League Trade History",
                color=discord.Color.blue()
            )

            for trade in reversed(trades):
                date_str = trade.get('timestamp', '').split('T')[0]
                
                # Format players
                p1_names = ", ".join([p['name'] for p in trade.get('players1', [])])
                p2_names = ", ".join([p['name'] for p in trade.get('players2', [])])
                
                embed.add_field(
                    name=f"{date_str} | {trade['team1']} ⇄ {trade['team2']}",
                    value=f"**{trade['team1']}** sent: {p1_names}\\n**{trade['team2']}** sent: {p2_names}",
                    inline=False
                )

            await interaction.response.send_message(embed=embed)

        except Exception as e:
            logger.error(f"Error in trade_history: {str(e)}")
            await interaction.response.send_message("Failed to load history.", ephemeral=True)

async def setup(bot):
    await bot.add_cog(Trading(bot))
`;

const MANAGEMENT_COG = `import discord
from discord.ext import commands
from discord import app_commands
from utils.data_manager import DataManager
import logging

logger = logging.getLogger('discord')

class TeamManagement(commands.Cog):
    def __init__(self, bot):
        self.bot = bot
        self.data_manager = DataManager()

    @app_commands.command(name="view-team", description="View team roster with visual progress")
    async def view_team(self, interaction: discord.Interaction, team_name: str = None):
        try:
            if not team_name:
                # Try to find user's team
                team = self.data_manager.get_team_by_owner(interaction.user.id)
            else:
                team = self.data_manager.get_team_by_name(team_name)

            if not team:
                await interaction.response.send_message("❌ Team not found.", ephemeral=True)
                return

            # Calculate progress bar
            current = len(team['players'])
            max_size = team['max_size']
            bar_len = 15
            filled = int((current / max_size) * bar_len)
            bar = "█" * filled + "░" * (bar_len - filled)

            embed = discord.Embed(
                title=f"🛡️ {team['name']} Roster",
                color=discord.Color.gold()
            )
            
            embed.add_field(
                name="Roster Capacity",
                value=f"\`{bar}\` {current}/{max_size}",
                inline=False
            )

            # List players
            if team['players']:
                player_list = ""
                for i, p in enumerate(team['players']):
                    player_list += f"**{i+1}.** {p['name']} (\`{p['id']}\`)\\n"
                
                # Chunk if too long
                if len(player_list) > 1000:
                    embed.add_field(name="Players (1-15)", value=player_list[:1000] + "...", inline=False)
                else:
                    embed.add_field(name="Active Roster", value=player_list, inline=False)
            else:
                embed.add_field(name="Active Roster", value="*No players signed*", inline=False)

            await interaction.response.send_message(embed=embed)

        except Exception as e:
            logger.error(f"Error in view-team: {str(e)}")
            await interaction.response.send_message("Error viewing team.", ephemeral=True)

async def setup(bot):
    await bot.add_cog(TeamManagement(bot))
`;

const MAIN_PY = `import discord
from discord.ext import commands
import os
import logging
from dotenv import load_dotenv

load_dotenv()

# Setup Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger('discord')

# Bot Setup
intents = discord.Intents.default()
intents.message_content = True
bot = commands.Bot(command_prefix='/', intents=intents)

async def load_extensions():
    # Load all our new cogs
    extensions = [
        'cogs.team_management',
        'cogs.trading',
        'cogs.analytics'
    ]
    for ext in extensions:
        try:
            await bot.load_extension(ext)
            logger.info(f"Loaded extension: {ext}")
        except Exception as e:
            logger.error(f"Failed to load {ext}: {e}")

@bot.event
async def on_ready():
    logger.info(f'Logged in as {bot.user} (ID: {bot.user.id})')
    await load_extensions()
    try:
        synced = await bot.tree.sync()
        logger.info(f"Synced {len(synced)} commands")
    except Exception as e:
        logger.error(f"Sync failed: {e}")

if __name__ == "__main__":
    token = os.getenv('DISCORD_TOKEN')
    if not token:
        logger.error("No DISCORD_TOKEN found in environment variables")
    else:
        bot.run(token)
`;

export default function BotCode() {
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const CodeBlock = ({ code, filename, id }: { code: string, filename: string, id: string }) => (
    <Card className="bg-card/50 backdrop-blur border-primary/20">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-sm font-mono">{filename}</CardTitle>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => handleCopy(code, id)}
          className="gap-2 hover:bg-primary/10 hover:text-primary"
        >
          {copied === id ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied === id ? "Copied" : "Copy"}
        </Button>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] w-full rounded-md border border-border/50 bg-black/40 p-4">
          <pre className="text-xs font-mono text-green-400/90 leading-relaxed">
            {code}
          </pre>
        </ScrollArea>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4">
        <Link href="/">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bot Source Code</h1>
          <p className="text-muted-foreground">Complete Python code for your Wispbyte server</p>
        </div>
      </div>

      <Tabs defaultValue="main" className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
          <TabsTrigger value="main" className="gap-2"><Code className="h-3 w-3" /> Main</TabsTrigger>
          <TabsTrigger value="trading" className="gap-2"><ArrowRightLeft className="h-3 w-3" /> Trading</TabsTrigger>
          <TabsTrigger value="management" className="gap-2"><Users className="h-3 w-3" /> Roster</TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2"><Activity className="h-3 w-3" /> Stats</TabsTrigger>
        </TabsList>
        
        <div className="mt-4">
          <TabsContent value="main">
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 text-sm text-blue-200">
                <strong>Main Entry Point:</strong> Save this as <code>main.py</code> in your root folder. It loads all the other modules automatically.
              </div>
              <CodeBlock code={MAIN_PY} filename="main.py" id="main" />
            </div>
          </TabsContent>

          <TabsContent value="trading">
             <div className="space-y-4">
              <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-sm text-green-200">
                <strong>Smart Trade Module:</strong> Save as <code>cogs/trading.py</code>. Includes enhanced validation and visual history.
              </div>
              <CodeBlock code={TRADING_COG} filename="cogs/trading.py" id="trading" />
            </div>
          </TabsContent>

          <TabsContent value="management">
             <div className="space-y-4">
              <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20 text-sm text-purple-200">
                <strong>Roster Management:</strong> Save as <code>cogs/team_management.py</code>. Features visual capacity bars.
              </div>
              <CodeBlock code={MANAGEMENT_COG} filename="cogs/team_management.py" id="management" />
            </div>
          </TabsContent>

          <TabsContent value="analytics">
             <div className="space-y-4">
              <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/20 text-sm text-orange-200">
                <strong>Analytics Module:</strong> Save as <code>cogs/analytics.py</code>. Powering the /league-stats command.
              </div>
              <CodeBlock code={ANALYTICS_COG} filename="cogs/analytics.py" id="analytics" />
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
