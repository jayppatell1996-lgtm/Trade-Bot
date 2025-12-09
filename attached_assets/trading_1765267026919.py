import discord
from discord.ext import commands
from discord import app_commands
from utils.data_manager import DataManager
from typing import Optional
import logging
import asyncio

logger = logging.getLogger('discord')

logger.info("Trading cog initialized.")

class Trading(commands.Cog):
    def __init__(self, bot):
        self.bot = bot
        self.data_manager = DataManager()

    @app_commands.command(
        name="propose-trade",
        description="Trade multiple players between teams (up to 5 players per side)"
    )
    @app_commands.describe(
        target_team="Name of the team to trade with",
        offer_player_ids="Your players' IDs (comma-separated, max 5 players, e.g. 'id1,id2,id3')",
        request_player_ids="Players' IDs you want in return (comma-separated, max 5 players)"
    )
    async def propose_trade(
        self,
        interaction: discord.Interaction,
        target_team: str,
        offer_player_ids: str,
        request_player_ids: str
    ):
        try:
            # Defer response immediately to prevent timeout
            try:
                await interaction.response.defer()
            except discord.InteractionResponded:
                logger.warning("Interaction already responded to during defer in propose-trade")
                return

            try:
                async with asyncio.timeout(5.0):  # 5 second timeout for trade processing
                    # Split and clean player IDs, removing duplicates and empty strings
                    offer_ids = [pid.strip() for pid in offer_player_ids.split(',')]
                    request_ids = [pid.strip() for pid in request_player_ids.split(',')]
                    
                    # Enhanced ID validation
                    if any(not pid for pid in offer_ids) or any(not pid for pid in request_ids):
                        await interaction.followup.send(
                            "Invalid player ID format. Please use comma-separated IDs without empty values.",
                            ephemeral=True
                        )
                        return
                    
                    # Validate maximum number of players
                    max_players = 5
                    if len(offer_ids) > max_players or len(request_ids) > max_players:
                        await interaction.followup.send(
                            f"Cannot trade more than {max_players} players per team. Please reduce the number of players.",
                            ephemeral=True
                        )
                        return
                        
                    # Log trade attempt
                    logger.info(f"Trade proposed - From: {interaction.user.id}, Offering: {offer_ids}, Requesting: {request_ids}")
                        
                    # Remove duplicates while preserving order
                    offer_ids = list(dict.fromkeys(offer_ids))
                    request_ids = list(dict.fromkeys(request_ids))
                    
                    # Validate player lists
                    if not offer_ids:
                        await interaction.followup.send(
                            "You must specify at least one player to offer!",
                            ephemeral=True
                        )
                        return
                        
                    if not request_ids:
                        await interaction.followup.send(
                            "You must specify at least one player to request!",
                            ephemeral=True
                        )
                        return

                    # Check for duplicate IDs between offers and requests
                    if set(offer_ids) & set(request_ids):
                        await interaction.followup.send(
                            "Cannot trade the same player ID between teams!",
                            ephemeral=True
                        )
                        return

                    # Get teams and validate ownership
                    proposing_team = self.data_manager.get_team_by_owner(interaction.user.id)
                    target_team_data = self.data_manager.get_team_by_name(target_team)

                    # Validate team existence
                    if not proposing_team:
                        await interaction.followup.send(
                            "You don't own a team!",
                            ephemeral=True
                        )
                        return

                    if not target_team_data:
                        await interaction.followup.send(
                            "Target team not found!",
                            ephemeral=True
                        )
                        return

                    # Find all offered players
                    offer_players = []
                    for pid in offer_ids:
                        player = next((p for p in proposing_team['players'] if str(p['id']) == pid), None)
                        if not player:
                            await interaction.followup.send(
                                f"Player with ID {pid} not found in your team!",
                                ephemeral=True
                            )
                            return
                        offer_players.append(player)

                    # Find all requested players
                    request_players = []
                    for pid in request_ids:
                        player = next((p for p in target_team_data['players'] if str(p['id']) == pid), None)
                        if not player:
                            await interaction.followup.send(
                                f"Player with ID {pid} not found in target team!",
                                ephemeral=True
                            )
                            return
                        request_players.append(player)

                    # Check final roster sizes
                    proposing_team_final_size = len(proposing_team['players']) - len(offer_players) + len(request_players)
                    target_team_final_size = len(target_team_data['players']) - len(request_players) + len(offer_players)

                    if proposing_team_final_size > proposing_team['max_size']:
                        await interaction.followup.send(
                            f"Your team would exceed maximum roster size after trade "
                            f"(would have {proposing_team_final_size}/{proposing_team['max_size']} players)",
                            ephemeral=True
                        )
                        return

                    if target_team_final_size > target_team_data['max_size']:
                        await interaction.followup.send(
                            f"Target team would exceed maximum roster size after trade "
                            f"(would have {target_team_final_size}/{target_team_data['max_size']} players)",
                            ephemeral=True
                        )
                        return

                    # Execute trade immediately
                    success, message = self.data_manager.execute_propose_trade(
                        proposing_team['name'],
                        target_team_data['name'],
                        [p['id'] for p in offer_players],
                        [p['id'] for p in request_players]
                    )

                    if success:
                        # Create trade completion embed with enhanced multi-player format
                        embed = discord.Embed(
                            title="Multi-Player Trade Completed ✅",
                            description=(
                                f"Trade between **{proposing_team['name']}** and "
                                f"**{target_team_data['name']}** executed successfully!\n\n"
                                f"📊 Post-Trade Roster Status:\n"
                                f"• {proposing_team['name']}: {proposing_team_final_size}/{proposing_team['max_size']} players\n"
                                f"• {target_team_data['name']}: {target_team_final_size}/{target_team_data['max_size']} players"
                            ),
                            color=discord.Color.green()
                        )

                        # Enhanced multi-player trade display
                        offer_text = "\n".join([f"📤 {p['name']} (ID: {p['id']})" for p in offer_players])
                        embed.add_field(
                            name=f"{proposing_team['name']} Sent ({len(offer_players)} players)",
                            value=offer_text or "No players",
                            inline=False
                        )

                        request_text = "\n".join([f"📥 {p['name']} (ID: {p['id']})" for p in request_players])
                        embed.add_field(
                            name=f"{target_team_data['name']} Sent ({len(request_players)} players)",
                            value=request_text or "No players",
                            inline=False
                        )

                        await interaction.followup.send(embed=embed)
                        logger.info(
                            f"Trade completed - Details:\n"
                            f"Team1: {proposing_team['name']} (New size: {proposing_team_final_size})\n"
                            f"Offered: {', '.join(p['name'] for p in offer_players)}\n"
                            f"Team2: {target_team_data['name']} (New size: {target_team_final_size})\n"
                            f"Received: {', '.join(p['name'] for p in request_players)}"
                        )
                    else:
                        error_msg = f"Failed to execute trade: {message}"
                        await interaction.followup.send(error_msg, ephemeral=True)
                        logger.error(f"Trade execution failed:\n{error_msg}\nTeams: {proposing_team['name']} <-> {target_team_data['name']}")

            except asyncio.TimeoutError:
                logger.error("Timeout while processing trade")
                await interaction.followup.send(
                    "The trade process timed out. Please try again.",
                    ephemeral=True
                )
                return

        except Exception as e:
            error_msg = str(e)
            
            # Initialize variables for error logging
            proposing_team_name = "Unknown"
            target_team_name = target_team if isinstance(target_team, str) else "Unknown"
            
            # Try to get team information from the data manager
            try:
                proposing_team_data = self.data_manager.get_team_by_owner(interaction.user.id)
                if proposing_team_data and isinstance(proposing_team_data, dict):
                    proposing_team_name = proposing_team_data.get('name', 'Unknown')
            except Exception as name_error:
                logger.error(f"Error getting proposing team data: {str(name_error)}")
            
            logger.error(
                f"Error in propose_trade command:\n"
                f"Error message: {error_msg}\n"
                f"User ID: {interaction.user.id}\n"
                f"Teams involved: {proposing_team_name} <-> {target_team_name}\n"
                f"Offered IDs: {offer_player_ids if 'offer_player_ids' in locals() else 'Not provided'}\n"
                f"Requested IDs: {request_player_ids if 'request_player_ids' in locals() else 'Not provided'}"
            )
            
            try:
                if not interaction.response.is_done():
                    await interaction.response.send_message(
                        "An unexpected error occurred while processing your trade. "
                        "Please verify that:\n"
                        "1. All player IDs are valid\n"
                        "2. You own a team\n"
                        "3. The target team exists",
                        ephemeral=True
                    )
                else:
                    await interaction.followup.send(
                        "An unexpected error occurred while processing your trade. "
                        "Please verify that:\n"
                        "1. All player IDs are valid\n"
                        "2. You own a team\n"
                        "3. The target team exists",
                        ephemeral=True
                    )
            except (discord.InteractionResponded, discord.HTTPException) as send_error:
                logger.error(f"Failed to send error message: {str(send_error)}")

    @app_commands.command(name="trade-history", description="View trade history")
    @app_commands.describe(
        team_name="Filter trades by team name (optional)",
        limit="Number of trades to show (default: 10)"
    )
    async def trade_history(
        self,
        interaction: discord.Interaction,
        team_name: Optional[str] = None,
        limit: int = 10
    ):
        try:
            trades = self.data_manager.get_trade_history(team_name, max(1, limit))
            
            if not trades:
                await interaction.response.send_message("No trade history found!", ephemeral=True)
                return

            embed = discord.Embed(
                title="Trade History",
                description=f"Recent trades{' for ' + team_name if team_name else ''}",
                color=discord.Color.blue()
            )
            
            for trade in trades:
                trade_time = discord.utils.format_dt(discord.utils.parse_time(trade["timestamp"]), style='R')
                status_emoji = "✅"  # Completed trade indicator
                
                # Handle both single-player and multi-player trade formats
                # Enhanced multi-player trade format with better organization
                players1_text = "\n• ".join([f"{p['name']} (ID: {p['id']})" for p in trade.get('players1', [])])
                players2_text = "\n• ".join([f"{p['name']} (ID: {p['id']})" for p in trade.get('players2', [])])
                trade_desc = (
                    f"{status_emoji} Trade Summary:\n\n"
                    f"**{trade['team1']}** traded:\n• {players1_text}\n\n"
                    f"**{trade['team2']}** traded:\n• {players2_text}"
                )
                embed.add_field(name=f"Trade {trade_time}", value=trade_desc, inline=False)

            await interaction.response.send_message(embed=embed)
            logger.debug(f"Trade history displayed for {team_name if team_name else 'all teams'}")

        except Exception as e:
            logger.error(f"Error in trade_history: {str(e)}")
            await interaction.response.send_message("An error occurred while fetching trade history.", ephemeral=True)

async def setup(bot):
    try:
        await bot.add_cog(Trading(bot))
        logger.info("Trading cog loaded successfully")
    except Exception as e:
        logger.error(f"Error loading Trading cog: {str(e)}")
        raise
