FROM pytorch/pytorch:2.6.0-cuda12.4-cudnn9-devel

WORKDIR /app

RUN pip install --no-cache-dir \
    fastapi uvicorn \
    diffusers transformers accelerate \
    sentencepiece protobuf \
    optimum-quanto

RUN useradd -m -u 1001 appuser && mkdir -p /cache/huggingface && chown -R appuser /app /cache

COPY --chown=appuser server.py .

ENV HF_HOME=/cache/huggingface

USER appuser

EXPOSE 8000
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000"]
