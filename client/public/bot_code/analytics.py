import discord
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
                value=f"```md\n{total_teams} Active\n```",
                inline=True
            )
            embed.add_field(
                name="Player Pool",
                value=f"```md\n{total_players} Total\n```",
                inline=True
            )
            embed.add_field(
                name="Avg Roster",
                value=f"```md\n{avg_roster_size} Players\n```",
                inline=True
            )

            # Trade Activity Section
            embed.add_field(
                name="🔄 Trade Market",
                value=(
                    f"• **Total Volume:** {total_trades} completed\n"
                    f"• **Recent Activity (7d):** {recent_volume} trades\n"
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
                top_teams_text += f"{i+1}. **{team['name']}** ({len(team['players'])}/{team['max_size']})\n`{progress_bar}`\n"

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
