import discord
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
    @app_commands.checks.cooldown(1, 30.0, key=lambda i: (i.guild_id, i.user.id))  # Rate limit: 1 use per 30 seconds per user per guild
    async def help(self, interaction: discord.Interaction):
        logger.debug(f"Help command invoked by user {interaction.user.id} in guild {interaction.guild_id}")
        
        # Defer response immediately to prevent timeout
        try:
            await interaction.response.defer()
        except discord.InteractionResponded:
            logger.warning("Interaction already responded to during defer")
            return

        try:
            # Check if we're in a guild and have a valid channel
            if not interaction.guild or not interaction.channel:
                try:
                    await interaction.followup.send(
                        "This command can only be used in a server channel.",
                        ephemeral=True
                    )
                except discord.HTTPException as e:
                    logger.error(f"Failed to send guild check message: {str(e)}")
                return

            # Get bot member object safely
            bot_member = interaction.guild.get_member(self.bot.user.id)
            if not bot_member:
                logger.error(f"Could not get bot member object in guild {interaction.guild_id}")
                await interaction.followup.send(
                    "An error occurred while checking permissions.",
                    ephemeral=True
                )
                return

            # Check permissions safely
            channel_perms = interaction.channel.permissions_for(bot_member)
            if not (channel_perms.send_messages and channel_perms.embed_links):
                logger.warning(f"Missing required permissions in channel {interaction.channel.id}")
                await interaction.followup.send(
                    "I need both 'Send Messages' and 'Embed Links' permissions to show the help menu.",
                    ephemeral=True
                )
                return

            # Create embed with timeout handling
            try:
                async with asyncio.timeout(5.0):  # 5 second timeout for embed creation
                    embed = discord.Embed(
                        title="Sports Team Manager Bot - Help",
                        description="Here are all available commands:",
                        color=discord.Color.blue()
                    )

                    # Team Management Commands
                    embed.add_field(
                        name="Team Management",
                        value="""
                        **/create-team** `team_name` `max_size` - Create a new team with specified maximum roster size (10-50 players)
                        **/add-player** `team_name` `player_name` `player_id` - Add a player to a team
                        **/remove-player** `team_name` `player_id` - Remove a player from your team
                        **/view-team** `[team_name]` - View team information and roster
                        **/list-players** `[team_name]` - List all players in a team
                        """,
                        inline=False
                    )

                    # Trading Commands
                    embed.add_field(
                        name="Trading System",
                        value="""
                        **/propose-trade** `target_team` `offer_player_ids` `request_player_ids` - Trade multiple players (up to 5 per team)
                        Example: /propose-trade TeamA "pid1,pid2" "pid3,pid4" - Trades 2 players from each team
                        **/trade-history** `[team_name]` `[limit]` - View detailed trade history with all players involved
                        """,
                        inline=False
                    )

                    embed.set_footer(text="Optional parameters are shown in [brackets] • Use commas to separate multiple IDs in trades")
                    logger.debug("Help embed created successfully")

                    try:
                        await interaction.followup.send(embed=embed)
                        logger.debug("Help command response sent successfully")
                    except discord.HTTPException as e:
                        logger.error(f"Failed to send help embed: {str(e)}")
                        await interaction.followup.send(
                            "An error occurred while displaying the help message. Please try again.",
                            ephemeral=True
                        )

            except asyncio.TimeoutError:
                logger.error("Timeout while creating help embed")
                await interaction.followup.send(
                    "The help command timed out. Please try again.",
                    ephemeral=True
                )
                return
            
            except Exception as e:
                logger.error(f"Unexpected error in help command: {str(e)}")
                try:
                    if not interaction.response.is_done():
                        await interaction.response.send_message(
                            "An unexpected error occurred. Please try again later.",
                            ephemeral=True
                        )
                    else:
                        await interaction.followup.send(
                            "An unexpected error occurred. Please try again later.",
                            ephemeral=True
                        )
                except (discord.InteractionResponded, discord.HTTPException) as send_error:
                    logger.error(f"Failed to send error message: {str(send_error)}")

        except Exception as e:
            logger.error(f"Global error in help command: {str(e)}")
            try:
                if not interaction.response.is_done():
                    await interaction.response.send_message(
                        "An unexpected error occurred. Please try again later.",
                        ephemeral=True
                    )
                else:
                    await interaction.followup.send(
                        "An unexpected error occurred. Please try again later.",
                        ephemeral=True
                    )
            except (discord.InteractionResponded, discord.HTTPException) as send_error:
                logger.error(f"Failed to send error message: {str(send_error)}")

    @help.error
    async def help_error(self, interaction: discord.Interaction, error: app_commands.AppCommandError):
        if isinstance(error, app_commands.CommandOnCooldown):
            await interaction.response.send_message(
                f"Please wait {error.retry_after:.1f}s before using this command again.",
                ephemeral=True
            )
        else:
            logger.error(f"Unhandled error in help command: {str(error)}")
            await interaction.response.send_message(
                "An error occurred while processing your request.",
                ephemeral=True
            )

async def setup(bot):
    try:
        logger.debug("Setting up Help cog...")
        await bot.add_cog(Help(bot))
        logger.info("Help cog setup complete")
    except Exception as e:
        logger.error(f"Error setting up Help cog: {str(e)}")
        raise
