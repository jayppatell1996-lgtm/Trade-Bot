import json
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
