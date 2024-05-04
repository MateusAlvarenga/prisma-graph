const createGraph = require('ngraph.graph');
const path = require('ngraph.path');

// Create a graph
const graph = createGraph();
graph.addLink('A', 'B');
graph.addLink('B', 'C');
graph.addLink('C', 'D');

// Create a path finder
const pathFinder = path.aStar(graph);

// Find the path between two nodes
const startNode = 'D';
const endNode = 'A';
const foundPath = pathFinder.find(startNode, endNode);

// Output the path
if (foundPath) {
    console.log('Path found:', foundPath.map(node => node.id).join(' -> '));
} else {
    console.log('No path found');
}
