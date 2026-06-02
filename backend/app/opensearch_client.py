from datetime import datetime
from functools import lru_cache

from opensearchpy import OpenSearch
from opensearchpy.exceptions import RequestError

from app.config import get_settings


LOG_INDEX_PATTERN = "logs-*"

LOG_INDEX_BODY = {
    "settings": {
        "index": {
            "number_of_shards": 1,
            "number_of_replicas": 0,
        }
    },
    "mappings": {
        "properties": {
            "timestamp": {
                "type": "date",
                "format": "strict_date_optional_time||epoch_millis",
            },
            "level": {"type": "keyword"},
            "message": {"type": "text"},
            "service": {"type": "keyword"},
        }
    },
}


def build_log_index_name(timestamp: datetime) -> str:
    return f"logs-{timestamp:%Y.%m.%d}"


@lru_cache
def get_opensearch_client() -> OpenSearch:
    settings = get_settings()

    return OpenSearch(
        hosts=[
            {
                "host": settings.opensearch_host,
                "port": settings.opensearch_port,
            }
        ],
        use_ssl=False,
        verify_certs=False,
        ssl_show_warn=False,
    )


def ensure_log_index(client: OpenSearch, index_name: str) -> None:
    if client.indices.exists(index=index_name):
        return

    try:
        client.indices.create(index=index_name, body=LOG_INDEX_BODY)
    except RequestError as exc:
        if exc.error == "resource_already_exists_exception":
            return
        raise
