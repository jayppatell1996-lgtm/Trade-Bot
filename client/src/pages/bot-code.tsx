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
        await self._handle_trade(interaction, target_team, offer_player_ids, request_player_ids)

    @commands.command(name="trade")
    async def trade_prefix(self, ctx, target_team: str, offer_player_ids: str, request_player_ids: str):
        """
        Text-based trade command for easy copy-pasting.
        Usage: !trade TeamB p1,p2 p3,p4
        """
        # Create a fake interaction-like object or handle logic directly
        # For simplicity, we'll just reuse the logic but we need to adapt the response method
        await self._handle_trade_text(ctx, target_team, offer_player_ids, request_player_ids)

    async def _handle_trade_text(self, ctx, target_team, offer_player_ids, request_player_ids):
        # Wrapper for text commands
        try:
            # Parse IDs
            offer_ids = [pid.strip() for pid in offer_player_ids.split(',') if pid.strip()]
            request_ids = [pid.strip() for pid in request_player_ids.split(',') if pid.strip()]

            # Basic Validation
            if not offer_ids or not request_ids:
                await ctx.send("❌ You must offer and request at least one player.")
                return
            
            if len(offer_ids) > 5 or len(request_ids) > 5:
                await ctx.send("❌ Cannot trade more than 5 players per side.")
                return

            # Execute Trade Logic
            proposing_team = self.data_manager.get_team_by_owner(ctx.author.id)
            if not proposing_team:
                await ctx.send("❌ You don't own a team!")
                return
                
            target_team_data = self.data_manager.get_team_by_name(target_team)
            if not target_team_data:
                await ctx.send(f"❌ Target team '{target_team}' not found!")
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
                await ctx.send(embed=embed)
            else:
                await ctx.send(f"❌ Trade Failed: {message}")

        except Exception as e:
            logger.error(f"Error in trade_prefix: {str(e)}")
            await ctx.send("An unexpected error occurred.")

    async def _handle_trade(
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

const HELP_COG = `import discord
from discord.ext import commands
from discord import app_commands
import logging
import asyncio

logger = logging.getLogger('discord')

class Help(commands.Cog):
    def __init__(self, bot):
        self.bot = bot

    @app_commands.command(
        name="help",
        description="Show all available commands organized by category"
    )
    async def help(self, interaction: discord.Interaction):
        try:
            await interaction.response.defer()
            
            embed = discord.Embed(
                title="📚 League Manager Bot Help",
                description="Here are all available commands:",
                color=discord.Color.blue()
            )

            # Roster Management
            embed.add_field(
                name="🛡️ Roster Management",
                value="""
                \`/view-team [team_name]\` - View roster capacity and player list.
                \`/list-players [team_name]\` - List all players in a team.
                \`/create-team [name] [max_size]\` - Create a new franchise.
                \`/add-player [team] [name] [id]\` - Add a player to a roster.
                \`/remove-player [team] [id]\` - Remove a player from a roster.
                """,
                inline=False
            )

            # Trading System
            embed.add_field(
                name="🔄 Smart Trading",
                value="""
                \`/propose-trade [target] [offer_ids] [request_ids]\`
                Trade players between teams. Supports multiple players (comma-separated).
                Example: \`/propose-trade TeamB p1,p2 p3,p4\`
                
                \`/trade-history [limit]\`
                View a visual timeline of recent league transactions.
                """,
                inline=False
            )

            # Analytics
            embed.add_field(
                name="📊 Analytics",
                value="""
                \`/league-stats\`
                View real-time league statistics, trade volume, and top rosters.
                """,
                inline=False
            )

            embed.set_footer(text="Bot developed for Wispbyte Server")
            await interaction.followup.send(embed=embed)

        except Exception as e:
            logger.error(f"Error in help command: {str(e)}")
            await interaction.followup.send("An error occurred displaying help.", ephemeral=True)

async def setup(bot):
    await bot.add_cog(Help(bot))
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
        'cogs.analytics',
        'cogs.help'
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

const DATA_MANAGER_PY = `import json
import os
from datetime import datetime
from utils.validators import validate_roster_size

class DataManager:
    def __init__(self):
        self.data_file = 'data/teams.json'
        self.history_file = 'data/trade_history.json'

    def _load_data(self):
        if not os.path.exists(self.data_file):
            return {}
        with open(self.data_file, 'r') as f:
            return json.load(f)

    def _save_data(self, data):
        with open(self.data_file, 'w') as f:
            json.dump(data, f, indent=4)

    def _load_history(self):
        if not os.path.exists(self.history_file):
            return {"trades": []}
        with open(self.history_file, 'r') as f:
            return json.load(f)

    def _save_history(self, history):
        with open(self.history_file, 'w') as f:
            json.dump(history, f, indent=4)

    def create_team(self, team_data):
        data = self._load_data()
        if team_data['name'] in data:
            return False
        data[team_data['name']] = team_data
        self._save_data(data)
        return True

    def get_team_by_name(self, team_name):
        data = self._load_data()
        return data.get(team_name)

    def get_team_by_owner(self, owner_id):
        data = self._load_data()
        for team in data.values():
            if team['owner_id'] == owner_id:
                return team
        return None

    def add_player_to_team(self, team_name, player):
        data = self._load_data()
        if team_name not in data:
            return False
        # Ensure player ID is stored as string
        player['id'] = str(player['id'])
        data[team_name]['players'].append(player)
        self._save_data(data)
        return True

    def save_team(self, team):
        """Save updated team data."""
        data = self._load_data()
        data[team['name']] = team
        self._save_data(data)
        return True

    def execute_propose_trade(self, team1_name, team2_name, players1_ids, players2_ids):
        """Execute a trade involving multiple players between two teams."""
        data = self._load_data()
        
        # Validate team existence
        if team1_name not in data or team2_name not in data:
            return False, "One or both teams not found"

        team1 = data[team1_name]
        team2 = data[team2_name]

        # Validate that lists are not empty and within reasonable limits
        if not players1_ids or not players2_ids:
            return False, "Both teams must offer at least one player"
            
        max_players_per_trade = 5  # Limit number of players per side in a trade
        if len(players1_ids) > max_players_per_trade or len(players2_ids) > max_players_per_trade:
            return False, f"Maximum {max_players_per_trade} players allowed per team in a trade"

        # Convert all IDs to strings and remove duplicates
        players1_ids = list(set(str(pid) for pid in players1_ids))
        players2_ids = list(set(str(pid) for pid in players2_ids))

        # Check for duplicate players between teams
        if set(players1_ids) & set(players2_ids):
            return False, "Cannot trade the same player ID between teams"

        # Find all players in team1 to be traded
        players1 = []
        for pid in players1_ids:
            player = next((p for p in team1['players'] if str(p['id']) == pid), None)
            if not player:
                return False, f"Player with ID {pid} not found in {team1_name}"
            players1.append(player)

        # Find all players in team2 to be traded
        players2 = []
        for pid in players2_ids:
            player = next((p for p in team2['players'] if str(p['id']) == pid), None)
            if not player:
                return False, f"Player with ID {pid} not found in {team2_name}"
            players2.append(player)

        # Check if teams would exceed max_size after trade
        team1_final_size = len(team1['players']) - len(players1) + len(players2)
        team2_final_size = len(team2['players']) - len(players2) + len(players1)

        if team1_final_size > team1['max_size']:
            return False, f"{team1_name} would exceed maximum roster size (would have {team1_final_size}/{team1['max_size']} players)"
        if team2_final_size > team2['max_size']:
            return False, f"{team2_name} would exceed maximum roster size (would have {team2_final_size}/{team2['max_size']} players)"

        # Remove players from their original teams
        for player in players1:
            team1['players'].remove(player)
        for player in players2:
            team2['players'].remove(player)

        # Add players to their new teams
        team1['players'].extend(players2)
        team2['players'].extend(players1)

        # Record trade in history
        history = self._load_history()
        trade_record = {
            "timestamp": datetime.now().isoformat(),
            "team1": team1_name,
            "team2": team2_name,
            "players1": [{"id": p['id'], "name": p['name']} for p in players1],
            "players2": [{"id": p['id'], "name": p['name']} for p in players2]
        }
        history["trades"].append(trade_record)

        self._save_data(data)
        self._save_history(history)
        return True, "Trade executed successfully"

    def get_trade_history(self, team_name=None, limit=10):
        history = self._load_history()
        trades = history["trades"]
        
        if team_name:
            trades = [trade for trade in trades if team_name in [trade["team1"], trade["team2"]]]
        
        return trades[-limit:]
`;

const ENV_FILE = `# Discord Bot Token
# Get this from https://discord.com/developers/applications
DISCORD_TOKEN=your_token_here

# Optional: Other configuration
LOG_LEVEL=INFO
COMMAND_PREFIX=/`;

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
          <TabsTrigger value="help" className="gap-2"><Check className="h-3 w-3" /> Help</TabsTrigger>
          <TabsTrigger value="env" className="gap-2"><Terminal className="h-3 w-3" /> Env Config</TabsTrigger>
          <TabsTrigger value="utils" className="gap-2"><Code className="h-3 w-3" /> Utils</TabsTrigger>
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

          <TabsContent value="help">
             <div className="space-y-4">
              <div className="p-4 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-sm text-cyan-200">
                <strong>Help Module:</strong> Save as <code>cogs/help.py</code>. Lists all commands and usage examples.
              </div>
              <CodeBlock code={HELP_COG} filename="cogs/help.py" id="help" />
            </div>
          </TabsContent>

          <TabsContent value="env">
             <div className="space-y-4">
              <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-200">
                <strong>Configuration:</strong> You must create a file named <code>.env</code> in your server root or add these variables in your Pterodactyl "Variables" tab.
              </div>
              <CodeBlock code={ENV_FILE} filename=".env" id="env" />
            </div>
          </TabsContent>

          <TabsContent value="utils">
             <div className="space-y-4">
              <div className="p-4 rounded-lg bg-gray-500/10 border border-gray-500/20 text-sm text-gray-200">
                <strong>Data Manager:</strong> This handles the core logic, including roster limit checks and ownership validation. Save as <code>utils/data_manager.py</code>.
              </div>
              <CodeBlock code={DATA_MANAGER_PY} filename="utils/data_manager.py" id="datamanager" />
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
