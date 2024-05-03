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

// Extract unique nodes from the shortest path
const uniqueNodes = new Set(shortestPath.map(node => node.id));

// Find the 3 best possible paths
const allShortestPaths = [];
for (let i = 0; i < 3; i++) {
    // Exclude nodes from the previous paths
    const excludedNodes = Array.from(uniqueNodes).join(',');

    // Find the next shortest path excluding the already found nodes
    const nextShortestPath = pathFinderInstance.find(startTable, endTable, {
        exclude: excludedNodes
    });

    // Break if no more paths are found
    if (!nextShortestPath) break;

    // Add the new path to the list of shortest paths
    allShortestPaths.push(nextShortestPath);

    // Add the nodes from the new path to the set of unique nodes
    nextShortestPath.forEach(node => uniqueNodes.add(node.id));
}

// Construct and log SQL statements for the shortest paths
allShortestPaths.forEach((shortestPath, index) => {
    const sqlStatement = buildSqlStatement(startTable, endTable, shortestPath, schema);
    console.log(`Path ${index + 1}: ${sqlStatement}`);
});
