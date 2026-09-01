"""Backend regression + new-feature tests for PT. Murfy Alam Indonesia CMS API."""
import re

import pytest
import requests

from conftest import BASE_URL


# ---------- Health / auth ----------
class TestHealthAndAuth:
    def test_health(self, api_client):
        r = api_client.get(f"{BASE_URL}/api/health")
        assert r.status_code == 200
        assert r.json() == {"status": "ok"}

    def test_login_sets_httponly_cookie(self, test_credentials):
        s = requests.Session()
        r = s.post(f"{BASE_URL}/api/auth/login", json=test_credentials)
        assert r.status_code == 200, r.text[:300]
        data = r.json()
        assert data["email"] == test_credentials["email"]
        assert data["role"] == "admin"
        set_cookie = r.headers.get("set-cookie", "")
        assert "access_token" in set_cookie
        assert "HttpOnly" in set_cookie
        assert "Secure" in set_cookie
        assert "access_token" in s.cookies

    def test_login_invalid_password(self, api_client, test_credentials):
        r = requests.post(f"{BASE_URL}/api/auth/login",
                          json={"email": test_credentials["email"], "password": "wrong-pass-123"})
        assert r.status_code == 401

    def test_me_requires_auth(self):
        r = requests.get(f"{BASE_URL}/api/auth/me")
        assert r.status_code == 401

    def test_me_authenticated(self, authenticated_client, test_credentials):
        r = authenticated_client.get(f"{BASE_URL}/api/auth/me")
        assert r.status_code == 200
        body = r.json()
        assert body["email"] == test_credentials["email"]
        assert "password_hash" not in body
        assert "_id" not in body

    def test_admin_endpoint_blocked_without_auth(self):
        for path in ["/api/admin/stats", "/api/admin/autoblog", "/api/admin/posts-all", "/api/admin/inquiries"]:
            r = requests.get(f"{BASE_URL}{path}")
            assert r.status_code == 401, f"{path} -> {r.status_code}"

    def test_cors_allows_credentials_for_frontend_origin(self, test_credentials):
        # Preflight is answered by the edge proxy in preview; assert on the actual request instead.
        r = requests.post(f"{BASE_URL}/api/auth/login", json=test_credentials,
                          headers={"Origin": BASE_URL})
        assert r.status_code == 200
        assert r.headers.get("access-control-allow-credentials") == "true"

    def test_brute_force_lockout(self, test_credentials):
        """Playbook expects lockout after 5 failed attempts."""
        codes = []
        for _ in range(6):
            r = requests.post(f"{BASE_URL}/api/auth/login",
                              json={"email": test_credentials["email"], "password": "bad-pw-xyz"})
            codes.append(r.status_code)
        assert 429 in codes or 423 in codes, f"No lockout observed, codes={codes}"


# ---------- Programmatic SEO country pages ----------
class TestCountries:
    def test_list_countries(self, api_client):
        r = api_client.get(f"{BASE_URL}/api/countries")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert len(data) == 192, f"expected 192 countries, got {len(data)}"
        slugs = set()
        for c in data:
            for key in ("name", "slug", "region_label", "port"):
                assert c.get(key), f"missing {key} in {c}"
            assert re.fullmatch(r"[a-z0-9-]+", c["slug"]), c["slug"]
            slugs.add(c["slug"])
        assert len(slugs) == len(data), "duplicate country slugs"
        assert "australia" in slugs and "germany" in slugs

    @pytest.mark.parametrize("slug", ["australia", "germany", "united-states"])
    def test_country_detail_payload(self, api_client, slug):
        r = api_client.get(f"{BASE_URL}/api/countries/{slug}")
        assert r.status_code == 200, r.text[:200]
        top = r.json()
        for key in ("name", "slug", "region_label", "port", "content", "related"):
            assert key in top, f"missing top-level '{key}' for {slug}"
        d = top["content"]
        for key in ("seo", "hero", "intro", "benefits", "logistics", "applications",
                    "process", "faq", "cta"):
            assert key in d, f"missing content.'{key}' key for {slug}"
        assert len(d["benefits"]) == 4
        assert len(d["process"]) == 5
        assert len(d["faq"]) == 5
        assert isinstance(top["related"], list) and len(top["related"]) >= 1
        for rel in top["related"]:
            assert rel.get("slug") and rel.get("name")
            assert rel["slug"] != slug
        assert d["seo"].get("title") and d["seo"].get("description")
        assert top["name"].lower() in d["seo"]["title"].lower()
        assert top["port"] in d["hero"]["body"] or top["port"] in " ".join(d["intro"])
        for f in d["faq"]:
            assert f.get("q") and f.get("a")
        assert d["cta"].get("title") or d["cta"].get("body")

    def test_country_404(self, api_client):
        r = api_client.get(f"{BASE_URL}/api/countries/nonexistent")
        assert r.status_code == 404


