const createGraph = require('ngraph.graph');
const schema = require('./schema.json');
const pathFinder = require('ngraph.path');
const fs = require('fs');
const graph = createGraph();


function mountGraph(startTable, endTable) {

    //validate if the tables are in the graph

    if (!schema.find(model => model.name === startTable)) {
        throw new Error(`Table ${startTable} not found in schema`);
    }

    if (!schema.find(model => model.name === endTable)) {
        throw new Error(`Table ${endTable} not found in schema`);
    }

    schema.forEach(model => {
        const modelName = model.name;
        graph.addNode(modelName);

        model.fields.forEach(field => {
            const fieldName = field.name;
            const fieldType = field.type;


            if (field.relation) {
                graph.addLink(modelName, fieldType, { "field": field });
            }
        });
    });

    console.log("Graph: ");
    graph.forEachNode(node => {
        console.log(node.id);
    });
    console.log("Links: ");
    graph.forEachLink(link => {
        console.log(`${link.fromId} -> ${link.toId}`);
    });

    function buildSqlStatement(startTable, endTable, shortestPath, schema) {
        let tablesToJoin = shortestPath.slice(1);
        let tablesToJoinId = tablesToJoin.map((node) => node.id);
        let sqlStatement = `SELECT * FROM ${startTable}`;
        let currentTable = startTable;
        tablesToJoinId.forEach((tableId) => {
            let link = graph.getLink(tableId, currentTable);
            if (link) {
                let field = link.data.field;
                let joinFields = field.relation.fields.split(", ").map((f) => `${tableId}.${f}`);
                let refFields = field.relation.references.split(", ").map((f) => `${currentTable}.${f}`);
                sqlStatement += ` JOIN ${tableId} ON ${joinFields.join(' AND ')} = ${refFields.join(' AND ')}`;
            } else {
                link = graph.getLink(currentTable, tableId);
                if (link) {
                    let field = link.data.field;
                    let joinFields = field.relation.references.split(", ").map((f) => `${currentTable}.${f}`);
                    let refFields = field.relation.fields.split(", ").map((f) => `${tableId}.${f}`);
                    sqlStatement += ` JOIN ${tableId} ON ${joinFields.join(' AND ')} = ${refFields.join(' AND ')}`;
                } else {
                    throw new Error(`Link not found between ${tableId} and ${currentTable}`);
                }
            }

            currentTable = tableId;
        });



        return sqlStatement.trim();
    }

    //validate if the tables are in the graph

    if (!graph.hasNode(startTable)) {
        throw new Error(`Table ${startTable} not found in schema`);
    }

    if (!graph.hasNode(endTable)) {
        throw new Error(`Table ${endTable} not found in schema`);
    }

    const pathFinderInstance = pathFinder.aStar(graph);
    const shortestPath = pathFinderInstance.find(endTable, startTable);
    console.log("\nShortest Path Nodes:" + shortestPath.map((node) => node.id).join(" ->"));
    //console.log("Shortest Path Nodes: ");
    // shortestPath.forEach(node => {
    //     //console.log(node.id);
    //     node.links.forEach(link => {
    //         console.log(link.id);
    //         //console.log(link.data.field.relation)
    //     });
    // });

    if (shortestPath.length === 0) {
        throw new Error(`Unreachable: No path found between ${startTable} and ${endTable}`);
    }

    const sqlStatement = buildSqlStatement(startTable, endTable, shortestPath, schema);
    console.log(`Path: ${sqlStatement}`);

}

module.exports = mountGraph;
