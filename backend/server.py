from dotenv import load_dotenv
load_dotenv()

import os
import re
import uuid
import asyncio
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Any, Dict

import bcrypt
import jwt
from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends, UploadFile, File
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel
from fastapi.staticfiles import StaticFiles

from fastapi.responses import PlainTextResponse, FileResponse

from seed_data import PAGES, PRODUCTS, POSTS
from email_service import notify_new_inquiry
from countries_data import COUNTRIES_INDEX, get_country_payload, get_supplier_payload, DEFAULT_KEYWORDS
from autoblog import generate_autoblog_post, autoblog_loop, DEFAULT_AUTOBLOG
from settings_service import get_display_settings, save_settings

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALG = "HS256"
ADMIN_EMAIL = os.environ.get('ADMIN_EMAIL', 'admin@murfyalam.com')
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'MurfyStone2026')
SITE_URL = os.environ.get('SITE_URL', '').rstrip('/')
FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:3000')

app = FastAPI(title="PT. Murfy Alam Indonesia — CMS API")
api = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def utcnow():
    return datetime.now(timezone.utc)


def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(pw: str, hashed: str) -> bool:
    return bcrypt.checkpw(pw.encode("utf-8"), hashed.encode("utf-8"))


def create_token(email: str) -> str:
    payload = {"email": email, "exp": utcnow() + timedelta(days=7)}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)