# ---------- AIO package: sitemap, llms.txt ----------
class TestAIO:
    def test_sitemap(self, api_client):
        r = api_client.get(f"{BASE_URL}/api/sitemap.xml")
        assert r.status_code == 200
        assert "xml" in r.headers.get("content-type", "")
        xml = r.text
        assert "<urlset" in xml
        assert "/export<" in xml or "/export</loc>" in xml
        countries = api_client.get(f"{BASE_URL}/api/countries").json()
        for c in countries[:5] + countries[-5:]:
            assert f"/export/{c['slug']}</loc>" in xml, f"missing export url for {c['slug']}"
        assert xml.count("<url>") >= len(countries) + 6
        assert "<lastmod>" in xml

    def test_sitemap_all_urls_have_lastmod(self, api_client):
        xml = api_client.get(f"{BASE_URL}/api/sitemap.xml").text
        blocks = re.findall(r"<url>(.*?)</url>", xml, flags=re.S)
        missing = [b for b in blocks if "<lastmod>" not in b]
        assert not missing, f"{len(missing)} sitemap urls missing <lastmod> (e.g. {missing[0][:120]})"

    def test_llms_txt(self, api_client):
        r = api_client.get(f"{BASE_URL}/api/llms.txt")
        assert r.status_code == 200
        assert r.headers.get("content-type", "").startswith("text/plain")
        t = r.text
        assert "# PT. Murfy Alam Indonesia" in t
        assert "## Products" in t and "## Articles" in t and "## Export Markets" in t
        assert "/export/australia" in t
        products = api_client.get(f"{BASE_URL}/api/products").json()
        assert f"/products/{products[0]['slug']}" in t
        posts = api_client.get(f"{BASE_URL}/api/posts").json()
        assert f"/blog/{posts[0]['slug']}" in t
        assert "We ship to 192 countries" in t

    def test_llms_full_txt(self, api_client):
        r = api_client.get(f"{BASE_URL}/api/llms-full.txt")
        assert r.status_code == 200
        t = r.text
        assert "## Page: home" in t
        assert "## Product:" in t and "## Article:" in t
        assert "## Export Markets (192 countries)" in t
        assert len(t) > 20000, f"llms-full seems too small: {len(t)} chars"

    def test_robots_txt(self, api_client):
        r = api_client.get(f"{BASE_URL}/robots.txt")
        assert r.status_code == 200, r.status_code
        t = r.text
        assert "Sitemap:" in t
        assert "GPTBot" in t


# ---------- Public content regression ----------
class TestPublicContent:
    @pytest.mark.parametrize("slug", ["home", "about", "contact"])
    def test_pages(self, api_client, slug):
        r = api_client.get(f"{BASE_URL}/api/pages/{slug}")
        assert r.status_code == 200
        d = r.json()
        assert d["slug"] == slug
        assert isinstance(d["content"], dict) and d["content"]
        assert "_id" not in d

    def test_page_404(self, api_client):
        assert api_client.get(f"{BASE_URL}/api/pages/does-not-exist").status_code == 404

    def test_products(self, api_client):
        r = api_client.get(f"{BASE_URL}/api/products")
        assert r.status_code == 200
        items = r.json()
        assert len(items) >= 3
        for p in items:
            assert p.get("slug") and p.get("name")
            assert "_id" not in p
        detail = api_client.get(f"{BASE_URL}/api/products/{items[0]['slug']}")
        assert detail.status_code == 200
        assert detail.json()["slug"] == items[0]["slug"]
        assert api_client.get(f"{BASE_URL}/api/products/nope-xyz").status_code == 404

    def test_products_featured_filter(self, api_client):
        r = api_client.get(f"{BASE_URL}/api/products", params={"featured": "true"})
        assert r.status_code == 200
        assert all(p.get("featured") for p in r.json())

    def test_posts(self, api_client):
        r = api_client.get(f"{BASE_URL}/api/posts")
        assert r.status_code == 200
        items = r.json()
        assert len(items) >= 1
        for p in items:
            assert p.get("slug") and p.get("title")
            assert p.get("published") is True
            assert "_id" not in p
        detail = api_client.get(f"{BASE_URL}/api/posts/{items[0]['slug']}")
        assert detail.status_code == 200
        assert api_client.get(f"{BASE_URL}/api/posts/nope-xyz").status_code == 404

    def test_ai_generated_post_present_and_valid(self, api_client):
        posts = api_client.get(f"{BASE_URL}/api/posts").json()
        ai = [p for p in posts if p.get("ai_generated")]
        assert ai, "no ai_generated post found in /api/posts"
        p = ai[0]
        assert len(p["title"]) > 10
        assert len(p["content"].split()) > 300, f"content too short: {len(p['content'].split())} words"
        assert p.get("ai_model")
        assert p.get("excerpt")
        assert re.fullmatch(r"[a-z0-9-]+", p["slug"])


