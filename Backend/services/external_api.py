import httpx
from typing import List, Optional
from schemas.external import ExternalJob

TIMEOUT = 10  # detik


async def fetch_remotive(category: Optional[str] = None, limit: int = 20) -> List[ExternalJob]:
    """
    Fetch dari Remotive API.
    Docs: https://remotive.com/api/remote-jobs
    Query params: category, limit
    """
    params = {"limit": limit}
    if category:
        params["category"] = category

    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            response = await client.get(
                "https://remotive.com/api/remote-jobs",
                params=params
            )
            response.raise_for_status()
            data = response.json()

        jobs = []
        for item in data.get("jobs", []):
            jobs.append(ExternalJob(
                id=f"remotive_{item.get('id', '')}",
                title=item.get("title", ""),
                company=item.get("company_name", ""),
                location=item.get("candidate_required_location") or "Worldwide",
                tags=item.get("tags", []),
                salary=item.get("salary") or None,
                url=item.get("url", ""),
                source="remotive",
                published_at=item.get("publication_date")
            ))
        return jobs

    except (httpx.RequestError, httpx.HTTPStatusError):
        # Jika gagal fetch, return list kosong agar aggregator tetap berjalan
        return []


async def fetch_arbeitnow(limit: int = 20) -> List[ExternalJob]:
    """
    Fetch dari Arbeitnow API.
    Docs: https://www.arbeitnow.com/api/job-board-api
    Tidak ada filter kategori, ambil semua lalu slice.
    """
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            response = await client.get(
                "https://www.arbeitnow.com/api/job-board-api"
            )
            response.raise_for_status()
            data = response.json()

        jobs = []
        for item in data.get("data", [])[:limit]:
            jobs.append(ExternalJob(
                id=f"arbeitnow_{item.get('slug', '')}",
                title=item.get("title", ""),
                company=item.get("company_name", ""),
                location=item.get("location") or "Remote",
                tags=item.get("tags", []),
                salary=None,  # Arbeitnow tidak expose salary di API publik
                url=item.get("url", ""),
                source="arbeitnow",
                published_at=str(item.get("created_at", ""))
            ))
        return jobs

    except (httpx.RequestError, httpx.HTTPStatusError):
        return []


async def fetch_jobicy(
    count: int = 20,
    geo: Optional[str] = None,
    industry: Optional[str] = None,
    tag: Optional[str] = None
) -> List[ExternalJob]:
    """
    Fetch dari Jobicy API.
    Docs: https://jobicy.com/api/v2/remote-jobs
    Query params: count (max 50), geo, industry, tag
    """
    params = {"count": min(count, 50)}
    if geo:
        params["geo"] = geo
    if industry:
        params["industry"] = industry
    if tag:
        params["tag"] = tag

    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            response = await client.get(
                "https://jobicy.com/api/v2/remote-jobs",
                params=params
            )
            response.raise_for_status()
            data = response.json()

        jobs = []
        for item in data.get("jobs", []):
            # Bangun salary string dari salary_min dan salary_max jika tersedia
            salary = None
            s_min = item.get("annualSalaryMin")
            s_max = item.get("annualSalaryMax")
            if s_min and s_max:
                salary = f"${int(s_min):,} - ${int(s_max):,}"
            elif s_min:
                salary = f"${int(s_min):,}+"

            jobs.append(ExternalJob(
                id=f"jobicy_{item.get('id', '')}",
                title=item.get("jobTitle", ""),
                company=item.get("companyName", ""),
                location=item.get("jobGeo") or "Worldwide",
                tags=item.get("jobType", []) if isinstance(item.get("jobType"), list) else [],
                salary=salary,
                url=item.get("url", ""),
                source="jobicy",
                published_at=item.get("pubDate")
            ))
        return jobs

    except (httpx.RequestError, httpx.HTTPStatusError):
        return []
