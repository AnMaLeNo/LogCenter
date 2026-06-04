import uuid
from contextlib import asynccontextmanager
from typing import Annotated

from fastapi import (
    Depends,
    FastAPI,
    HTTPException,
    Query,
    WebSocket,
    WebSocketDisconnect,
    status,
)
from fastapi.middleware.cors import CORSMiddleware
from opensearchpy import OpenSearch
from opensearchpy.exceptions import OpenSearchException
from pydantic import ValidationError

from app.config import Settings, get_settings
from app.models import LogCreate, LogLevel, LogRead, SubscriptionFilters
from app.opensearch_client import (
    LOG_INDEX_PATTERN,
    build_log_index_name,
    ensure_log_index,
    get_opensearch_client,
)
from app.query_builder import build_log_query
from app.realtime import (
    ConnectionManager,
    ensure_percolator_index,
    matching_subscribers,
    remove_subscription,
    store_subscription,
)

ClientDep = Annotated[OpenSearch, Depends(get_opensearch_client)]
SettingsDep = Annotated[Settings, Depends(get_settings)]
NonEmptyQueryString = Annotated[str | None, Query(min_length=1)]
LevelQuery = Annotated[list[LogLevel] | None, Query()]

manager = ConnectionManager()


@asynccontextmanager
async def lifespan(app: FastAPI):
    ensure_percolator_index(get_opensearch_client())
    yield


app = FastAPI(title="LogCenter API", lifespan=lifespan)
settings = get_settings()

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(settings.cors_origins),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/logs", response_model=LogRead, status_code=status.HTTP_201_CREATED)
async def create_log(log: LogCreate, client: ClientDep) -> LogRead:
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

    created = LogRead(id=result["_id"], **document)
    await _broadcast_log(client, created)
    return created


@app.get("/logs/search", response_model=list[LogRead])
def search_logs(
    client: ClientDep,
    settings: SettingsDep,
    q: NonEmptyQueryString = None,
    level: LevelQuery = None,
    service: NonEmptyQueryString = None,
) -> list[LogRead]:
    query = build_log_query(q=q, level=level, service=service)

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


@app.websocket("/ws/logs")
async def logs_stream(
    websocket: WebSocket, client: ClientDep, settings: SettingsDep
) -> None:
    await websocket.accept()
    await websocket.send_json(
        {"type": "config", "limit": settings.search_results_limit}
    )
    client_id = uuid.uuid4().hex
    await manager.add(client_id, websocket)

    try:
        while True:
            raw = await websocket.receive_json()
            try:
                filters = SubscriptionFilters.model_validate(raw)
            except ValidationError:
                continue

            query = build_log_query(
                q=filters.q, level=filters.level, service=filters.service
            )
            try:
                store_subscription(client, client_id, query)
            except OpenSearchException:
                continue
    except WebSocketDisconnect:
        pass
    finally:
        await manager.remove(client_id)
        remove_subscription(client, client_id)


async def _broadcast_log(client: OpenSearch, log: LogRead) -> None:
    document = {
        "timestamp": log.timestamp.isoformat(),
        "level": log.level.value,
        "message": log.message,
        "service": log.service,
    }
    try:
        subscribers = matching_subscribers(client, document)
    except OpenSearchException:
        return

    payload = log.model_dump(mode="json")
    for client_id in subscribers:
        await manager.send(client_id, payload)
