const createGraph = require('ngraph.graph');
const graph = createGraph();
const schema = require('./schema.json');
const pathFinder = require('ngraph.path');
const fs = require('fs');
// const { promisify } = require('util');
// const writeFile = promisify(fs.writeFile);
// const takeShot = require('ngraph.takeshot');

const startTable = "meter_list";
const endTable = "device_config_detail";


// Iterate over each model
schema.forEach(model => {
    const modelName = model.name;
    graph.addNode(modelName);

    // Iterate over each field in the model
    model.fields.forEach(field => {
        const fieldName = field.name;
        const fieldType = field.type;

        // Add node for field
        graph.addNode(`${modelName}.${fieldName}`);

        // Add edge for field reference
        if (field.references && field.references !== "") {
            graph.addLink(modelName, field.references);
        }
    });
});


// // Generate a PNG image
// takeShot.toDataURL(graph, {
//     layout: layout,
//     node: node => ({ width: 10, height: 10 }),
//     link: () => ({ width: 1 }),
// }).then(async url => {
//     console.log('PNG URL:', url);
//     // Save the image to a file
//     try {
//         await writeFile('graph.png', Buffer.from(url.split(',')[1], 'base64'));
//         console.log('Image saved as graph.png');
//     } catch (err) {
//         console.error('Error saving image:', err);
//     }
// });

function buildSqlStatement(startTable, endTable, shortestPath, schema) {
    let sqlStatement = `SELECT * FROM ${startTable} `;
    for (let i = 0; i < shortestPath.length - 1; i++) {
        const currentNode = shortestPath[i].id;
        const nextNode = shortestPath[i + 1].id;

        // Find the relationship between the current node and the next node
        const currentModel = schema.find(model => model.name === currentNode);
        if (!currentModel) {
            console.error(`Model ${currentNode} not found in schema`);
            continue;
        }

        const nextField = currentModel.fields.find(field => field.references && field.references.split('.')[0] === nextNode);

        if (nextField) {
            sqlStatement += `JOIN ${nextNode} ON ${currentNode}.${nextField.name} = ${nextNode}.${nextField.references.split('.')[1]} `;
        }
    }

    return sqlStatement.trim();
}

// Perform path finding
const pathFinderInstance = pathFinder.aStar(graph);
// Find shortest path
const shortestPath = pathFinderInstance.find(startTable, endTable);

// Construct and log SQL statements for the shortest path
const sqlStatement = buildSqlStatement(startTable, endTable, shortestPath, schema);
console.log(`Path: ${sqlStatement}`);

