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
from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel

from seed_data import PAGES, PRODUCTS, POSTS
from email_service import notify_new_inquiry

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
    asyncio.create_task(notify_new_inquiry(doc))
    return {"message": "Inquiry received", "id": doc["id"]}


@api.get("/sitemap.xml")
async def sitemap():
    base = SITE_URL
    static_paths = ["", "/about", "/contact", "/products", "/blog"]
    products = await db.products.find({}, {"_id": 0, "slug": 1, "updated_at": 1}).to_list(500)
    posts = await db.posts.find({"published": True}, {"_id": 0, "slug": 1, "updated_at": 1}).to_list(500)
    urls = [f"<url><loc>{base}{p}</loc></url>" for p in static_paths]
    urls += [f"<url><loc>{base}/products/{p['slug']}</loc></url>" for p in products]
    urls += [f"<url><loc>{base}/blog/{p['slug']}</loc></url>" for p in posts]
    xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + "".join(urls) + "</urlset>"
    return Response(content=xml, media_type="application/xml")


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


app.include_router(api)

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


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
