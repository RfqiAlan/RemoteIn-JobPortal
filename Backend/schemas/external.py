from pydantic import BaseModel
from typing import Optional, List

class ExternalJob(BaseModel):
    """
    Schema normalisasi — format seragam untuk semua job dari sumber eksternal.
    Tidak semua field tersedia di semua sumber, jadi semuanya Optional.
    """
    id: str                          # ID unik: "{source}_{id_asli}"
    title: str                       # Judul posisi
    company: str                     # Nama perusahaan
    location: str                    # Lokasi / "Worldwide" / "Remote"
    tags: List[str] = []             # Tag / kategori / skill
    salary: Optional[str] = None     # Range gaji jika tersedia
    url: str                         # Link apply langsung
    source: str                      # "remotive" / "arbeitnow" / "jobicy"
    published_at: Optional[str] = None  # Tanggal posting

class ExternalJobList(BaseModel):
    source: str
    total: int
    jobs: List[ExternalJob]

class AggregatedJobList(BaseModel):
    total: int
    sources: List[str]
    jobs: List[ExternalJob]
