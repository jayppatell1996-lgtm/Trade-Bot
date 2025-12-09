import discord
from discord.ext import commands
from discord import app_commands
from utils.data_manager import DataManager
from utils.validators import validate_team_name, validate_roster_size
from typing import Optional
import logging
import asyncio

logger = logging.getLogger('discord')

class TeamManagement(commands.Cog):
    def __init__(self, bot):
        self.bot = bot
        self.data_manager = DataManager()

    @app_commands.command(name="create-team", description="Create a new team")
    @app_commands.describe(
        team_name="Name of the team",
        max_size="Maximum number of players allowed in the team (10-50)"
    )
    async def create_team(
        self, 
        interaction: discord.Interaction,
        team_name: str,
        max_size: int = 23
    ):
        try:
            # Defer response immediately to prevent timeout
            try:
                await interaction.response.defer()
            except discord.InteractionResponded:
                logger.warning("Interaction already responded to during defer in create-team")
                return

            try:
                async with asyncio.timeout(5.0):  # 5 second timeout for team creation
                    if not validate_team_name(team_name):
                        await interaction.followup.send("Invalid team name. Must be 2-32 characters.", ephemeral=True)
                        return

                    if not 10 <= max_size <= 50:
                        await interaction.followup.send("Team size must be between 10 and 50 players.", ephemeral=True)
                        return

                    team_data = {
                        "name": team_name,
                        "owner_id": interaction.user.id,
                        "players": [],
                        "max_size": max_size
                    }

                    success = self.data_manager.create_team(team_data)
                    if success:
                        embed = discord.Embed(
                            title="Team Created Successfully ✅",
                            description=f"Team '{team_name}' has been created!",
                            color=discord.Color.green()
                        )
                        embed.add_field(name="Maximum Players", value=str(max_size))
                        embed.add_field(name="Current Players", value="0")
                        await interaction.followup.send(embed=embed)
                    else:
                        await interaction.followup.send("Team already exists or creation failed.", ephemeral=True)

            except asyncio.TimeoutError:
                logger.error("Timeout while creating team")
                await interaction.followup.send(
                    "The team creation process timed out. Please try again.",
                    ephemeral=True
                )
                return

        except Exception as e:
            logger.error(f"Error in create-team command: {str(e)}")
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

    @app_commands.command(name="add-player", description="Add a player to a team")
    @app_commands.describe(
        team_name="Name of the team to add the player to",
        player_name="Player's full name",
        player_id="Player's ID (string)"
    )
    async def add_player(
        self,
        interaction: discord.Interaction,
        team_name: str,
        player_name: str,
        player_id: str
    ):
        try:
            # Defer response immediately to prevent timeout
            try:
                await interaction.response.defer()
            except discord.InteractionResponded:
                logger.warning("Interaction already responded to during defer in add-player")
                return

            try:
                async with asyncio.timeout(5.0):  # 5 second timeout for player addition
                    team = self.data_manager.get_team_by_name(team_name)
                    if not team:
                        await interaction.followup.send("Team not found!", ephemeral=True)
                        return

                    # Verify team ownership
                    if team['owner_id'] != interaction.user.id:
                        await interaction.followup.send("You can only add players to your own team!", ephemeral=True)
                        return

                    if not validate_roster_size(team):
                        await interaction.followup.send(
                            f"Maximum roster size reached ({team['max_size']} players).",
                            ephemeral=True
                        )
                        return

                    # Check if player_id is already in use
                    if any(p['id'] == player_id for p in team['players']):
                        await interaction.followup.send("A player with this ID already exists.", ephemeral=True)
                        return

                    player = {
                        "name": player_name,
                        "id": player_id
                    }

                    success = self.data_manager.add_player_to_team(team["name"], player)
                    if success:
                        embed = discord.Embed(
                            title="Player Added Successfully ✅",
                            description=f"Added {player_name} to {team_name}!",
                            color=discord.Color.green()
                        )
                        embed.add_field(name="Player ID", value=player_id)
                        embed.add_field(name="Team Size", value=f"{len(team['players']) + 1}/{team['max_size']}")
                        await interaction.followup.send(embed=embed)
                    else:
                        await interaction.followup.send("Failed to add player.", ephemeral=True)

            except asyncio.TimeoutError:
                logger.error("Timeout while adding player")
                await interaction.followup.send(
                    "The player addition process timed out. Please try again.",
                    ephemeral=True
                )
                return

        except Exception as e:
            logger.error(f"Error in add-player command: {str(e)}")
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

    @app_commands.command(name="view-team", description="View team information")
    @app_commands.describe(team_name="Enter team name (optional)")
    async def view_team(
        self,
        interaction: discord.Interaction,
        team_name: Optional[str] = None
    ):
        try:
            # Defer response immediately to prevent timeout
            try:
                await interaction.response.defer()
            except discord.InteractionResponded:
                logger.warning("Interaction already responded to during defer in view-team")
                return

            try:
                async with asyncio.timeout(5.0):  # 5 second timeout for team view
                    if team_name:
                        team = self.data_manager.get_team_by_name(team_name)
                    else:
                        team = self.data_manager.get_team_by_owner(interaction.user.id)

                    if not team:
                        await interaction.followup.send("Team not found!", ephemeral=True)
                        return

                    embed = discord.Embed(
                        title=f"Team: {team['name']} 📋",
                        color=discord.Color.blue()
                    )
                    embed.add_field(
                        name="Owner",
                        value=f"<@{team['owner_id']}>",
                        inline=False
                    )
                    embed.add_field(
                        name="Roster Size",
                        value=f"{len(team['players'])}/{team['max_size']} players",
                        inline=True
                    )

                    if team['players']:
                        # Create a clean player list format
                        players_list = []
                        for i, player in enumerate(team['players'], 1):
                            players_list.append(f"{i}. {player['name']} (ID: {player['id']})")
                        
                        # Split players into chunks if needed
                        chunk_size = 10  # Number of players per field
                        for i in range(0, len(players_list), chunk_size):
                            chunk = players_list[i:i + chunk_size]
                            embed.add_field(
                                name=f"Players {i+1}-{min(i+chunk_size, len(players_list))}",
                                value="\n".join(chunk),
                                inline=False
                            )
                    else:
                        embed.add_field(
                            name="Players",
                            value="No players on the roster",
                            inline=False
                        )

                    await interaction.followup.send(embed=embed)

            except asyncio.TimeoutError:
                logger.error("Timeout while viewing team")
                await interaction.followup.send(
                    "The team view process timed out. Please try again.",
                    ephemeral=True
                )
                return

        except Exception as e:
            logger.error(f"Error in view-team command: {str(e)}")
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

    @app_commands.command(
        name="remove-player",
        description="Remove a player from your team's roster"
    )
    @app_commands.describe(
        team_name="The name of the team you own",
        player_id="The unique ID of the player to remove (e.g., 'player123')"
    )
    async def remove_player(
        self,
        interaction: discord.Interaction,
        team_name: str,
        player_id: str
    ):
        """
        Remove a player from your team's roster. You must be the team owner to use this command.
        
        Parameters:
        -----------
        team_name: str
            The name of the team you own
        player_id: str
            The unique ID of the player to remove
        """
        try:
            # Defer response immediately to prevent timeout
            try:
                await interaction.response.defer()
            except discord.InteractionResponded:
                logger.warning("Interaction already responded to during defer in remove-player")
                return

            try:
                async with asyncio.timeout(5.0):  # 5 second timeout for player removal
                    logger.info(f"Remove player request - User: {interaction.user.id}, Team: {team_name}, Player ID: {player_id}")
                    
                    # Get team and verify ownership
                    team = self.data_manager.get_team_by_name(team_name)
                    if not team:
                        logger.warning(f"Team not found: {team_name}")
                        await interaction.followup.send(
                            "❌ Team not found! Please check the team name and try again.",
                            ephemeral=True
                        )
                        return

                    if team['owner_id'] != interaction.user.id:
                        logger.warning(f"Unauthorized remove attempt - User: {interaction.user.id}, Team: {team_name}")
                        await interaction.followup.send(
                            "❌ You must be the team owner to remove players!",
                            ephemeral=True
                        )
                        return

                    # Find player in team
                    player = next((p for p in team['players'] if str(p['id']) == player_id), None)
                    if not player:
                        logger.warning(f"Player not found - Team: {team_name}, Player ID: {player_id}")
                        await interaction.followup.send(
                            f"❌ Player with ID '{player_id}' not found in your team!",
                            ephemeral=True
                        )
                        return

                    # Remove player from team
                    team['players'].remove(player)
                    self.data_manager.save_team(team)
                    logger.info(f"Player removed successfully - Team: {team_name}, Player: {player['name']} (ID: {player_id})")

                    # Create success embed
                    embed = discord.Embed(
                        title="Player Removed ✅",
                        description=f"Successfully removed player from {team_name}",
                        color=discord.Color.green()
                    )
                    embed.add_field(
                        name="Player Details",
                        value=f"👤 Name: {player['name']}\n🆔 ID: {player['id']}"
                    )
                    embed.add_field(
                        name="Team Status",
                        value=f"📊 Roster Size: {len(team['players'])}/{team['max_size']}"
                    )
                    embed.set_footer(text="Use /view-team to see your updated roster")

                    await interaction.followup.send(embed=embed)

            except asyncio.TimeoutError:
                logger.error("Timeout while removing player")
                await interaction.followup.send(
                    "The player removal process timed out. Please try again.",
                    ephemeral=True
                )
                return

        except Exception as e:
            logger.error(f"Error in remove_player: {str(e)}", exc_info=True)
            try:
                if not interaction.response.is_done():
                    await interaction.response.send_message(
                        "❌ An unexpected error occurred. Please try again later.",
                        ephemeral=True
                    )
                else:
                    await interaction.followup.send(
                        "❌ An unexpected error occurred. Please try again later.",
                        ephemeral=True
                    )
            except (discord.InteractionResponded, discord.HTTPException) as send_error:
                logger.error(f"Failed to send error message: {str(send_error)}")


    @app_commands.command(name="list-players", description="List all players in a team")
    @app_commands.describe(team_name="Enter the team name (optional)")
    async def list_players(
        self,
        interaction: discord.Interaction,
        team_name: Optional[str] = None
    ):
        try:
            # Defer response immediately to prevent timeout
            try:
                await interaction.response.defer()
            except discord.InteractionResponded:
                logger.warning("Interaction already responded to during defer in list-players")
                return

            try:
                async with asyncio.timeout(5.0):  # 5 second timeout for listing players
                    team = None

                    if team_name:
                        team = self.data_manager.get_team_by_name(team_name)
                    else:
                        team = self.data_manager.get_team_by_owner(interaction.user.id)

                    if not team:
                        await interaction.followup.send("Team not found!", ephemeral=True)
                        return

                    embed = discord.Embed(
                        title=f"Players in {team['name']} 📋",
                        description=f"Current roster size: {len(team['players'])}/{team['max_size']} players",
                        color=discord.Color.green()
                    )

                    if team['players']:
                        # Create a formatted player list with numbers
                        players_chunks = []
                        chunk_size = 15  # Players per field
                        
                        for i in range(0, len(team['players']), chunk_size):
                            chunk = team['players'][i:i + chunk_size]
                            player_text = "\n".join([
                                f"{i+j+1}. {player['name']} (ID: {player['id']})"
                                for j, player in enumerate(chunk)
                            ])
                            players_chunks.append(player_text)

                        # Add chunks as separate fields to prevent hitting character limits
                        for i, chunk in enumerate(players_chunks):
                            start_num = i * chunk_size + 1
                            end_num = min((i + 1) * chunk_size, len(team['players']))
                            embed.add_field(
                                name=f"Players {start_num}-{end_num}",
                                value=chunk,
                                inline=False
                            )
                    else:
                        embed.add_field(
                            name="Status",
                            value="This team has no players yet.",
                            inline=False
                        )

                    embed.set_footer(text="Use /add-player to add new players to the team")
                    await interaction.followup.send(embed=embed)

            except asyncio.TimeoutError:
                logger.error("Timeout while listing players")
                await interaction.followup.send(
                    "The player listing process timed out. Please try again.",
                    ephemeral=True
                )
                return

        except Exception as e:
            logger.error(f"Error in list-players command: {str(e)}")
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


async def setup(bot):
    await bot.add_cog(TeamManagement(bot))
