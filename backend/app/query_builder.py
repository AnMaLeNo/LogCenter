from app.models import LogLevel


def build_log_query(
    q: str | None,
    level: list[LogLevel] | None,
    service: str | None,
) -> dict:
    must = []
    filters = []

    if q is not None:
        must.append({"match": {"message": q}})

    if level:
        filters.append({"terms": {"level": [item.value for item in level]}})

    if service is not None:
        filters.append({"term": {"service": service}})

    if not must and not filters:
        return {"match_all": {}}

    bool_query = {}

    if must:
        bool_query["must"] = must

    if filters:
        bool_query["filter"] = filters

    return {"bool": bool_query}
