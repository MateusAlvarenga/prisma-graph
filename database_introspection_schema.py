from sqlalchemy import create_engine, inspect
import enum
import json


class FieldType(enum.Enum):
    INT = "Int"
    DECIMAL = "Decimal"
    STRING = "String"
    ACTION_INSTANCE = "action_instance"


def build_json_schema(columns):
    schema = {
        "name": table_name,
        "fields": []
    }
    for column in columns:
        field_schema = {
            "name": column["name"],
            "type": FieldType[column["type"].__name__].value,
        }
        if "foreign_keys" in column:
            field_schema["relation"] = {
                "fields": column["name"],
                "references": inspector.get_foreign_keys(table_name)[0]["referred_columns"][0]
            }
        schema["fields"].append(field_schema)
    return schema


def introspect_all_tables(engine):
    inspector = inspect(engine)
    for table_name in inspector.get_table_names():
        columns = inspector.get_columns(table_name)
        json_schema = build_json_schema(columns)
        with open(f"{table_name}.json", "w") as outfile:
            json.dump(json_schema, outfile, indent=4)
        print(f"JSON schema for table {table_name} saved to {table_name}.json")


introspect_all_tables(engine)
