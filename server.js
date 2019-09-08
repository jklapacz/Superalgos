/* Callbacks default responses. */

global.DEFAULT_OK_RESPONSE = {
    result: "Ok",
    message: "Operation Succeeded"
};

global.DEFAULT_FAIL_RESPONSE = {
    result: "Fail",
    message: "Operation Failed"
};

global.DEFAULT_RETRY_RESPONSE = {
    result: "Retry",
    message: "Retry Later"
};

global.CUSTOM_OK_RESPONSE = {
    result: "Ok, but check Message",
    message: "Custom Message"
};

global.CUSTOM_FAIL_RESPONSE = {
    result: "Fail Because",
    message: "Custom Message"
};

/* Process Events */

process.on('uncaughtException', function (err) {
    console.log('[INFO] server -> uncaughtException -> err.message = ' + err.message)
    console.log('[INFO] server -> uncaughtException -> err.stack = ' + err.stack)
    process.exit(1)
})

process.on('unhandledRejection', (reason, p) => {
    console.log('[INFO] server -> unhandledRejection -> reason = ' + JSON.stringify(reason))
    console.log('[INFO] server -> unhandledRejection -> p = ' + JSON.stringify(p))
    process.exit(1)
})

process.on('exit', function (code) {
    console.log('[INFO] server -> process.on.exit -> About to exit -> code = ' + code)
})

/* Local Variables */

let sequenceList = []
let heartBeatInterval

/*

We read the first string sent as an argument when the process was created by the Backend Server. Ther we will find the information of the identity
of this backend process and know exactly what to run within this server instance. 

*/
global.USER_DEFINITION = process.argv[2]

if (global.USER_DEFINITION !== undefined) {
    console.log('[INFO] server -> global.USER_DEFINITION = ' + global.USER_DEFINITION)
    try {
        global.USER_DEFINITION = JSON.parse(global.USER_DEFINITION)
    } catch (err) {
        console.log('[ERROR] server -> global.USER_DEFINITION -> ' + err.stack)
    }

}
/*
else {
    let argument = '{"type":"Backend Process","name":"New Backend Process","bot":{"type":"Sensor","botProcesses":[{"type":"Bot Process","name":"New Bot Process","code":{"devTeam":"AAMasters","bot":"AACharly","mode":"noTime","resumeExecution":true,"type":"Sensor","exchangeName":"Poloniex","process":"Live-Trades"}}]}}'
    try {
        global.USER_DEFINITION = JSON.parse(argument)
    } catch (err) {
        console.log(err.stack)
    }
}
*/

const EVENT_HANDLER_MODULE =  require('../Libraries/SystemEventsClient/SystemEventHandler.js');
global.SYSTEM_EVENT_HANDLER = EVENT_HANDLER_MODULE.newSystemEventHandler()

global.SYSTEM_EVENT_HANDLER.initialize('Clone Executor', bootLoader)

function bootLoader() {
   
    global.SYSTEM_EVENT_HANDLER.createEventHandler(global.USER_DEFINITION.name)

     /*
    tryToListenToCockpit()

    function tryToListenToCockpit() {

        global.SYSTEM_EVENT_HANDLER.listenToEvent('Cockpit-Restart-Simulation', 'Simulation Started', undefined, 'Clone Executor Boot Loader', onResponse, startSequence)

        function onResponse(message) {
            if (message.result !== global.DEFAULT_OK_RESPONSE.result) {
                setTimeout(tryToListenToCockpit, 3000)
            }
        }
    }
    */

    for (let i = 0; i < global.USER_DEFINITION.bot.botProcesses.length; i++) {
        let code = global.USER_DEFINITION.bot.botProcesses[i].code
        sequenceList.push(code)
    }

    /* Heartbeat sent to the UI */
    heartBeatInterval = setInterval(hearBeat, 1000)

    function hearBeat() {
        let key = global.USER_DEFINITION.name + '-' + global.USER_DEFINITION.type
        let event = {
            seconds: (new Date()).getSeconds()
        }
        global.SYSTEM_EVENT_HANDLER.raiseEvent(key, 'Heartbeat', event)
    }

    startSequence()
}


/* Old Run.js code follows... */

require('dotenv').config();

global.DEFINITION = require(process.env.INTER_PROCESS_FILES_PATH + '/Definition');
const definition = global.DEFINITION
const path = require('path');

global.SHALL_BOT_STOP = false

global.FULL_LOG = process.env.FULL_LOG

