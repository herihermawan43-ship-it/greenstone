"""One-shot LLM test: manual autoblog run (costs LLM credits — run deliberately, not in CI sweeps)."""
import re

from conftest import BASE_URL


def test_manual_autoblog_run_publishes_article(authenticated_client, api_client):
    before = authenticated_client.get(f"{BASE_URL}/api/admin/autoblog").json()
    r = authenticated_client.post(f"{BASE_URL}/api/admin/autoblog/run", timeout=300)
    assert r.status_code == 200, r.text[:500]
    post = r.json()
    assert post.get("ai_generated") is True
    assert post.get("ai_model")
    assert len(post["title"]) > 10 and len(post["title"]) <= 120
    words = len(post["content"].split())
    assert 400 <= words <= 1500, f"unexpected word count {words}"
    assert re.fullmatch(r"[a-z0-9-]+", post["slug"]), post["slug"]
    assert post["excerpt"] and post["seo_title"] and post["seo_desc"]
    assert isinstance(post["tags"], list) and len(post["tags"]) >= 3
    assert post["published"] is True
    assert "_id" not in post

    # visible publicly
    pub = api_client.get(f"{BASE_URL}/api/posts").json()
    match = [p for p in pub if p["slug"] == post["slug"]]
    assert match, "generated post not returned by GET /api/posts"
    assert match[0]["title"] == post["title"]
    detail = api_client.get(f"{BASE_URL}/api/posts/{post['slug']}")
    assert detail.status_code == 200
    assert detail.json()["ai_generated"] is True

    # state advanced (topic + model rotation, last_run_date set)
    after = authenticated_client.get(f"{BASE_URL}/api/admin/autoblog").json()
    assert after["topic_index"] != before["topic_index"]
    assert after["model_index"] != before["model_index"]
    assert after["last_run_date"]
    assert after.get("last_error") is None
