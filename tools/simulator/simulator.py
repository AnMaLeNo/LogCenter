import json
import os
import random
import time
import urllib.request
from datetime import datetime, timezone

TARGET_URL = os.getenv("TARGET_URL", "http://backend:8000/logs")
RATE = float(os.getenv("RATE", "1"))

SERVICES = ["api-gateway", "auth-service", "payment", "database", "worker"]
LEVELS = ["INFO", "INFO", "INFO", "DEBUG", "WARNING", "ERROR"]
MESSAGES = {
    "INFO": ["request handled", "user logged in", "cache hit", "job completed"],
    "DEBUG": ["entering handler", "query executed", "payload parsed"],
    "WARNING": ["slow response", "retrying connection", "cache miss"],
    "ERROR": ["unhandled exception", "connection refused", "request timeout"],
}


def make_log():
    level = random.choice(LEVELS)
    return {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "level": level,
        "message": random.choice(MESSAGES[level]),
        "service": random.choice(SERVICES),
    }


def send(log):
    data = json.dumps(log).encode()
    req = urllib.request.Request(
        TARGET_URL, data=data, headers={"Content-Type": "application/json"}
    )
    try:
        urllib.request.urlopen(req, timeout=5)
        print(f"{log['level']:<7} {log['service']:<12} {log['message']}", flush=True)
    except Exception as exc:
        print(f"send failed: {exc}", flush=True)


if __name__ == "__main__":
    print(f"simulator -> {TARGET_URL} at {RATE} log/s", flush=True)
    while True:
        send(make_log())
        time.sleep(1 / RATE if RATE > 0 else 1)
