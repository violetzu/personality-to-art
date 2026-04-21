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

# schnell 與 dev 差異：
#   dev     guidance_scale=3.5  max_seq=512  steps=20~28  需 HF_TOKEN
#   schnell guidance_scale=0    max_seq=256  steps=1~4    公開模型
IS_SCHNELL = "schnell" in MODEL_ID.lower()

# FLUX_QUANT 設定參考：
#
# 架構          代表型號              fp16  bf16  int8  建議設定
# -------       ----------------     ----  ----  ----  --------
# Pascal        GTX 10xx             ✓     ✗     ✗     fp16
# Turing        RTX 20xx, Quadro RTX ✓     ✗     ✓     fp16
# Ampere        RTX 30xx, A100       ✓     ✓     ✓     bf16
# Ada Lovelace  RTX 40xx             ✓     ✓     ✓     bf16
#
# VRAM 需求（FLUX.1-dev 完整模型）：
#   bf16   ~32GB   全精度，Ampere+ 最佳
#   fp16   ~32GB   全精度，Turing 適用
#   int8   ~21GB   weights int8，activations bf16
#   fp16a8 ~18GB   weights+activations int8，fp16 dtype，Turing+
#   int4   ~16GB   最省，品質略降
#
# FLUX_QUANT: bf16 | fp16 | int8 | fp8 | int4 | fp4 | fp16a8
QUANT = (os.environ.get("FLUX_QUANT") or "bf16").lower()

_default_guidance = "0" if IS_SCHNELL else "3.5"
_default_seq_len  = "256" if IS_SCHNELL else "512"

GUIDANCE_SCALE      = float(os.environ.get("FLUX_GUIDANCE_SCALE") or _default_guidance)
MAX_SEQUENCE_LENGTH = int(os.environ.get("FLUX_MAX_SEQUENCE_LENGTH") or _default_seq_len)

_dtype = torch.bfloat16 if QUANT in ("bf16", "int8", "fp8", "int4", "fp4") else torch.float16

pipe = FluxPipeline.from_pretrained(
    MODEL_ID,
    torch_dtype=_dtype,
)

if QUANT in ("int8", "fp8"):
    from optimum.quanto import freeze, qint8, quantize
    quantize(pipe.transformer, weights=qint8)
    freeze(pipe.transformer)
    quantize(pipe.text_encoder_2, weights=qint8)
    freeze(pipe.text_encoder_2)
    pipe.to("cuda")
    print("[flux] INT8 quantization (~21GB VRAM)")
elif QUANT == "fp16a8":
    from optimum.quanto import freeze, qint8, quantize
    quantize(pipe.transformer, weights=qint8, activations=qint8)
    freeze(pipe.transformer)
    quantize(pipe.text_encoder_2, weights=qint8, activations=qint8)
    freeze(pipe.text_encoder_2)
    pipe.to("cuda")
    print("[flux] fp16 + INT8 weights & activations (~18GB VRAM)")
elif QUANT in ("int4", "fp4"):
    from optimum.quanto import freeze, qint4, quantize
    quantize(pipe.transformer, weights=qint4)
    freeze(pipe.transformer)
    pipe.to("cuda")
    print("[flux] INT4 quantization (~16GB VRAM)")
elif QUANT == "fp16":
    pipe.to("cuda")
    print("[flux] float16 (~32GB VRAM)")
else:
    pipe.to("cuda")
    print("[flux] bfloat16 (~32GB VRAM)")
pipe.vae.enable_slicing()
pipe.vae.enable_tiling()


DEFAULT_STEPS = 4 if IS_SCHNELL else 20


class Req(BaseModel):
    prompt: str
    width: int = Field(default=1024, ge=64, le=2048, multiple_of=8)
    height: int = Field(default=1024, ge=64, le=2048, multiple_of=8)
    steps: int = Field(default=DEFAULT_STEPS, ge=1, le=50)


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
