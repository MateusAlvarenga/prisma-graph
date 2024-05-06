const graph = require('./graph');
const { terminal } = require('terminal-kit');

async function runSearch() {
    terminal.clear();

    while (true) {
        terminal(`Please enter startTable:\n`);
        const startTable = await terminal.inputField().promise;
        terminal('\n');
        terminal(`Please enter endTable:\n`);
        const endTable = await terminal.inputField('endTable:').promise;
        terminal('\n');

        const result = graph(startTable, endTable);
        console.log(result);
        terminal('\n');
    }
}

runSearch();