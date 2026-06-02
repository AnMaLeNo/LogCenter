from dataclasses import dataclass
import os


@dataclass(frozen=True)
class Settings:
    opensearch_host: str
    opensearch_port: int
    search_results_limit: int


def _get_positive_int_env(name: str, default: int) -> int:
    raw_value = os.getenv(name, str(default))

    try:
        value = int(raw_value)
    except ValueError as exc:
        raise RuntimeError(f"{name} must be an integer") from exc

    if value <= 0:
        raise RuntimeError(f"{name} must be greater than 0")

    return value


def get_settings() -> Settings:
    return Settings(
        opensearch_host=os.getenv("OPENSEARCH_HOST", "localhost"),
        opensearch_port=_get_positive_int_env("OPENSEARCH_PORT", 9200),
        search_results_limit=_get_positive_int_env("SEARCH_RESULTS_LIMIT", 100),
    )
