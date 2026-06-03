from typing import Annotated

from fastapi import Depends, FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from opensearchpy import OpenSearch
from opensearchpy.exceptions import OpenSearchException

from app.config import Settings, get_settings
from app.models import LogCreate, LogLevel, LogRead
from app.opensearch_client import (
    LOG_INDEX_PATTERN,
    build_log_index_name,
    ensure_log_index,
    get_opensearch_client,
)


ClientDep = Annotated[OpenSearch, Depends(get_opensearch_client)]
SettingsDep = Annotated[Settings, Depends(get_settings)]
NonEmptyQueryString = Annotated[str | None, Query(min_length=1)]
LevelQuery = Annotated[list[LogLevel] | None, Query()]

app = FastAPI(title="LogCenter API")
settings = get_settings()

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(settings.cors_origins),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/logs", response_model=LogRead, status_code=status.HTTP_201_CREATED)
def create_log(log: LogCreate, client: ClientDep) -> LogRead:
    index_name = build_log_index_name(log.timestamp)
    document = log.to_opensearch_document()

    try:
        ensure_log_index(client, index_name)
        result = client.index(index=index_name, body=document, refresh=False)
    except OpenSearchException as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="OpenSearch is unavailable",
        ) from exc

    return LogRead(id=result["_id"], **document)


@app.get("/logs/search", response_model=list[LogRead])
def search_logs(
    client: ClientDep,
    settings: SettingsDep,
    q: NonEmptyQueryString = None,
    level: LevelQuery = None,
    service: NonEmptyQueryString = None,
) -> list[LogRead]:
    query = _build_search_query(q=q, level=level, service=service)

    body = {
        "query": query,
        "sort": [{"timestamp": {"order": "desc"}}],
        "size": settings.search_results_limit,
    }

    try:
        result = client.search(
            index=LOG_INDEX_PATTERN,
            body=body,
            ignore_unavailable=True,
            allow_no_indices=True,
        )
    except OpenSearchException as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="OpenSearch is unavailable",
        ) from exc

    return [
        LogRead(id=hit["_id"], **hit["_source"])
        for hit in result["hits"]["hits"]
    ]


def _build_search_query(
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
