"""Tests for SEO keywords, programmatic supplier pages and admin keyword CRUD."""
import pytest
import requests

from conftest import BASE_URL


# ---------- Public keywords ----------
class TestKeywords:
    def test_list_keywords(self, api_client):
        r = api_client.get(f"{BASE_URL}/api/keywords")
        assert r.status_code == 200, r.text[:300]
        data = r.json()
        assert isinstance(data, list)
        assert len(data) >= 10, f"expected >=10 seeded keywords, got {len(data)}"
        for k in data:
            assert k["name"] and k["slug"]
            assert "_id" not in k
        slugs = [k["slug"] for k in data]
        assert len(slugs) == len(set(slugs)), "duplicate keyword slugs"


# ---------- Programmatic supplier pages ----------
class TestSupplierPages:
    @pytest.mark.parametrize("kw,country", [
        ("pool-coping", "united-arab-emirates"),
        ("pedra-bali", "australia"),
    ])
    def test_supplier_payload(self, api_client, kw, country):
        r = api_client.get(f"{BASE_URL}/api/supplier/{kw}/{country}")
        assert r.status_code == 200, f"{kw}/{country} -> {r.status_code} {r.text[:200]}"
        d = r.json()
        assert d["keyword"]["slug"] == kw
        assert d["country"]["slug"] == country
        c = d["content"]
        for key in ["seo", "hero", "intro", "benefits", "process", "faq", "cta"]:
            assert key in c, f"missing content.{key}"
        assert c["seo"].get("title") and c["seo"].get("description")
        assert len(c["benefits"]) >= 3
        assert len(c["process"]) >= 3
        assert len(c["faq"]) >= 3
        for f in c["faq"]:
            assert f.get("q") and f.get("a")
        others = d["other_keywords"]
        assert len(others) >= 9, f"expected >=9 other keywords, got {len(others)}"
        assert all(o["slug"] != kw for o in others)

    def test_supplier_unknown_keyword_404(self, api_client):
        r = api_client.get(f"{BASE_URL}/api/supplier/not-a-keyword-xyz/australia")
        assert r.status_code == 404

    def test_supplier_unknown_country_404(self, api_client):
        r = api_client.get(f"{BASE_URL}/api/supplier/pedra-bali/atlantis-xyz")
        assert r.status_code == 404


# ---------- Admin keyword CRUD ----------
class TestAdminKeywordCRUD:
    def test_keyword_crud_and_programmatic_pages(self, authenticated_client, api_client):
        name = "TEST QA Marble Slab"
        expected_slug = "test-qa-marble-slab"
        # cleanup leftovers
        for k in api_client.get(f"{BASE_URL}/api/keywords").json():
            if k["slug"] in (expected_slug, "test-qa-marble-slab-updated"):
                authenticated_client.delete(f"{BASE_URL}/api/admin/keywords/{k['id']}")

        r = authenticated_client.post(f"{BASE_URL}/api/admin/keywords",
                                      json={"name": name, "summary": "QA temp keyword"})
        assert r.status_code == 200, r.text[:300]
        created = r.json()
        kid = created["id"]
        try:
            assert created["slug"] == expected_slug
            assert created["name"] == name
            assert "_id" not in created

            # duplicate slug -> 400
            dup = authenticated_client.post(f"{BASE_URL}/api/admin/keywords", json={"name": name})
            assert dup.status_code == 400, f"duplicate slug should 400, got {dup.status_code}"

            # appears in public list
            slugs = [k["slug"] for k in api_client.get(f"{BASE_URL}/api/keywords").json()]
            assert expected_slug in slugs

            # programmatic page works
            sp = api_client.get(f"{BASE_URL}/api/supplier/{expected_slug}/australia")
            assert sp.status_code == 200, sp.text[:200]
            assert sp.json()["keyword"]["slug"] == expected_slug

            # appears in sitemap
            sm = api_client.get(f"{BASE_URL}/api/sitemap.xml")
            assert sm.status_code == 200
            assert f"/supplier/{expected_slug}/australia" in sm.text

            # update
            up = authenticated_client.put(f"{BASE_URL}/api/admin/keywords/{kid}",
                                          json={"name": "TEST QA Marble Slab Updated", "summary": "upd"})
            assert up.status_code == 200, up.text[:300]
            assert up.json()["slug"] == "test-qa-marble-slab-updated"
            assert up.json()["summary"] == "upd"

            # persisted
            got = [k for k in api_client.get(f"{BASE_URL}/api/keywords").json()
                   if k["id"] == kid]
            assert got and got[0]["slug"] == "test-qa-marble-slab-updated"
        finally:
            d = authenticated_client.delete(f"{BASE_URL}/api/admin/keywords/{kid}")
            assert d.status_code in (200, 204), d.text[:200]

        # removed
        slugs = [k["slug"] for k in api_client.get(f"{BASE_URL}/api/keywords").json()]
        assert "test-qa-marble-slab-updated" not in slugs
        assert authenticated_client.delete(f"{BASE_URL}/api/admin/keywords/{kid}").status_code == 404

    def test_keyword_crud_requires_auth(self):
        assert requests.post(f"{BASE_URL}/api/admin/keywords", json={"name": "x"}).status_code == 401
        assert requests.put(f"{BASE_URL}/api/admin/keywords/abc", json={"name": "x"}).status_code == 401
        assert requests.delete(f"{BASE_URL}/api/admin/keywords/abc").status_code == 401


# ---------- Sitemap scale ----------
class TestSitemapScale:
    def test_sitemap_contains_programmatic_urls(self, api_client):
        r = api_client.get(f"{BASE_URL}/api/sitemap.xml")
        assert r.status_code == 200
        text = r.text
        locs = text.count("<loc>")
        assert locs > 2000, f"expected ~2130 loc entries, got {locs}"
        assert "/export</loc>" in text
        assert "/export/australia</loc>" in text
        assert "/supplier/pedra-bali/australia</loc>" in text
        assert "<lastmod>" in text
