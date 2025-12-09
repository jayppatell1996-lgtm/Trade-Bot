def validate_team_name(name):
    """
    Validate team name length and characters
    """
    return isinstance(name, str) and 2 <= len(name) <= 32

def validate_roster_size(team):
    """
    Validate team roster size against team's max_size
    """
    return len(team['players']) < team['max_size']
