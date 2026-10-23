# Sangamora crowd-marshal service — deterministic, zero-key, offline-safe.
FROM python:3.12-slim
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /srv

# 1) deps first (cached layer), 2) pure `app/` code.
COPY requirements.txt ./
RUN python -m pip install --no-cache-dir -r requirements.txt
COPY app ./app

EXPOSE 7332

# python:3.12-slim ships no curl — urllib keeps the image dependency-free
# (documented deviation from "healthcheck curl /healthz"; same wire request).
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD ["python", "-c", "import urllib.request; urllib.request.urlopen('http://127.0.0.1:7332/healthz', timeout=4).read()"]

CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7332"]
