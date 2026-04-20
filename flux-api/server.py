import base64, io, os, torch, asyncio
from fastapi import FastAPI, HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
from diffusers import FluxPipeline

app = FastAPI(docs_url=None, redoc_url=None, openapi_url=None)
lock = asyncio.Lock()
_bearer = HTTPBearer()
API_SECRET = os.environ.get("FLUX_API_SECRET", "")
if not API_SECRET:
    raise RuntimeError("FLUX_API_SECRET must be set")

def _verify(creds: HTTPAuthorizationCredentials = Security(_bearer)) -> None:
    if creds.credentials != API_SECRET:
        raise HTTPException(status_code=401, detail="Unauthorized")

MODEL_ID = os.environ.get("FLUX_MODEL_ID") or "black-forest-labs/FLUX.1-dev"
QUANT = (os.environ.get("FLUX_QUANT") or "bf16").lower()  # "bf16" | "int8" | "int4"
GUIDANCE_SCALE = float(os.environ.get("FLUX_GUIDANCE_SCALE") or "3.5")
MAX_SEQUENCE_LENGTH = int(os.environ.get("FLUX_MAX_SEQUENCE_LENGTH") or "512")

pipe = FluxPipeline.from_pretrained(
    MODEL_ID,
    torch_dtype=torch.bfloat16,
)

if QUANT in ("int8", "fp8"):
    from optimum.quanto import freeze, qint8, quantize
    quantize(pipe.transformer, weights=qint8)
    freeze(pipe.transformer)
    quantize(pipe.text_encoder_2, weights=qint8)
    freeze(pipe.text_encoder_2)
    pipe.to("cuda")
    print("[flux] INT8 quantization (~21GB VRAM)")
elif QUANT in ("int4", "fp4"):
    from optimum.quanto import freeze, qint4, quantize
    quantize(pipe.transformer, weights=qint4)
    freeze(pipe.transformer)
    pipe.to("cuda")
    print("[flux] INT4 quantization (~16GB VRAM)")
else:
    pipe.to("cuda")
    print("[flux] bfloat16 (~32GB VRAM)")
pipe.vae.enable_slicing()
pipe.vae.enable_tiling()


class Req(BaseModel):
    prompt: str
    width: int = Field(default=1024, ge=64, le=2048, multiple_of=8)
    height: int = Field(default=1024, ge=64, le=2048, multiple_of=8)
    steps: int = Field(default=4, ge=1, le=50)


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/generate", dependencies=[Security(_verify)])
async def generate(req: Req):
    async with lock:
        image = pipe(
            req.prompt,
            num_inference_steps=req.steps,
            guidance_scale=GUIDANCE_SCALE,
            max_sequence_length=MAX_SEQUENCE_LENGTH,
            width=req.width,
            height=req.height,
        ).images[0]
    buf = io.BytesIO()
    image.save(buf, format="PNG")
    return {"b64_json": base64.b64encode(buf.getvalue()).decode()}
