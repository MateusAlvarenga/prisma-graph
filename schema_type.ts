interface TableSchema {
    name: string;
    fields: FieldSchema[];
}

interface FieldSchema {
    name: string;
    type: FieldType;
    relation?: {
        fields: string;
        references: string;
    };
}

type FieldType = "Int" | "Decimal" | "String" | "action_instance";