/* Default parameters can be changed by the execution configuration */
global.EXCHANGE_NAME = process.env.EXCHANGE_NAME
global.MARKET = { assetA: 'USDT', assetB: 'BTC' }
global.CLONE_EXECUTOR = { codeName: 'AACloud', version: '1.1' }





let isRunSequence = false;
let sequenceStep = 0;
let processedSteps = new Map();
let notFirstSequence = false;
let runClonExecutor = true;

if (process.env.RUN_SEQUENCE !== undefined) {
    isRunSequence = JSON.parse(process.env.RUN_SEQUENCE)
}

function startSequence () {
    if (isRunSequence) {
        process.on('message', message => {
            if (message === 'STOP') {
                runClonExecutor = false;

                /* Cleaning Before Exiting. */
                clearInterval(heartBeatInterval)

                global.SYSTEM_EVENT_HANDLER.finalize()
                global.SYSTEM_EVENT_HANDLER = undefined
                console.log("[INFO] CloneExecutor -> Clone Executor Stopped.");
            }
        });
        sequenceExecution(sequenceStep)
    } else {
        readExecutionConfiguration()
    }
}


async function sequenceExecution(currentStep) {

    let execution = sequenceList[currentStep];

    process.env.STOP_GRACEFULLY = true;
    execution.devTeam ? process.env.DEV_TEAM = execution.devTeam : undefined;
    execution.bot ? process.env.BOT = execution.bot : undefined;
    execution.mode ? process.env.START_MODE = execution.mode : undefined;
    execution.resumeExecution = true;
    execution.type ? process.env.TYPE = execution.type : undefined;
    execution.process ? process.env.PROCESS = execution.process : undefined;
    execution.startYear ? process.env.MIN_YEAR = execution.startYear : undefined;
    execution.endYear ? process.env.MAX_YEAR = execution.endYear : undefined;
    execution.month ? process.env.MONTH = execution.month : undefined;
    execution.beginDatetime ? process.env.BEGIN_DATE_TIME = execution.beginDatetime : undefined;
    execution.endDatetime ? process.env.END_DATE_TIME = execution.endDatetime : undefined;
    execution.dataSet ? process.env.DATA_SET = execution.dataSet : undefined;
    execution.timePeriod ? process.env.TIME_PERIOD = execution.timePeriod : undefined;
    execution.baseAsset ? process.env.BASE_ASSET = execution.baseAsset : undefined;
    execution.balanceAssetA ? process.env.INITIAL_BALANCE_ASSET_A = execution.balanceAssetA : undefined;
    execution.balanceAssetB ? process.env.INITIAL_BALANCE_ASSET_B = execution.balanceAssetB : undefined;
    execution.type === 'Trading' ? process.env.CLONE_ID = 1 : undefined;

    execution.exchangeName ? global.EXCHANGE_NAME = execution.exchangeName : undefined;

    if (definition) {
        if (definition.personalData) {
            if (definition.personalData.exchangeAccounts) {
                if (definition.personalData.exchangeAccounts.length > 0) {
                    let exchangeAccount = definition.personalData.exchangeAccounts[0]
                    if (exchangeAccount.keys) {
                        if (exchangeAccount.keys.length > 0) {
                            let key = exchangeAccount.keys[0]

                            process.env.KEY = key.name
                            process.env.SECRET = key.code

                        }
                    }
                }
            }
        }
    }

    let stepKey = execution.devTeam + '.' + execution.bot + '.' + execution.process;
    if (processedSteps.has(stepKey)) {
        processedSteps.set(stepKey, processedSteps.get(stepKey) + 1);
    } else {
        processedSteps.set(stepKey, 0);
    }

    readExecutionConfiguration(execution);
    sequenceStep++;
}

function onExecutionFinish(result, finishStepKey) {
    if (sequenceStep < sequenceList.length && runClonExecutor) {
        sequenceExecution(sequenceStep);
    } else {
        setTimeout(function () {
            if (runClonExecutor) {
                console.log("[INFO] onExecutionFinish -> New round for sequence execution started.");
                 
                sequenceStep = 0;
                processedSteps = new Map();
                notFirstSequence = true;
                sequenceExecution(sequenceStep);
            }
        }, process.env.EXECUTION_LOOP_DELAY);
    }

}