async def get_current_user(request: Request):
    token = request.cookies.get("access_token")
    if not token:
        h = request.headers.get("Authorization", "")
        if h.startswith("Bearer "):
            token = h[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    user = await db.users.find_one({"email": payload.get("email")}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


def slugify(text: str) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return s or uuid.uuid4().hex[:8]


# ---------- Models ----------

class LoginIn(BaseModel):
    email: str
    password: str


class PageIn(BaseModel):
    content: Dict[str, Any]


class ProductIn(BaseModel):
    name: str
    slug: Optional[str] = None
    category: str = "Pool Tiles"
    short_desc: str = ""
    description: str = ""
    image: str = ""
    gallery: List[str] = []
    finishes: List[str] = []
    sizes: List[str] = []
    applications: List[str] = []
    featured: bool = False
    seo_title: str = ""
    seo_desc: str = ""


class PostIn(BaseModel):
    title: str
    slug: Optional[str] = None
    excerpt: str = ""
    content: str = ""
    image: str = ""
    author: str = "PT. Murfy Alam Indonesia"
    tags: List[str] = []
    published: bool = True
    seo_title: str = ""
    seo_desc: str = ""


class InquiryIn(BaseModel):
    name: str
    email: str
    company: str = ""
    country: str = ""
    product: str = ""
    message: str


class InquiryStatusIn(BaseModel):
    status: str


# ---------- Health ----------

@api.get("/")
async def root():
    return {"message": "PT. Murfy Alam Indonesia CMS API"}


@api.get("/health")
async def health():
    return {"status": "ok"}


# ---------- Auth ----------

@api.post("/auth/login")
async def login(body: LoginIn, response: Response):
    email = body.email.lower().strip()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_token(email)
    response.set_cookie("access_token", token, httponly=True, secure=True, samesite="none", max_age=7 * 24 * 3600, path="/")
    return {"email": user["email"], "name": user.get("name", "Admin"), "role": user.get("role", "admin")}


@api.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    return {"message": "Logged out"}


@api.get("/auth/me")
async def me(user=Depends(get_current_user)):
    return user


# ---------- Public content ----------

@api.get("/pages/{slug}")
async def get_page(slug: str):
    page = await db.pages.find_one({"slug": slug}, {"_id": 0})
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    return page


@api.get("/products")
async def list_products(featured: Optional[bool] = None):
    q = {}
    if featured is True:
        q["featured"] = True
    items = await db.products.find(q, {"_id": 0}).sort("name", 1).to_list(500)
    return items


@api.get("/products/{slug}")
async def get_product(slug: str):
    item = await db.products.find_one({"slug": slug}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Product not found")
    return item


@api.get("/posts")
async def list_posts():
    items = await db.posts.find({"published": True}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return items


@api.get("/posts/{slug}")
async def get_post(slug: str):
    item = await db.posts.find_one({"slug": slug, "published": True}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Post not found")
    return item


@api.post("/inquiries")
async def create_inquiry(body: InquiryIn):
    doc = body.model_dump()
    doc.update({"id": str(uuid.uuid4()), "status": "new", "created_at": utcnow().isoformat()})
    await db.inquiries.insert_one(doc)
    doc.pop("_id", None)
    asyncio.create_task(notify_new_inquiry(db, doc))
    return {"message": "Inquiry received", "id": doc["id"]}


@api.get("/countries")
async def list_countries():
    return COUNTRIES_INDEX


@api.get("/countries/{slug}")
async def get_country(slug: str):
    keywords = await db.keywords.find({}, {"_id": 0, "name": 1, "slug": 1}).sort("name", 1).to_list(200)
    payload = get_country_payload(slug, keywords)
    if not payload:
        raise HTTPException(status_code=404, detail="Country not found")
    return payload


@api.get("/keywords")
async def list_keywords():
    return await db.keywords.find({}, {"_id": 0}).sort("name", 1).to_list(200)


@api.get("/supplier/{kw_slug}/{country_slug}")
async def get_supplier(kw_slug: str, country_slug: str):
    kw = await db.keywords.find_one({"slug": kw_slug}, {"_id": 0})
    if not kw:
        raise HTTPException(status_code=404, detail="Keyword not found")
    payload = get_supplier_payload(kw, country_slug)
    if not payload:
        raise HTTPException(status_code=404, detail="Country not found")
    payload["other_keywords"] = await db.keywords.find(
        {"slug": {"$ne": kw_slug}}, {"_id": 0, "name": 1, "slug": 1}).sort("name", 1).to_list(50)
    return payload


@api.get("/sitemap.xml")
async def sitemap():
    base = SITE_URL
    today = utcnow().date().isoformat()
    static_paths = ["", "/about", "/contact", "/products", "/blog", "/export"]
    products = await db.products.find({}, {"_id": 0, "slug": 1, "updated_at": 1}).to_list(500)
    posts = await db.posts.find({"published": True}, {"_id": 0, "slug": 1, "updated_at": 1}).to_list(500)

    def lm(doc):
        return f"<lastmod>{str(doc.get('updated_at', today))[:10]}</lastmod>"

    urls = [f"<url><loc>{base}{p}</loc><lastmod>{today}</lastmod></url>" for p in static_paths]
    urls += [f"<url><loc>{base}/products/{p['slug']}</loc>{lm(p)}</url>" for p in products]
    urls += [f"<url><loc>{base}/blog/{p['slug']}</loc>{lm(p)}</url>" for p in posts]
    urls += [f"<url><loc>{base}/export/{c['slug']}</loc></url>" for c in COUNTRIES_INDEX]
    keywords = await db.keywords.find({}, {"_id": 0, "slug": 1}).to_list(200)
    urls += [f"<url><loc>{base}/supplier/{k['slug']}/{c['slug']}</loc></url>" for k in keywords for c in COUNTRIES_INDEX]
    xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + "".join(urls) + "</urlset>"
    return Response(content=xml, media_type="application/xml")


@api.get("/llms.txt", response_class=PlainTextResponse)
async def llms_txt():
    products = await db.products.find({}, {"_id": 0, "name": 1, "slug": 1, "short_desc": 1}).to_list(500)
    posts = await db.posts.find({"published": True}, {"_id": 0, "title": 1, "slug": 1, "excerpt": 1}).sort("created_at", -1).to_list(50)
    lines = [
        "# PT. Murfy Alam Indonesia",
        "",
        "> Factory-direct exporter of Sukabumi Green Stone (Pedra Bali), black lava stone and andesite from Sukabumi, West Java, Indonesia. Pool tiles, coping, mosaics, wall cladding and paving shipped worldwide to importers, pool builders, architects and resort developers.",
        "",
        f"Contact: giat@zeofa.com | WhatsApp +62 851-4156-7350 | Sukabumi, West Java, Indonesia",
        f"Full machine-readable content: {SITE_URL}/api/llms-full.txt",
        "",
        "## Pages",
        f"- [Home]({SITE_URL}/): Company overview, products, export process, FAQ",
        f"- [About Us]({SITE_URL}/about): Story, quarry, certifications",
        f"- [Products]({SITE_URL}/products): Export-grade natural stone catalogue",
        f"- [Export Markets]({SITE_URL}/export): Country-by-country shipping and supply information",
        f"- [Journal]({SITE_URL}/blog): Technical guides and industry articles",
        f"- [Contact]({SITE_URL}/contact): Quotation requests, replies within 24 hours",
        "",
        "## Products",
    ]
    lines += [f"- [{p['name']}]({SITE_URL}/products/{p['slug']}): {p.get('short_desc', '')}" for p in products]
    lines += ["", "## Articles"]
    lines += [f"- [{p['title']}]({SITE_URL}/blog/{p['slug']}): {p.get('excerpt', '')}" for p in posts]
    lines += ["", "## Export Markets",
              f"We ship to {len(COUNTRIES_INDEX)} countries. Each market page covers ports, transit times, MOQ and FAQ:"]
    lines += [f"- [{c['name']}]({SITE_URL}/export/{c['slug']})" for c in COUNTRIES_INDEX]
    return "\n".join(lines)


@api.get("/llms-full.txt", response_class=PlainTextResponse)
async def llms_full_txt():
    out = [
        "# PT. Murfy Alam Indonesia — Full Content",
        "",
        "Factory-direct exporter of Sukabumi Green Stone (Pedra Bali), black lava stone and andesite from Sukabumi, West Java, Indonesia.",
        "Contact: giat@zeofa.com | WhatsApp +62 851-4156-7350 | Sukabumi, West Java, Indonesia",
        "",
    ]

    def walk(obj, depth=0):
        if isinstance(obj, dict):
            for k, v in obj.items():
                if k in ("seo", "image", "images", "gallery"):
                    continue
                walk(v, depth)
        elif isinstance(obj, list):
            for v in obj:
                walk(v, depth)
        elif isinstance(obj, str) and len(obj) > 2 and not obj.startswith("http"):
            out.append(obj)

    async for page in db.pages.find({}, {"_id": 0}):
        out.append(f"\n## Page: {page['slug']}\n")
        walk(page.get("content", {}))
    async for p in db.products.find({}, {"_id": 0}):
        out.append(f"\n## Product: {p['name']} ({SITE_URL}/products/{p['slug']})\n")
        out.append(p.get("description", ""))
    async for p in db.posts.find({"published": True}, {"_id": 0}):
        out.append(f"\n## Article: {p['title']} ({SITE_URL}/blog/{p['slug']})\n")
        out.append(p.get("content", ""))
    out.append(f"\n## Export Markets ({len(COUNTRIES_INDEX)} countries)\n")
    for c in COUNTRIES_INDEX:
        out.append(f"- {c['name']} ({c['region_label']}): shipping to {c['port']}, details at {SITE_URL}/export/{c['slug']}")
    return "\n".join(out)


# ---------- Admin File Upload ----------

@api.post("/admin/upload/image")
async def upload_image(file: UploadFile = File(...), user=Depends(get_current_user)):
    """Upload image and return URL path"""
    ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
    MAX_SIZE = 10 * 1024 * 1024  # 10MB

    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="Only JPEG, PNG, WebP, and GIF images allowed")

    contents = await file.read()
    if len(contents) > MAX_SIZE:
        raise HTTPException(status_code=400, detail="File too large (max 10MB)")

    filename = f"{uuid.uuid4().hex[:12]}-{file.filename}"
    filepath = os.path.join("uploads", filename)

    os.makedirs("uploads", exist_ok=True)
    with open(filepath, "wb") as f:
        f.write(contents)

    url = f"/uploads/{filename}"
    logger.info("Image uploaded: %s", url)
    return {"url": url, "filename": filename}


# ---------- Admin ----------

@api.get("/admin/stats")
async def admin_stats(user=Depends(get_current_user)):
    return {
        "products": await db.products.count_documents({}),
        "posts": await db.posts.count_documents({}),
        "inquiries_total": await db.inquiries.count_documents({}),
        "inquiries_new": await db.inquiries.count_documents({"status": "new"}),
    }


@api.put("/admin/pages/{slug}")
async def update_page(slug: str, body: PageIn, user=Depends(get_current_user)):
    if slug not in ("home", "about", "contact"):
        raise HTTPException(status_code=400, detail="Unknown page slug")
    await db.pages.update_one(
        {"slug": slug},
        {"$set": {"slug": slug, "content": body.content, "updated_at": utcnow().isoformat()}},
        upsert=True,
    )
    page = await db.pages.find_one({"slug": slug}, {"_id": 0})
    return page


@api.post("/admin/products")
async def create_product(body: ProductIn, user=Depends(get_current_user)):
    doc = body.model_dump()
    doc["slug"] = slugify(doc["slug"] or doc["name"])
    if await db.products.find_one({"slug": doc["slug"]}):
        raise HTTPException(status_code=409, detail="Slug already exists")
    doc.update({"id": str(uuid.uuid4()), "created_at": utcnow().isoformat(), "updated_at": utcnow().isoformat()})
    await db.products.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api.put("/admin/products/{pid}")
async def update_product(pid: str, body: ProductIn, user=Depends(get_current_user)):
    doc = body.model_dump()
    doc["slug"] = slugify(doc["slug"] or doc["name"])
    existing = await db.products.find_one({"slug": doc["slug"], "id": {"$ne": pid}})
    if existing:
        raise HTTPException(status_code=409, detail="Slug already exists")
    doc["updated_at"] = utcnow().isoformat()
    res = await db.products.update_one({"id": pid}, {"$set": doc})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return await db.products.find_one({"id": pid}, {"_id": 0})


@api.delete("/admin/products/{pid}")
async def delete_product(pid: str, user=Depends(get_current_user)):
    res = await db.products.delete_one({"id": pid})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Deleted"}


@api.post("/admin/posts")
async def create_post(body: PostIn, user=Depends(get_current_user)):
    doc = body.model_dump()
    doc["slug"] = slugify(doc["slug"] or doc["title"])
    if await db.posts.find_one({"slug": doc["slug"]}):
        raise HTTPException(status_code=409, detail="Slug already exists")
    doc.update({"id": str(uuid.uuid4()), "created_at": utcnow().isoformat(), "updated_at": utcnow().isoformat()})
    await db.posts.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api.put("/admin/posts/{pid}")
async def update_post(pid: str, body: PostIn, user=Depends(get_current_user)):
    doc = body.model_dump()
    doc["slug"] = slugify(doc["slug"] or doc["title"])
    existing = await db.posts.find_one({"slug": doc["slug"], "id": {"$ne": pid}})
    if existing:
        raise HTTPException(status_code=409, detail="Slug already exists")
    doc["updated_at"] = utcnow().isoformat()
    res = await db.posts.update_one({"id": pid}, {"$set": doc})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Post not found")
    return await db.posts.find_one({"id": pid}, {"_id": 0})


@api.delete("/admin/posts/{pid}")
async def delete_post(pid: str, user=Depends(get_current_user)):
    res = await db.posts.delete_one({"id": pid})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Post not found")
    return {"message": "Deleted"}


@api.get("/admin/inquiries")
async def list_inquiries(user=Depends(get_current_user)):
    return await db.inquiries.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)


@api.patch("/admin/inquiries/{iid}")
async def update_inquiry_status(iid: str, body: InquiryStatusIn, user=Depends(get_current_user)):
    res = await db.inquiries.update_one({"id": iid}, {"$set": {"status": body.status}})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Inquiry not found")
    return {"message": "Updated"}


@api.delete("/admin/inquiries/{iid}")
async def delete_inquiry(iid: str, user=Depends(get_current_user)):
    res = await db.inquiries.delete_one({"id": iid})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Inquiry not found")
    return {"message": "Deleted"}


@api.get("/admin/posts-all")
async def admin_posts(user=Depends(get_current_user)):
    return await db.posts.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)


class AutoblogIn(BaseModel):
    enabled: bool
    hour_utc: int = 2


class IntegrationSettingsIn(BaseModel):
    openai_api_key: Optional[str] = None
    anthropic_api_key: Optional[str] = None
    gemini_api_key: Optional[str] = None
    autoblog_openai_model: Optional[str] = None
    autoblog_anthropic_model: Optional[str] = None
    autoblog_gemini_model: Optional[str] = None
    smtp_host: Optional[str] = None
    smtp_port: Optional[int] = None
    smtp_user: Optional[str] = None
    smtp_password: Optional[str] = None
    smtp_use_tls: Optional[bool] = None
    email_from_address: Optional[str] = None
    email_from_name: Optional[str] = None
    email_reply_to: Optional[str] = None
    owner_email: Optional[str] = None


class KeywordIn(BaseModel):
    name: str
    slug: str = ""
    summary: str = ""


@api.post("/admin/keywords")
async def create_keyword(body: KeywordIn, user=Depends(get_current_user)):
    slug = slugify(body.slug or body.name)
    if await db.keywords.find_one({"slug": slug}):
        raise HTTPException(status_code=400, detail="Keyword slug already exists")
    doc = {"id": str(uuid.uuid4()), "name": body.name.strip(), "slug": slug,
           "summary": body.summary.strip(), "created_at": utcnow().isoformat()}
    await db.keywords.insert_one({**doc})
    doc.pop("_id", None)
    return doc


@api.put("/admin/keywords/{kid}")
async def update_keyword(kid: str, body: KeywordIn, user=Depends(get_current_user)):
    slug = slugify(body.slug or body.name)
    if await db.keywords.find_one({"slug": slug, "id": {"$ne": kid}}):
        raise HTTPException(status_code=400, detail="Keyword slug already exists")
    res = await db.keywords.update_one(
        {"id": kid}, {"$set": {"name": body.name.strip(), "slug": slug, "summary": body.summary.strip()}})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Keyword not found")
    return await db.keywords.find_one({"id": kid}, {"_id": 0})


@api.delete("/admin/keywords/{kid}")
async def delete_keyword(kid: str, user=Depends(get_current_user)):
    res = await db.keywords.delete_one({"id": kid})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Keyword not found")
    return {"message": "Deleted"}


@api.get("/admin/autoblog")
async def get_autoblog(user=Depends(get_current_user)):
    s = await db.settings.find_one({"key": "autoblog"}, {"_id": 0})
    return s or DEFAULT_AUTOBLOG


@api.put("/admin/autoblog")
async def put_autoblog(body: AutoblogIn, user=Depends(get_current_user)):
    await db.settings.update_one(
        {"key": "autoblog"},
        {"$set": {"enabled": body.enabled, "hour_utc": max(0, min(23, body.hour_utc))}},
        upsert=True,
    )
    return await db.settings.find_one({"key": "autoblog"}, {"_id": 0})


@api.post("/admin/autoblog/run")
async def run_autoblog(user=Depends(get_current_user)):
    try:
        return await generate_autoblog_post(db)
    except Exception as e:
        logger.error("Autoblog manual run failed: %s", e)
        raise HTTPException(status_code=500, detail=f"Article generation failed: {str(e)[:200]}")


@api.get("/admin/settings")
async def get_settings_endpoint(user=Depends(get_current_user)):
    return await get_display_settings(db)


@api.put("/admin/settings")
async def put_settings_endpoint(body: IntegrationSettingsIn, user=Depends(get_current_user)):
    await save_settings(db, body.model_dump(exclude_unset=True))
    return await get_display_settings(db)


app.include_router(api)

# Serve uploaded images
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await db.products.create_index("slug", unique=True)
    await db.posts.create_index("slug", unique=True)

    existing = await db.users.find_one({"email": ADMIN_EMAIL})
    if not existing:
        await db.users.insert_one({
            "id": str(uuid.uuid4()), "email": ADMIN_EMAIL, "name": "Administrator",
            "role": "admin", "password_hash": hash_password(ADMIN_PASSWORD),
            "created_at": utcnow().isoformat(),
        })
        logger.info("Admin user seeded: %s", ADMIN_EMAIL)
    elif not verify_password(ADMIN_PASSWORD, existing["password_hash"]):
        await db.users.update_one({"email": ADMIN_EMAIL}, {"$set": {"password_hash": hash_password(ADMIN_PASSWORD)}})

    if await db.pages.count_documents({}) == 0:
        for slug, content in PAGES.items():
            await db.pages.insert_one({"slug": slug, "content": content, "updated_at": utcnow().isoformat()})
        logger.info("Pages seeded")

    if await db.products.count_documents({}) == 0:
        for p in PRODUCTS:
            await db.products.insert_one({**p, "id": str(uuid.uuid4()), "created_at": utcnow().isoformat(), "updated_at": utcnow().isoformat()})
        logger.info("Products seeded")

    if await db.posts.count_documents({}) == 0:
        for p in POSTS:
            await db.posts.insert_one({**p, "id": str(uuid.uuid4()), "created_at": utcnow().isoformat(), "updated_at": utcnow().isoformat()})
        logger.info("Posts seeded")

    if not await db.settings.find_one({"key": "autoblog"}):
        await db.settings.insert_one(dict(DEFAULT_AUTOBLOG))
        logger.info("Autoblog settings seeded")
    asyncio.create_task(autoblog_loop(db))

    if await db.keywords.count_documents({}) == 0:
        for kwd in DEFAULT_KEYWORDS:
            await db.keywords.insert_one({**kwd, "slug": slugify(kwd["name"]), "id": str(uuid.uuid4()),
                                          "created_at": utcnow().isoformat()})
        logger.info("SEO keywords seeded")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()


# Serve the built React frontend (if present) for every non-API, non-upload path,
# with an SPA fallback to index.html so client-side routing works on refresh/deep links.
FRONTEND_BUILD_DIR = os.environ.get(
    "FRONTEND_BUILD_DIR", os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "frontend", "build")
)

if os.path.isdir(FRONTEND_BUILD_DIR):
    static_dir = os.path.join(FRONTEND_BUILD_DIR, "static")
    if os.path.isdir(static_dir):
        app.mount("/static", StaticFiles(directory=static_dir), name="frontend-static")

    _build_root = os.path.realpath(FRONTEND_BUILD_DIR)

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        candidate = os.path.realpath(os.path.join(_build_root, full_path))
        is_inside = candidate == _build_root or candidate.startswith(_build_root + os.sep)
        if full_path and is_inside and os.path.isfile(candidate):
            return FileResponse(candidate)
        return FileResponse(os.path.join(_build_root, "index.html"))
else:
    logger.warning("FRONTEND_BUILD_DIR not found (%s) — frontend will not be served by the API process.",
                    FRONTEND_BUILD_DIR)