# ---------- Inquiries ----------
class TestInquiries:
    created_ids = []

    def test_create_inquiry(self, api_client, authenticated_client):
        payload = {"name": "TEST_QA Buyer", "email": "qa-test@example.test", "company": "TEST_Co",
                   "country": "Australia", "product": "Pool Tiles", "message": "TEST_ automated QA inquiry"}
        r = api_client.post(f"{BASE_URL}/api/inquiries", json=payload)
        assert r.status_code == 200, r.text[:300]
        body = r.json()
        assert body.get("id")
        TestInquiries.created_ids.append(body["id"])
        # verify persisted via admin listing
        lst = authenticated_client.get(f"{BASE_URL}/api/admin/inquiries")
        assert lst.status_code == 200
        match = [i for i in lst.json() if i["id"] == body["id"]]
        assert match, "inquiry not persisted"
        assert match[0]["status"] == "new"
        assert match[0]["email"] == payload["email"]

    def test_inquiry_validation(self, api_client):
        r = api_client.post(f"{BASE_URL}/api/inquiries", json={"name": "x"})
        assert r.status_code == 422

    def test_update_and_delete_inquiry(self, authenticated_client):
        assert TestInquiries.created_ids, "no inquiry created"
        iid = TestInquiries.created_ids[0]
        r = authenticated_client.patch(f"{BASE_URL}/api/admin/inquiries/{iid}", json={"status": "read"})
        assert r.status_code == 200
        lst = authenticated_client.get(f"{BASE_URL}/api/admin/inquiries").json()
        assert [i for i in lst if i["id"] == iid][0]["status"] == "read"
        d = authenticated_client.delete(f"{BASE_URL}/api/admin/inquiries/{iid}")
        assert d.status_code == 200
        lst2 = authenticated_client.get(f"{BASE_URL}/api/admin/inquiries").json()
        assert not [i for i in lst2 if i["id"] == iid]
        TestInquiries.created_ids.clear()
        assert authenticated_client.delete(f"{BASE_URL}/api/admin/inquiries/{iid}").status_code == 404


