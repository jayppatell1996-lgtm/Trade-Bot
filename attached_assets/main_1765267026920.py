import discord
from discord.ext import commands
import json
import os
import logging
from dotenv import load_dotenv
from cogs.team_management import TeamManagement
from cogs.trading import Trading
from cogs.help import Help

load_dotenv()
# Set up logging with more detailed format
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s %(levelname)-8s %(name)s %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger('discord')


# Bot configuration
intents = discord.Intents.default()
intents.message_content = True
intents.members = True
logging.basicConfig(level=logging.DEBUG)

class SportsBot(commands.Bot):
    def __init__(self):
        super().__init__(command_prefix='/', intents=intents)
        self.initial_extensions = ['cogs.team_management', 'cogs.trading', 'cogs.help']
        

    async def setup_hook(self):
        logger.debug("Starting to load extensions...")
        for ext in self.initial_extensions:
            try:
                logger.debug(f"Attempting to load extension: {ext}")
                await self.load_extension(ext)
                logger.info(f"Successfully loaded extension: {ext}")
            except commands.ExtensionError as e:
                logger.error(f"Failed to load extension {ext}: {str(e)}")
                raise  # Re-raise to prevent bot from starting with missing extensions
            except Exception as e:
                logger.error(f"Unexpected error loading {ext}: {str(e)}")
                raise

        # Create data directory if it doesn't exist
        if not os.path.exists('data'):
            os.makedirs('data')
            logger.debug("Created data directory")
        if not os.path.exists('data/teams.json'):
            with open('data/teams.json', 'w') as f:
                json.dump({}, f)
            logger.debug("Created teams.json file")
        
        # Sync commands with proper error handling
        try:
            logger.debug("Starting command tree sync...")
            synced_commands = await self.tree.sync()
            logger.info(f"Successfully synced {len(synced_commands)} command(s)")
            logger.debug(f"Registered commands: {[cmd.name for cmd in synced_commands]}")
            assert 'propose-trade' in [cmd.name for cmd in synced_commands], "propose-trade not registered"
            assert 'list-players' in [cmd.name for cmd in synced_commands], "'list-players' command not registered"
            logger.info(f"Successfully synced {len(synced_commands)} command(s)")
            for cmd in synced_commands:
                logger.debug(f"Synced command: {cmd.name}")
        except discord.HTTPException as e:
            logger.error(f"Failed to sync command tree (HTTP error): {str(e)}")
            raise  # Re-raise to prevent bot from running with unsynced commands
        except discord.ClientException as e:
            logger.error(f"Failed to sync command tree (Client error): {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error during command sync: {str(e)}")
            logger.error(f"Command not registered: {e}")
            raise

    async def on_ready(self):
        logger.info(f'{self.user} has connected to Discord!')
        synced_commands = await bot.tree.sync()
        logger.debug(f"Manually synced commands: {[cmd.name for cmd in synced_commands]}")
        logger.info(f'Bot is active in {len(self.guilds)} guild(s)')

bot = SportsBot()

# Use token from environment variable
print(f"Loaded BOT_TOKEN: {os.getenv('TRADE_BOT_TOKEN')}")
bot.run(os.getenv('TRADE_BOT_TOKEN'))
