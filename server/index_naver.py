# index_naver.py
from fastapi import APIRouter
import requests
from bs4 import BeautifulSoup

router = APIRouter()

@router.get("/market-index/naver")
def get_kospi_kosdaq():
    url = "https://finance.naver.com/sise/"
    headers = {"User-Agent": "Mozilla/5.0"}

    response = requests.get(url, headers=headers)
    soup = BeautifulSoup(response.text, "html.parser")

    kospi = soup.select_one("#KOSPI_now").text.strip()
    kosdaq = soup.select_one("#KOSDAQ_now").text.strip()

    return {
        "KOSPI": kospi,
        "KOSDAQ": kosdaq
    }
