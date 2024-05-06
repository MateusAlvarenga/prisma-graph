const { terminal } = require('terminal-kit');
const parser = require('./parser');
const mountGraph = require('./graph');
const readline = require('readline');
const { listModels, searchModel } = require('./listModels');

const options = [
    'Parser',
    'Search Path',
    'List Models',
    'Search Model',
    'Exit'
];

function displayMenu() {
    terminal.clear();
    terminal.singleColumnMenu(options, async (error, response) => {
        if (error) {
            console.error(error);
            return;
        }
        switch (response.selectedText) {
            case 'Parser':
                await runWithProgressBar(parser);
                break;
            case 'Search path':
                terminal(`Please enter startTable:\n`);
                let startTable = await terminal.inputField().promise;
                terminal('\n');
                terminal(`Please enter endTable:\n`);
                let endTable = await terminal.inputField().promise;
                terminal('\n');
                await runWithProgressBar(() => mountGraph(startTable, endTable));
                break;
            case 'Search Model':
                terminal(`Please enter model name:\n`);
                let modelName = await terminal.inputField().promise;
                terminal('\n');
                await runWithProgressBar(() => searchModel(modelName));
                break;
            case 'List Models':
                await runWithProgressBar(listModels);
                break;
            case 'Exit':
                console.log('Exiting...');
                terminal.processExit(0);
                break;
            default:
                console.log('Invalid option');
                break;
        }
        displayMenu();
    });
}

async function runWithProgressBar(callback) {
    let progressBar = terminal.progressBar({
        width: 80,
        title: 'Processing...',
        eta: true,
        percent: true
    });

    try {
        //await callback();

        const response = await callback();
        console.log(response);
        // await pauseForEnter();
    } finally {
        progressBar.stop();
        console.log('\nTask completed!');
    }
}

function pauseForEnter() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise((resolve) => {
        rl.question('Press Enter to continue: ', (input) => {
            rl.close();
            resolve();
        });
    });
}

displayMenu();
