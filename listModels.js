const schema_path = './schema.json';
const fs = require('fs');

function listModels() {

    const schema = fs.readFileSync(schema_path, 'utf-8');
    const schema_json = JSON.parse(schema);
    const models = schema_json.map(model => model.name);

    return models;
}

function searchModel(name) {

    const schema = fs.readFileSync(schema_path, 'utf-8');
    const schema_json = JSON.parse(schema);

    const model = schema_json.find(model => model.name === name);

    if (!model) {
        console.log(`Model ${name} not found in schema`);
        return;
    }

    return model;
}

module.exports = { listModels, searchModel }