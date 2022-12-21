const fetch = require('node-fetch');
const Log = require('logger');
const playerList = require('./playerlist.json');
fs = require('fs');

async function getUserDetails(username) {
    const response = await fetch(`https://api.sleeper.app/v1/user/${username}`);
    const parsedResponse = await response.json();
    const userName = parsedResponse?.username;
    const userId = parsedResponse?.user_id;
    const displayName = parsedResponse?.display_name;
    const avatar = parsedResponse?.avatar;
    return { userName, userId, displayName, avatar };
    
}

async function getAllRosterData(league_id) {
    const response = await fetch(`https://api.sleeper.app/v1/league/${league_id}/rosters`);
    const parsedResponse = await response.json();
    return parsedResponse;
}

async function getNFLState() {
    const response = await fetch("https://api.sleeper.app/v1/state/nfl");

    if (!response.ok) {
        throw new Error('failed to fetch NFL state');
    }

    const parsedResponse = await response.json();

    const week = parsedResponse?.week;
    const season = parsedResponse?.season;

    return { week, season };
}

async function getLeagueData(user_id, season) {
    const response = await fetch(`https://api.sleeper.app/v1/user/${user_id}/leagues/nfl/${season}`);

    if (!response.ok) {
        throw new Error('failed to fetch scoreboard');
    }

    const parsedResponse = await response.json();
    const data = parsedResponse[0];

    const leagueStatus = data?.status;
    const rosterPositions = data?.roster_positions;
    const leagueName = data?.name;

    return { leagueStatus, rosterPositions, leagueName };
}

async function getMatchupData(league_id, week, rosterId) { //gets matchup scores for User and Opponent rosters

    const response = await fetch(`https://api.sleeper.app/v1/league/${league_id}/matchups/${week}`);

    if (!response.ok) {
        throw new Error('failed to fetch matchups');
    }

    const parsedResponse = await response.json();
    const userRoster = parsedResponse.find(roster => {
        return roster.roster_id == rosterId;
    });
    userRoster.playerList = userRoster.starters.concat(userRoster.players.filter(n => !userRoster.starters.includes(n)));
    Log.info(userRoster.playerList);
    userRoster.sortedNameList = [];
    userRoster.sortedPointsList = [];
    for(playerId of userRoster.playerList) {
        var playerObj = playerList[playerId];
        if(playerObj.position == "DEF") {
            userRoster.sortedNameList.push(playerObj.team);
        } else{
            userRoster.sortedNameList.push(playerObj.first_name[0] + '. ' + playerObj.last_name);
        }
        userRoster.sortedPointsList.push(userRoster.players_points[playerId]);
    }
    
    var userDetails = await getUsernameFromRosterId(league_id, userRoster.roster_id);
    userRoster.display_name = userDetails.display_name; 
    userRoster.avatar = userDetails.avatar;
    Log.info("display_name: " + userRoster.display_name);
    var opponentRoster = null;
    if(userRoster.matchup_id != null) {
        opponentRoster = parsedResponse.find(roster => {
            return (roster.matchup_id == userRoster.matchup_id && roster.roster_id != userRoster.roster_id)
        });
        opponentRoster.playerList = opponentRoster.starters.concat(opponentRoster.players.filter(n => !opponentRoster.starters.includes(n)));
        opponentRoster.sortedNameList = [];
        opponentRoster.sortedPointsList= [];
        for(playerId of opponentRoster.playerList) {
            var playerObj = playerList[playerId];
            if(playerObj.position == "DEF") {
                opponentRoster.sortedNameList.push(playerObj.team);
            } else{
                opponentRoster.sortedNameList.push(playerObj.first_name[0] + '. ' + playerObj.last_name);
            }
            opponentRoster.sortedPointsList.push(opponentRoster.players_points[playerId]);
        }

       var userDetails2 = await getUsernameFromRosterId(league_id, opponentRoster.roster_id);
       opponentRoster.display_name = userDetails2.display_name;
       opponentRoster.avatar = userDetails2.avatar;
    }
    return { userRoster, opponentRoster }
}

async function getUsernameFromRosterId(league_id, roster_id) {
    const response = await fetch(`https://api.sleeper.app/v1/league/${league_id}/rosters`);
    const parsedResponse = await response.json();


    if (!response.ok) {
        throw new Error('failed to fetch league rosters');
    }

    const roster = parsedResponse.find(roster => {
        return roster.roster_id == roster_id;
    });

    const data = await getUserDetails(roster.owner_id);

    var display_name = data.displayName;
    var avatar = data.avatar;

    return {display_name, avatar };

}

async function refreshPlayerData() {
    var lastModifiedHours = 0;

    await fs.stat("./modules/MMM-SleeperNFL/playerlist.json", function(err, stats) {
        lastModifiedHours = (new Date().getTime() - stats.mtime) / (1000 * 60 * 60);

        //if player list hasn't been updated in the last 24hrs, allow update
        if(lastModifiedHours < 23) {
            Log.info("Not updating player list, has not been 24hrs yet");
            return;
        } else {
            this.getAllPlayerData();
        }
    });
}

async function getAllPlayerData() {

    const response = await fetch('https://api.sleeper.app/v1/players/nfl');

        if (!response.ok) {
             throw new Error('failed to fetch all player data');
        }

        const parsedResponse = await response.json();
        this.allPlayersList = parsedResponse;
        fs.writeFileSync('./modules/MMM-SleeperNFL/playerlist.json', JSON.stringify(parsedResponse), (err) => {
            if (err) { 
                Log.info(err); 
            } 
        });
        Log.info('NFL player list overwritten successfully!');
    return;
}

module.exports = { getUserDetails, getNFLState, getLeagueData, getMatchupData, refreshPlayerData, getAllPlayerData, getAllRosterData };