const createGraph = require('ngraph.graph');
const schema = require('./schema.json');
const pathFinder = require('ngraph.path');
const fs = require('fs');
const graph = createGraph();


function mountGraph(startTable, endTable) {

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

        let tables_to_join = shortestPath.slice(1);
        let tables_to_join_id = tables_to_join.map((node) => node.id);
        let sqlStatement = `SELECT * FROM ${startTable}`;
        let currentTable = startTable;

        tables_to_join_id.forEach((table_id) => {

            let link = graph.getLink(table_id, currentTable);
            if (link) {
                let field = link.data.field;
                sqlStatement += ` JOIN ${table_id} ON  ${table_id}.${field.relation.fields} = ${currentTable}.${field.relation.references}`;
            } else {
                link = graph.getLink(currentTable, table_id);
                if (link) {
                    let field = link.data.field;
                    sqlStatement += ` JOIN ${table_id} ON  ${table_id}.${field.relation.references} = ${currentTable}.${field.relation.fields}`;
                } else {
                    throw new Error(`Link not found between ${table_id} and ${currentTable}`);
                }
            }

            currentTable = table_id;
        });



        return sqlStatement.trim();
    }

    const pathFinderInstance = pathFinder.aStar(graph);
    const shortestPath = pathFinderInstance.find(endTable, startTable);
    console.log("Shortest Path Nodes: ");
    shortestPath.forEach(node => {
        console.log(node.id);
        node.links.forEach(link => {
            console.log(link);
            console.log(link.data.field.relation)
        });
    });

    if (shortestPath.length === 0) {
        throw new Error(`Unreachable: No path found between ${startTable} and ${endTable}`);
    }

    const sqlStatement = buildSqlStatement(startTable, endTable, shortestPath, schema);
    console.log(`Path: ${sqlStatement}`);

}

module.exports = mountGraph;
