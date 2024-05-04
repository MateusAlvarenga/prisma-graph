const createGraph = require('ngraph.graph');
const graph = createGraph();
const schema = require('./schema.json');
const pathFinder = require('ngraph.path');
const fs = require('fs');

const startTable = "User";
const endTable = "Comment";

// Iterate over each model
schema.forEach(model => {
    const modelName = model.name;
    graph.addNode(modelName);

    // Iterate over each field in the model
    model.fields.forEach(field => {
        const fieldName = field.name;
        const fieldType = field.type;

        // Add node for field
        //graph.addNode(`${modelName}.${fieldName}`);

        // Add edge for field reference
        if (field.references && field.references !== "") {
            graph.addLink(modelName, fieldType, { "reference": field });
        }
    });
});

console.log("Graph: ");
// Log all nodes from the graph
graph.forEachNode(node => {
    console.log(node.id);
});
console.log("Links: ");
// Log all links from the graph
graph.forEachLink(link => {
    console.log(`${link.fromId} -> ${link.toId}`);
});




function buildSqlStatement(startTable, endTable, shortestPath, schema) {

    let tables_to_join = shortestPath.slice(1);
    let tables_to_join_id = tables_to_join.map((node) => node.id);
    let sqlStatement = `SELECT * FROM ${startTable}`;
    let currentTable = startTable;

    tables_to_join_id.forEach((table_id) => {

        let link = graph.getLink(table_id, currentTable);
        let reference = link.data.reference;

        sqlStatement += ` JOIN ${table_id} ON  ${reference.references} = ${reference.name}`;

        currentTable = table_id;
    });



    return sqlStatement.trim();
}


// Perform path finding
const pathFinderInstance = pathFinder.aStar(graph);
// Find shortest path
const shortestPath = pathFinderInstance.find(endTable, startTable);
// Log the shortestPath nodes
console.log("Shortest Path Nodes: ");
shortestPath.forEach(node => {
    console.log(node.id);
    node.links.forEach(link => {
        console.log(link);
    });
});

// Construct and log SQL statements for the shortest path
const sqlStatement = buildSqlStatement(startTable, endTable, shortestPath, schema);
console.log(`Path: ${sqlStatement}`);

