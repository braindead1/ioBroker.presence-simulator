'use strict';

/*
 * Created with @iobroker/create-adapter v1.17.0
 */

// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
const utils = require('@iobroker/adapter-core');

// Load your modules here
const nodeSchedule = require('node-schedule');

class PresenceSimulator extends utils.Adapter {

    /**
     * @param {Partial<ioBroker.AdapterOptions>} [options={}]
     */
    constructor(options) {
        super({
            ...options,
            name: 'presence-simulator',
        });
        this.on('ready', this.onReady.bind(this));
        this.on('objectChange', this.onObjectChange.bind(this));
        this.on('stateChange', this.onStateChange.bind(this));
        // this.on('message', this.onMessage.bind(this));
        this.on('unload', this.onUnload.bind(this));

        this.activated = false;
        this.schedules = [];
    }

    /**
     * Is called when databases are connected and adapter received configuration.
     */
    async onReady() {
        // Initialize your adapter here
        await this.initializeObjects();

        // Check the status of the presence simulator
        let activated = await this.getStateAsync('activated');
        if(activated && activated.val === true) {
            this.activated = true;
        }

        if (this.activated === true) {
            await this.activatePresenceSimulation();
        }

        this.log.info('Presence simulator is ready');
    }

    /**
     * Is called when adapter shuts down - callback has to be called under any circumstances!
     * @param {() => void} callback
     */
    onUnload(callback) {
        try {
            this.log.info('cleaned everything up...');
            callback();
        } catch (e) {
            callback();
        }
    }

    /**
     * Is called if a subscribed object changes
     * @param {string} id
     * @param {ioBroker.Object | null | undefined} obj
     */
    onObjectChange(id, obj) {
        if (obj) {
            // The object was changed
            this.log.info(`object ${id} changed: ${JSON.stringify(obj)}`);
        } else {
            // The object was deleted
            this.log.info(`object ${id} deleted`);
        }
    }

    /**
     * Is called if a subscribed state changes
     * @param {string} id
     * @param {ioBroker.State | null | undefined} state
     */
    onStateChange(id, state) {
        if (state) {
            // The state was changed
            this.log.info(`state ${id} changed: ${state.val} (ack = ${state.ack})`);

            if (id === 'presence-simulator.0.activated') {
                if (state.val === true) {
                    this.activatePresenceSimulation();
                } else {
                    this.deactivatePresenceSimulation();
                }
            }
        } else {
            // The state was deleted
            this.log.info(`state ${id} deleted`);
        }
    }

    /**
     * Is called to initialize objects
     */
    async initializeObjects() {
        this.log.debug('[initializeObjects] started');

        // Create adapter objects
        await this.setObjectAsync('activated', {
            type: 'state',
            common: {
                name: 'Presence simulator status',
                type: 'boolean',
                role: 'indicator',
                read: true,
                write: true,
            },
            native: {},
        });

        // Subscribe to all state changes inside the adapters namespace
        this.subscribeStates('*');

		this.log.debug('[initializeObjects] finished');
    }
    
    /**
     * Is called when presence simulation is activated
     */
    async activatePresenceSimulation() {
        this.log.debug('[activatePresenceSimulation] started');

        // Setup schedules
        this.log.info('[activatePresenceSimulation] Setup schedules');

        var index;
        var schedule;
        var cron;
        for (index = 0; index < this.config.schedules.length; ++index) {
            schedule = this.config.schedules[index];

            if (this.isValidSchedule(schedule)) {
                this.log.debug('[activatePresenceSimulation] valid schedule found');

                // Start time
                cron = this.calculateCron(schedule.earliest_start_time, schedule.latest_start_time);

                // Add schedule for start time
                this.schedules.push(
                    nodeSchedule.scheduleJob(cron, function(){
                        this.log.info("Scheduled job '" + schedule.name + "' done");
                    }.bind(this))
                );

                this.log.info("Job '" + schedule.name + "' scheduled for " + cron);
            }
        }        

        this.log.debug('[activatePresenceSimulation] finished');
    }

    /**
     * Is called when presence simulation is deactivated
     */
    async deactivatePresenceSimulation() {
        this.log.debug('[deactivatePresenceSimulation] started');

        // Delete schedules
        this.log.info('[deactivatePresenceSimulation] Delete schedules');

        var index;
        for (index = 0; index < this.schedules.length; ++index) {
            this.schedules[index].cancel();
        }

        this.log.debug('[deactivatePresenceSimulation] finished');
    }

    /**
     * Validates a schedule
     * @param {*} schedule 
     */
    isValidSchedule(schedule) {
        if (schedule.earliest_start_time !== '' && schedule.activated === true) {
            var index;
            var state;
            for (index = 0; index < schedule.states.length; ++index) {
                state = schedule.states[index];

                if (state.state_start !== '' && state.probability !== '') {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * 
     * @param {string} earliestStartTime 
     * @param {string} latestStartTime 
     */
    calculateCron(earliestStartTime, latestStartTime) {
        var retVal;

        if (latestStartTime === "") {
            // Start at fixed time
            retVal = this.convertTimeToCron(earliestStartTime);
        } else {
            // Calculate start time
            var earliestTime = earliestStartTime.split(':');
            var latestTime = latestStartTime.split(':');
            var diffMinutes = (parseInt(latestTime[0]) * 60 + parseInt(latestTime[1])) - (parseInt(earliestTime[0]) * 60 + parseInt(earliestTime[1]));
            var randomMinutes = Math.floor(Math.random() * (diffMinutes - 0 + 1)) + 0;

            var startTime = [parseInt(earliestTime[0]), parseInt(earliestTime[1])];
            startTime[0] = startTime[0] + Math.floor(randomMinutes / 60);
            startTime[1] = startTime[1] + (randomMinutes % 60);
            retVal = this.convertTimeToCron(startTime[0] + ':' + startTime[1]);
        }

        return retVal;
    }

    /**
     * Is used to convert a time into a cron string
     * @param {string} time 
     */
    convertTimeToCron(time) {
        var retVal = time.split(':');

        return retVal[1] + ' ' + retVal[0] + ' * * *';
    }
    
}

// @ts-ignore parent is a valid property on module
if (module.parent) {
    // Export the constructor in compact mode
    /**
     * @param {Partial<ioBroker.AdapterOptions>} [options={}]
     */
    module.exports = (options) => new PresenceSimulator(options);
} else {
    // otherwise start the instance directly
    new PresenceSimulator();
}
