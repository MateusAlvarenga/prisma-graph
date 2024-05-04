const fs = require('fs');

// Read the output of prisma db pull --print from a file
const schemaPull = fs.readFileSync('./prisma/schema.prisma', 'utf-8');

// Regular expression to match model definitions
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
        //const unique = attributes.includes('@unique');
        //const references = attributes.find(attr => attr.startsWith('@relation'))?.split('(')[1]?.split(')')[0].replace(/[\[\]]/g, '');
        //return { name, type, attributes, unique, references };


        type = type?.replace(/[\[\]?]/g, '');

        if (!knownTypes.includes(type) && field.includes('@relation')) {
            let fields = field.match(fieldRegex);
            let references = field.match(referencesRegex);
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

    }).filter(field => field.name !== '' && !field.name.startsWith('@'));

    //   console.log(`Model: ${modelName}`);
    //   console.log(`Fields:`);
    //   modelFields.forEach(field => {
    //     console.log(`  ${field.name}: ${field.type} ${field.attributes.join(' ')}${field.unique ? ' @unique' : ''}${field.references ? ` @references(${field.references})` : ''}`);
    //   });
    //   console.log();
    models.push({ name: modelName, fields: modelFields });
}

//save the schema to a file
fs.writeFileSync('schema.json', JSON.stringify(models, null, 2));