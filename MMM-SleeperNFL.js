/* Magic Mirror
 * Module: MMM-Sleeper-NFL
 *
 * By jackmeyer https://github.com/fewieden/MMM-NFL
 * MIT Licensed.
 */

Module.register('MMM-SleeperNFL', {

    mapping: {
        post_season: "Playoffs"
    },

    matchupDetails: {
        playerName: 'You',
        playerPoints: 0.0,
        playerRecord: '0-0',
        opponentName: 'Them',
        opponentPoints: 0.0,
        opponentRecord: '0-0',
    },

    start() {
        Log.info(`Starting module: ${this.name}`);
        this.addGlobals();
        //this.addFilters();
        this.sendSocketNotification('CONFIG', this.config);
        moment.locale(config.locale);
    },

    suspend() {
        this.sendSocketNotification('SUSPEND', this.config);
    },

    resume() {
        this.sendSocketNotification('CONFIG', this.config);
    },

    socketNotificationReceived(notification, payload) {
        if(notification === 'NFL_STATE') { //should only run like once per day?
            this.week = payload?.week;
            this.season = payload?.season;
            this.loaded = true;
            this.updateDom(100);
        } else if(notification === 'LEAGUE_DETAILS') { // once per day
            this.leagueDetails = payload;
            this.updateDom(100);
        } else if(notification === 'MATCHUP_DETAILS') {  //2-3 minutes?
            console.log('matchup details received!');
            this.matchupDetails = payload;
        } 
        else if(notification === 'ALL_PLAYER_LIST') {  //2-3 minutes?
            console.log('matchup details received!');
            this.allPlayersList = payload;
        } 
        this.updateDom(100);
    },

    getScripts() {
        return ['moment.js'];
    },

    getStyles() {
        return ['font-awesome.css', 'MMM-SleeperNFL.css'];
    },

    getTemplate() {
        return `${this.name}.njk`;
    },

    getTemplateData() {
        return {
            mapping: this.mapping,
            week: this.week,
            season: this.season,
            leagueName: this.leagueName,
            leagueStatus: this.leagueStatus,
            leagueDetails: this.leagueDetails,
            matchupDetails: this.matchupDetails,
            config: this.config,
        };
    },

    addGlobals() {
        this.nunjucksEnvironment().addGlobal('includes', (array, item) => array.includes(item));
    },

    // addFilters() {
    //     this.nunjucksEnvironment().addFilter('formatDate', timestamp => moment(timestamp).format(this.config.format));

    //     this.nunjucksEnvironment().addFilter('iconUrl', teamName => this.file(`icons/${teamName}${this.config.helmets ? '_helmet' : ''}.png`));
    // }


})