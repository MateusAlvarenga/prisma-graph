from sqlalchemy import create_engine
from sqlalchemy import inspect
from dotenv import load_dotenv
import pymysql
import enum
import json
import os


class FieldType(enum.Enum):
    INT = "Int"
    DECIMAL = "Decimal"
    STRING = "String"
    ACTION_INSTANCE = "action_instance"


def is_foreign_key(column, foreign_keys):
    for fk in foreign_keys:
        if column["name"] in fk["constrained_columns"]:
            return True
    return False


def get_foreign_key(column, foreign_keys):
    for fk in foreign_keys:
        if column["name"] in fk["constrained_columns"]:
            return fk
    return None


def build_json_schema(columns, table_name, inspector):
    schema = {
        "name": table_name,
        "fields": []
    }

    foreign_keys = inspector.get_foreign_keys(table_name)

    for column in columns:
        field_schema = {
            "name": column["name"],
            "type": str(column["type"]).upper(),
        }
        if is_foreign_key(column, foreign_keys):

            fk = get_foreign_key(column, foreign_keys)

            field_schema["type"] = fk["referred_table"]

            field_schema["relation"] = {
                "fields": column["name"],
                "references": inspector.get_foreign_keys(table_name)[0]["referred_columns"][0]
            }
        schema["fields"].append(field_schema)
    return schema


def introspect_all_tables(engine):
    inspector = inspect(engine)
    content = []
    for table_name in inspector.get_table_names():
        columns = inspector.get_columns(table_name)
        json_schema = build_json_schema(columns, table_name, inspector)
        content.append(json_schema)

    with open("schema2.json", "w") as outfile:
        json.dump(content, outfile, indent=4)

    print("JSON schema for all tables saved to schema.json")


load_dotenv()
database_url = os.environ["DATABASE_URL"]
engine = create_engine(database_url)

introspect_all_tables(engine)