async function readExecutionConfiguration(execution) {
    try {
        console.log("[INFO] server -> readExecutionConfiguration -> Entering function. ");

        let timePeriodFilter
        let botProcess

        /* Dates are taken initially from .env, but can be overwritten if they are defined by the user */
        let initialDatetime = process.env.BEGIN_DATE_TIME
        let finalDatetime = process.env.END_DATE_TIME

        if (execution.type === 'Trading-Engine') {

            /* The Trading Engine only resumes its execution after the first sequence was completed. */
            if (notFirstSequence === false) {
                execution.resumeExecution = false
            }

            /* We set the START MODE of the Trading Engine */
            if (process.env.KEY === undefined || process.env.SECRET === undefined) {
                process.env.START_MODE = "backtest" // if we dont have keys, we swtich to backtest mode to avoid exchange errors.
            } else {
                process.env.START_MODE = "live"  // If we have keys, then we are in live mode.
            }

            if (definition !== undefined) {
                if (definition.simulationParams !== undefined) {
                    if (definition.simulationParams.beginDatetime !== undefined) {
                        initialDatetime = new Date(definition.simulationParams.beginDatetime)  /* The first override occurs here, with the simulation parameters */
                    }
                    /* Here we only look for one timePeriod, in the future we will be able to process the whole array, but not for now. */
                    if (definition.simulationParams.timePeriodDailyArray !== undefined) {
                        if (definition.simulationParams.timePeriodDailyArray.length === 1) {
                            timePeriodFilter = definition.simulationParams.timePeriodDailyArray[0]
                            botProcess = "Multi-Period"
                        }
                    }
                    if (definition.simulationParams.timePeriodMarketArray !== undefined) {
                        if (definition.simulationParams.timePeriodMarketArray.length === 1) {
                            timePeriodFilter = definition.simulationParams.timePeriodMarketArray[0]
                            botProcess = "Multi-Period"
                        }
                    }
                }
                if (definition.tradingSystem !== undefined) {
                    if (definition.tradingSystem.parameters !== undefined) {
                        if (definition.tradingSystem.parameters.timeRange !== undefined) {
                            if (definition.tradingSystem.parameters.timeRange.code !== undefined) {
                                try {
                                    let code = JSON.parse(definition.tradingSystem.parameters.timeRange.code)
                                    if (code.initialDatetime !== undefined) {
                                        initialDatetime = code.initialDatetime /* The second override occurs here, with the date explicitelly defined by the user */
                                    }
                                    if (code.finalDatetime !== undefined) {
                                        finalDatetime = code.finalDatetime
                                    }
                                } catch (err) {
                                    definition.tradingSystem.parameters.timeRange.error = err.message
                                }
                            }
                        }
                    }
                }
                /* Get the initial balance from the definition */
                let tradingSystem = definition.tradingSystem

                if (tradingSystem) {
                    if (tradingSystem.parameters !== undefined) {
                        if (tradingSystem.parameters.baseAsset !== undefined) {
                            let code
                            try {
                                code = JSON.parse(tradingSystem.parameters.baseAsset.code);

                                if (code.name !== undefined) {
                                    baseAsset = code.name;
                                    if (baseAsset !== 'BTC' && baseAsset !== 'USDT') {
                                        /* using BTC as default */
                                        baseAsset = 'BTC'
                                    }
                                }

                                if (baseAsset === 'BTC') { // NOTE: POLONIEX, the only exchange working so far, has Asset A and B inverted. We need to fix this.
                                    if (code.initialBalance !== undefined) {
                                        process.env.INITIAL_BALANCE_ASSET_B = code.initialBalance;
                                        process.env.INITIAL_BALANCE_ASSET_A = 0
                                    }
                                } else {
                                    if (code.initialBalance !== undefined) {
                                        process.env.INITIAL_BALANCE_ASSET_A = code.initialBalance;
                                        process.env.INITIAL_BALANCE_ASSET_B = 0
                                    }
                                }
                            } catch (err) {
                                definition.tradingSystem.parameters.baseAsset.error = err.message

                                process.env.INITIAL_BALANCE_ASSET_A = 0 // default
                                process.env.INITIAL_BALANCE_ASSET_B = 0.001 // default
                                
                            }
                        }
                    }
                }
            }
        }

        let startMode

        // General Financial Being Configuration
        global.DEV_TEAM = process.env.DEV_TEAM
        global.CURRENT_BOT_REPO = process.env.BOT + "-" + process.env.TYPE + "-Bot"

        if (process.env.TYPE === 'Trading' || process.env.TYPE === 'Trading-Engine') {
            let live = {
                run: 'false',
                resumeExecution: execution.resumeExecution,
                beginDatetime: new Date(definition.simulationParams.timestamp).toISOString(),
                endDatetime: finalDatetime
            }

            let backtest = {
                run: 'false',
                resumeExecution: execution.resumeExecution,
                beginDatetime: initialDatetime,
                endDatetime: finalDatetime
            }

            let competition = {
                run: 'false',
                resumeExecution: execution.resumeExecution,
                beginDatetime: initialDatetime,
                endDatetime: finalDatetime
            }

            startMode = {
                live: live,
                backtest: backtest,
                competition: competition
            }
        } else if (process.env.TYPE === 'Indicator' || process.env.TYPE === 'Sensor') {
            let allMonths = {
                run: "false",
                minYear: process.env.MIN_YEAR,
                maxYear: process.env.MAX_YEAR
            }
            let oneMonth = {
                run: "false",
                year: process.env.MIN_YEAR,
                month: process.env.MONTH
            }
            let noTime = {
                run: "false",
                beginDatetime: process.env.BEGIN_DATE_TIME,
                resumeExecution: execution.resumeExecution
            }
            let fixedInterval = {
                run: "false",
                interval: process.env.INTERVAL
            }

            startMode = {
                allMonths: allMonths,
                oneMonth: oneMonth,
                noTime: noTime,
                fixedInterval: fixedInterval
            }
        } else {
            console.log("[ERROR] readExecutionConfiguration -> Bot Type is invalid.");
            throw new Error("readExecutionConfiguration -> Bot Type is invalid.")
        }

        startMode[process.env.START_MODE].run = "true"

        if (botProcess === undefined) { botProcess = process.env.PROCESS } // Only use the .env when nothing comes at Definition.json
        let cloneToExecute = {
            enabled: "true",
            devTeam: process.env.DEV_TEAM,
            bot: process.env.BOT,
            process: botProcess,
            repo: global.CURRENT_BOT_REPO
        }

        let timePeriod
        if (timePeriodFilter === undefined) {
            timePeriod = process.env.TIME_PERIOD
        } else {
            timePeriod = timePeriodFilter
        }

        global.EXECUTION_CONFIG = {
            cloneToExecute: cloneToExecute,
            startMode: startMode,
            timePeriod: getTimePeriod(timePeriod),
            timePeriodFileStorage: timePeriod,
            timePeriodFilter: timePeriodFilter,
            dataSet: process.env.DATA_SET
        };

        timePeriodFilter = undefined
        timePeriod = undefined

        global.CLONE_EXECUTOR = {
            codeName: 'AACloud',
            version: '1.1'
        }

        startRoot();
    }

    catch (err) {
        console.log("[ERROR] readExecutionConfiguration -> err = " + err.stack);
        console.log("[ERROR] readExecutionConfiguration -> Please verify that the Start Mode for the type of Bot configured applies to that type.");
    }
}


