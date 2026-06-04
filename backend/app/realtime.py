import asyncio

from fastapi import WebSocket
from opensearchpy import OpenSearch
from opensearchpy.exceptions import OpenSearchException

PERCOLATOR_INDEX = "log-subscriptions"

PERCOLATOR_INDEX_BODY = {
    "mappings": {
        "properties": {
            "timestamp": {
                "type": "date",
                "format": "strict_date_optional_time",
            },
            "level": {"type": "keyword"},
            "message": {"type": "text"},
            "service": {"type": "keyword"},
            "query": {"type": "percolator"},
        }
    }
}


def ensure_percolator_index(client: OpenSearch) -> None:
    if client.indices.exists(index=PERCOLATOR_INDEX):
        return
    try:
        client.indices.create(index=PERCOLATOR_INDEX, body=PERCOLATOR_INDEX_BODY)
    except OpenSearchException:
        if not client.indices.exists(index=PERCOLATOR_INDEX):
            raise


def store_subscription(client: OpenSearch, client_id: str, query: dict) -> None:
    client.index(
        index=PERCOLATOR_INDEX,
        id=client_id,
        body={"query": query},
        refresh=True,
    )


def remove_subscription(client: OpenSearch, client_id: str) -> None:
    try:
        client.delete(index=PERCOLATOR_INDEX, id=client_id, refresh=True)
    except OpenSearchException:
        pass


def matching_subscribers(client: OpenSearch, document: dict) -> list[str]:
    body = {
        "query": {
            "percolate": {"field": "query", "document": document},
        },
        "_source": False,
        "size": 10_000,
    }
    result = client.search(index=PERCOLATOR_INDEX, body=body)
    return [hit["_id"] for hit in result["hits"]["hits"]]


class ConnectionManager:
    def __init__(self) -> None:
        self._connections: dict[str, WebSocket] = {}
        self._lock = asyncio.Lock()

    async def add(self, client_id: str, websocket: WebSocket) -> None:
        async with self._lock:
            self._connections[client_id] = websocket

    async def remove(self, client_id: str) -> None:
        async with self._lock:
            self._connections.pop(client_id, None)

    async def send(self, client_id: str, payload: dict) -> None:
        async with self._lock:
            websocket = self._connections.get(client_id)
        if websocket is None:
            return
        try:
            await websocket.send_json(payload)
        except Exception:
            await self.remove(client_id)
