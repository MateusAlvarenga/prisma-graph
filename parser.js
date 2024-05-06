const fs = require('fs');

function parser() {
    const schemaPull = fs.readFileSync('./prisma/schema.prisma', 'utf-8');

    const modelRegex = /model (\w+) {(.*?)}/gs;
    const fieldRegex = /fields: \[(.*?)\]/;
    const referencesRegex = /references: \[(.*?)\]/;
    const models = [];
    const knownTypes = ['Int', 'String', 'Boolean', 'DateTime', 'Decimal', 'Float', 'Bytes', 'BigInt'];

    let match;
    while ((match = modelRegex.exec(schemaPull)) !== null) {
        const modelName = match[1];
        const modelFields = match[2].trim().split('\n').map(field => {
            let [name, type, ...attributes] = field.trim().split(/\s+/);


            type = type?.replace(/[\[\]?]/g, '');

            if (!knownTypes.includes(type) && field.includes('@relation')) {
                let fields = field.match(fieldRegex);
                let references = field.match(referencesRegex);

                if (!fields || field.name === '' || (field.name && field.name.startsWith('@')) || !references) {
                    return null;
                }

                let relation = {
                    fields: fields[1],
                    references: references[1]
                };


                return { name, type, relation };
            } if (attributes.some((e) => "@id" === e)) {
                return { name, type, "primaryKey": true }
            } else {
                return { name, type };
            }

        }).filter(field => field != null)

        models.push({ name: modelName, fields: modelFields });
    }

    fs.writeFileSync('schema.json', JSON.stringify(models, null, 2));

    return "Schema parsed successfully! \n\nSchema saved in schema.json file. \n";
}

module.exports = parser;