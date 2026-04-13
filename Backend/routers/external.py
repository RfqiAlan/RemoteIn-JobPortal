import asyncio
from fastapi import APIRouter, Query, HTTPException, status
from typing import Optional, List
from schemas.external import ExternalJob, ExternalJobList, AggregatedJobList
from services.external_api import fetch_remotive, fetch_arbeitnow, fetch_jobicy

router = APIRouter(prefix="/external", tags=["External Jobs"])


@router.get(
    "/remotive",
    response_model=ExternalJobList,
    summary="Ambil loker remote dari Remotive (tanpa auth)"
)
async def get_remotive_jobs(
    category: Optional[str] = Query(default=None, description="Kategori job, contoh: software-dev, devops, design"),
    limit: int = Query(default=20, ge=1, le=100, description="Jumlah job yang diambil")
):
    """
    Fetch loker remote dari Remotive.com.
    Sumber: https://remotive.com/api/remote-jobs
    Gratis, tanpa API key.
    """
    jobs = await fetch_remotive(category=category, limit=limit)
    return ExternalJobList(source="remotive", total=len(jobs), jobs=jobs)


@router.get(
    "/arbeitnow",
    response_model=ExternalJobList,
    summary="Ambil loker remote dari Arbeitnow (tanpa auth)"
)
async def get_arbeitnow_jobs(
    limit: int = Query(default=20, ge=1, le=100, description="Jumlah job yang diambil")
):
    """
    Fetch loker remote dari Arbeitnow.com.
    Sumber: https://www.arbeitnow.com/api/job-board-api
    Gratis, tanpa API key. Fokus loker Eropa.
    """
    jobs = await fetch_arbeitnow(limit=limit)
    return ExternalJobList(source="arbeitnow", total=len(jobs), jobs=jobs)


@router.get(
    "/jobicy",
    response_model=ExternalJobList,
    summary="Ambil loker remote dari Jobicy (tanpa auth)"
)
async def get_jobicy_jobs(
    count: int = Query(default=20, ge=1, le=50, description="Jumlah job (max 50)"),
    geo: Optional[str] = Query(default=None, description="Filter region, contoh: usa, uk, worldwide"),
    industry: Optional[str] = Query(default=None, description="Filter industri, contoh: engineering, marketing"),
    tag: Optional[str] = Query(default=None, description="Search by keyword di judul/deskripsi")
):
    """
    Fetch loker remote dari Jobicy.com.
    Sumber: https://jobicy.com/api/v2/remote-jobs
    Gratis, tanpa API key. Support filter geo dan industri.
    """
    jobs = await fetch_jobicy(count=count, geo=geo, industry=industry, tag=tag)
    return ExternalJobList(source="jobicy", total=len(jobs), jobs=jobs)


@router.get(
    "/aggregate",
    response_model=AggregatedJobList,
    summary="Ambil loker dari semua sumber sekaligus (tanpa auth)"
)
async def get_aggregated_jobs(
    limit: int = Query(default=10, ge=1, le=50, description="Jumlah job per sumber"),
    keyword: Optional[str] = Query(default=None, description="Filter keyword di judul atau company")
):
    """
    Fetch loker dari Remotive, Arbeitnow, dan Jobicy secara paralel,
    gabungkan hasilnya, lalu filter berdasarkan keyword jika ada.
    Gratis, tanpa API key, tanpa auth.
    """
    # Fetch semua sumber secara paralel menggunakan asyncio.gather
    remotive_jobs, arbeitnow_jobs, jobicy_jobs = await asyncio.gather(
        fetch_remotive(limit=limit),
        fetch_arbeitnow(limit=limit),
        fetch_jobicy(count=limit)
    )

    all_jobs: List[ExternalJob] = remotive_jobs + arbeitnow_jobs + jobicy_jobs

    # Filter berdasarkan keyword jika ada
    if keyword:
        kw = keyword.lower()
        all_jobs = [
            j for j in all_jobs
            if kw in j.title.lower() or kw in j.company.lower()
        ]

    # Tentukan sumber mana yang berhasil di-fetch
    active_sources = []
    if remotive_jobs:
        active_sources.append("remotive")
    if arbeitnow_jobs:
        active_sources.append("arbeitnow")
    if jobicy_jobs:
        active_sources.append("jobicy")

    return AggregatedJobList(
        total=len(all_jobs),
        sources=active_sources,
        jobs=all_jobs
    )
