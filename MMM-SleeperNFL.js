/* Magic Mirror
 * Module: MMM-Sleeper-NFL
 *
 * By jackmeyer https://github.com/jackmeyer/MMM-SleeperNFL
 * MIT Licensed.
 */

Module.register('MMM-SleeperNFL', {

    mapping: {
        post_season: "Playoffs"
    },

    defaults: {
        showBench: true,
        showPlayerAvatars: true,
        tableSize: 'small',
        liveInterval: 30000,
        inactiveInterval: 1000 * 60 * 5,
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
            this.config.season = payload?.season;
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
        this.updateDom();
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
            season: this.config.season,
            leagueName: this.leagueName,
            leagueStatus: this.leagueStatus,
            leagueDetails: this.leagueDetails,
            matchupDetails: this.matchupDetails,
            config: this.config,
        };
    },

    addGlobals() {
        this.nunjucksEnvironment().addGlobal('isDefense', (playerId) => isNaN(playerId));
        this.nunjucksEnvironment().addGlobal('toLowerCase', (team) => team.toLowerCase());
    },

    // addFilters() {
    //     this.nunjucksEnvironment().addFilter('formatDate', timestamp => moment(timestamp).format(this.config.format));

    //     this.nunjucksEnvironment().addFilter('iconUrl', teamName => this.file(`icons/${teamName}${this.config.helmets ? '_helmet' : ''}.png`));
    // }


})