function getTimePeriod(timePeriod) {
    if (timePeriod !== undefined) {
        try {
            let timePeriodMap = new Map()
            timePeriodMap.set('24-hs', 86400000)
            timePeriodMap.set('12-hs', 43200000)
            timePeriodMap.set('08-hs', 28800000)
            timePeriodMap.set('06-hs', 21600000)
            timePeriodMap.set('04-hs', 14400000)
            timePeriodMap.set('03-hs', 10800000)
            timePeriodMap.set('02-hs', 7200000)
            timePeriodMap.set('01-hs', 3600000)
            timePeriodMap.set('45-min', 2700000)
            timePeriodMap.set('40-min', 2400000)
            timePeriodMap.set('30-min', 1800000)
            timePeriodMap.set('20-min', 1200000)
            timePeriodMap.set('15-min', 900000)
            timePeriodMap.set('10-min', 600000)
            timePeriodMap.set('05-min', 300000)
            timePeriodMap.set('04-min', 240000)
            timePeriodMap.set('03-min', 180000)
            timePeriodMap.set('02-min', 120000)
            timePeriodMap.set('01-min', 60000)
            return timePeriodMap.get(timePeriod)
        } catch (error) {
            console.log('[WARN] server -> readExecutionConfiguration -> getTimePeriod -> Error: ', error)
        }
    } else {
        return undefined
    }
}

function startRoot() {
    console.log('[INFO] server -> startRoot -> Entering function. ')

    const ROOT_DIR = './'
    const ROOT_MODULE = require(ROOT_DIR + 'Root')
    let root = ROOT_MODULE.newRoot()

    let UI_COMMANDS = {
        beginDatetime: undefined,
        endDatetime: undefined,
        timePeriod: undefined,
        startMode: undefined,
        eventHandler: undefined
    }

    root.initialize(UI_COMMANDS, onInitialized)

    function onInitialized() {
        console.log('[INFO] server -> startRoot -> onInitialized -> Entering function. ')

        root.start(onExecutionFinish)
    }
}

