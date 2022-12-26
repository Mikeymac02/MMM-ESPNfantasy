/* Magic Mirror
 * Module: MMM-Sleeper-NFL
 *
 * By jackmeyer https://github.com/jackmeyer/MMM-SleeperNFL
 * MIT Licensed.
 */

const NodeHelper = require('node_helper');
const Log = require('logger');
const SleeperAPI = require('./SleeperAPI');
const ESPN = require('./espn');
const playerList = require('./playerlist.json');


module.exports = NodeHelper.create({

    scores: [],
    reloadInterval: null,
    liveInterval: null,
    week: null,
    userRosterId: null,
    userRoster: null,
    opponentRoster: null,

    async socketNotificationReceived(notification, payload) {
        if (notification === 'CONFIG') {
            this.config = payload;
            Log.info("config received!");
            this.LiveInterval = setInterval(() => {
                this.fetchOnLiveState();
            }, this.config.liveInterval); //every 30seconds
            this.reloadLeagueInterval = setInterval(() => {
                this.getLeagueData();
            }, this.config.inactiveInterval);
            this.reloadNFLInterval = setInterval(() => {
                this.getNFLState();
                this.getAllPlayerData();
            }, (1000 * 60 * 60 * 24)); //refresh NFL data every 24hrs
            await this.getNFLState();
            await this.getESPNData();
            await this.getAllPlayerData();
            await this.getUserRosterId();
            await this.getLeagueData();
            await this.getMatchupData();
        }
    },

    async getUserDetails(user_id) { //gets user details, including avatar ID and display name
        try{
            const data = await SleeperAPI.getUserDetails(user_id);
            this.sendSocketNotification('USER_DETAILS', data);
        } catch (error) {
            Log.error(`Error getting user details ${error}`);
        }
    },

    async getUserRosterId() {
        try {
            const data = await SleeperAPI.getAllRosterData(this.config.leagueId);
            this.userRosterId = data.find(roster => {
                return roster.owner_id == this.config.userId;
            }).roster_id;
        } catch (error) {
            Log.error(`Error getting rosterId ${error}`);
        }
    },

    async getNFLState() { //gets season data, like year, season status (regular or post) and current week
        try{
            const data = await SleeperAPI.getNFLState();
            this.season = data?.season;
            const season = data?.season;
            const week = data?.week;
            this.week = data?.week;
            const payload = { season, week }
            Log.info(payload);
            this.sendSocketNotification('NFL_STATE', payload);
        } catch (error) {
            Log.error(`Error getting NFL state ${error}`);
        }
    },

    async getLeagueData() { //gets league settings, which should only be needed once per day at most
        try{
            const data = await SleeperAPI.getLeagueData(this.config.userId, this.season);
            const leagueStatus = data?.leagueStatus;
            const rosterPositions = data?.rosterPositions;
            const leagueName = data?.leagueName;
            const payload = { leagueName, leagueStatus, rosterPositions };
            this.sendSocketNotification('LEAGUE_DETAILS', payload);
        } catch (error) {
            Log.error(`Error getting league details ${error}`);
        }
    },

    async getAllPlayerData() { // gets json list of ALL player data, should only be called once per day
        try{
            await SleeperAPI.refreshPlayerData();
            this.sendSocketNotification('ALL_PLAYER_LIST', playerList);
        } catch (error) {
            Log.error(`Error updating player list ${error}`);
        }
    },

    async getMatchupData() { //gets data for the current week's matchup
        try{
            const data = await SleeperAPI.getMatchupData(this.config.leagueId, this.week, this.userRosterId);
            this.userRoster = data?.userRoster;
            const userRoster = data?.userRoster;
            this.opponentRoster = data?.opponentRoster;
            const opponentRoster = data?.opponentRoster;
            const payload = { userRoster, opponentRoster };
            this.sendSocketNotification('MATCHUP_DETAILS', payload);
        } catch (error) {
            Log.error(`Error getting matchup details ${error}`);
        }
    },

    async getESPNData() {
        try {
            const data = await ESPN.getData();
            this.scores = data.scores;
        } catch (error) {
            Log.error(`Error getting NFL scores ${error}`);
        }
    },

    fetchOnLiveState() {  // wrapper function to call getMatchupData more frequently when there is a live game
        const currentTime = new Date().toISOString();

        const endStates = ['final', 'final-overtime'];
        const liveMatch = this.scores.find(match => currentTime > match.timestamp && !endStates.includes(match.status));

        if (liveMatch) {
            Log.info("live game found!");
            this.getESPNData();
            this.getMatchupData();
        }
    },

});
