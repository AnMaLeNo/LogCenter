from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


class LogLevel(str, Enum):
    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"
    DEBUG = "DEBUG"


class LogCreate(BaseModel):
    timestamp: datetime
    level: LogLevel
    message: str = Field(..., min_length=1)
    service: str = Field(..., min_length=1)

    def to_opensearch_document(self) -> dict[str, str]:
        return {
            "timestamp": self.timestamp.isoformat(),
            "level": self.level.value,
            "message": self.message,
            "service": self.service,
        }


class LogRead(BaseModel):
    id: str
    timestamp: datetime
    level: LogLevel
    message: str
    service: str