# ---------- Admin CRUD ----------
class TestAdminCRUD:
    def test_stats(self, authenticated_client):
        r = authenticated_client.get(f"{BASE_URL}/api/admin/stats")
        assert r.status_code == 200
        d = r.json()
        for k in ("products", "posts", "inquiries_total", "inquiries_new"):
            assert isinstance(d[k], int)

    def test_product_crud(self, authenticated_client):
        payload = {"name": "TEST_QA Stone Tile", "category": "Pool Tiles", "short_desc": "qa",
                   "description": "qa desc", "featured": False}
        c = authenticated_client.post(f"{BASE_URL}/api/admin/products", json=payload)
        assert c.status_code == 200, c.text[:300]
        p = c.json()
        pid = p["id"]
        assert p["slug"] == "test-qa-stone-tile"
        try:
            dup = authenticated_client.post(f"{BASE_URL}/api/admin/products", json=payload)
            assert dup.status_code == 409
            g = authenticated_client.get(f"{BASE_URL}/api/products/{p['slug']}")
            assert g.status_code == 200 and g.json()["name"] == payload["name"]
            u = authenticated_client.put(f"{BASE_URL}/api/admin/products/{pid}",
                                         json={**payload, "name": "TEST_QA Updated", "slug": p["slug"]})
            assert u.status_code == 200 and u.json()["name"] == "TEST_QA Updated"
            g2 = authenticated_client.get(f"{BASE_URL}/api/products/{p['slug']}")
            assert g2.json()["name"] == "TEST_QA Updated"
        finally:
            d = authenticated_client.delete(f"{BASE_URL}/api/admin/products/{pid}")
            assert d.status_code == 200
        assert authenticated_client.get(f"{BASE_URL}/api/products/{p['slug']}").status_code == 404
        assert authenticated_client.delete(f"{BASE_URL}/api/admin/products/{pid}").status_code == 404

    def test_post_crud(self, authenticated_client):
        payload = {"title": "TEST_QA Article", "excerpt": "qa", "content": "qa body", "published": True}
        c = authenticated_client.post(f"{BASE_URL}/api/admin/posts", json=payload)
        assert c.status_code == 200, c.text[:300]
        post = c.json()
        pid = post["id"]
        try:
            assert post["slug"] == "test-qa-article"
            assert authenticated_client.get(f"{BASE_URL}/api/posts/{post['slug']}").status_code == 200
            u = authenticated_client.put(f"{BASE_URL}/api/admin/posts/{pid}",
                                         json={**payload, "title": "TEST_QA Article v2", "slug": post["slug"]})
            assert u.status_code == 200 and u.json()["title"] == "TEST_QA Article v2"
            allp = authenticated_client.get(f"{BASE_URL}/api/admin/posts-all")
            assert allp.status_code == 200
            assert [x for x in allp.json() if x["id"] == pid]
        finally:
            assert authenticated_client.delete(f"{BASE_URL}/api/admin/posts/{pid}").status_code == 200
        assert authenticated_client.get(f"{BASE_URL}/api/posts/{post['slug']}").status_code == 404

    def test_page_update_rejects_unknown_slug(self, authenticated_client):
        r = authenticated_client.put(f"{BASE_URL}/api/admin/pages/bogus", json={"content": {}})
        assert r.status_code == 400

    def test_page_update_roundtrip(self, authenticated_client, api_client):
        orig = api_client.get(f"{BASE_URL}/api/pages/about").json()["content"]
        modified = {**orig, "qa_marker": "TEST_QA"}
        r = authenticated_client.put(f"{BASE_URL}/api/admin/pages/about", json={"content": modified})
        assert r.status_code == 200
        assert r.json()["content"]["qa_marker"] == "TEST_QA"
        assert api_client.get(f"{BASE_URL}/api/pages/about").json()["content"]["qa_marker"] == "TEST_QA"
        # restore
        back = authenticated_client.put(f"{BASE_URL}/api/admin/pages/about", json={"content": orig})
        assert back.status_code == 200
        assert "qa_marker" not in api_client.get(f"{BASE_URL}/api/pages/about").json()["content"]


# ---------- Autoblog admin ----------
class TestAutoblogSettings:
    def test_get_settings(self, authenticated_client):
        r = authenticated_client.get(f"{BASE_URL}/api/admin/autoblog")
        assert r.status_code == 200
        d = r.json()
        for k in ("enabled", "hour_utc", "topic_index", "model_index", "last_run_date"):
            assert k in d, f"missing {k}"
        assert isinstance(d["enabled"], bool)
        assert isinstance(d["hour_utc"], int)
        assert "_id" not in d

    def test_toggle_settings(self, authenticated_client):
        orig = authenticated_client.get(f"{BASE_URL}/api/admin/autoblog").json()
        r = authenticated_client.put(f"{BASE_URL}/api/admin/autoblog",
                                     json={"enabled": not orig["enabled"], "hour_utc": 5})
        assert r.status_code == 200
        d = r.json()
        assert d["enabled"] is (not orig["enabled"])
        assert d["hour_utc"] == 5
        # persisted
        g = authenticated_client.get(f"{BASE_URL}/api/admin/autoblog").json()
        assert g["enabled"] is (not orig["enabled"])
        # hour clamping
        clamp = authenticated_client.put(f"{BASE_URL}/api/admin/autoblog",
                                         json={"enabled": orig["enabled"], "hour_utc": 99})
        assert clamp.status_code == 200 and clamp.json()["hour_utc"] == 23
        # restore
        rest = authenticated_client.put(f"{BASE_URL}/api/admin/autoblog",
                                        json={"enabled": orig["enabled"], "hour_utc": orig["hour_utc"]})
        assert rest.status_code == 200 and rest.json()["hour_utc"] == orig["hour_utc"]

    def test_put_validation(self, authenticated_client):
        r = authenticated_client.put(f"{BASE_URL}/api/admin/autoblog", json={"hour_utc": 3})
        assert r.status_code == 422
