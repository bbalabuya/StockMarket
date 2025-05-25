from fastapi import FastAPI, APIRouter
import requests
from bs4 import BeautifulSoup
import re

app = FastAPI()
router = APIRouter()

@router.get("/getKoreaIndex_naver")
def get_kospi_kosdaq():
    url = "https://finance.naver.com/sise/"
    response = requests.get(url)
    soup = BeautifulSoup(response.text, "html.parser")

    kospi_index = float(soup.select_one("#KOSPI_now").text.replace(",", ""))
    kosdaq_index = float(soup.select_one("#KOSDAQ_now").text.replace(",", ""))

    kospi_change_text = soup.select_one("#KOSPI_change").text.strip()
    kosdaq_change_text = soup.select_one("#KOSDAQ_change").text.strip()

    # 등락폭과 등락률을 추출하는 함수
    def extract_change_info(text):
        diff_match = re.search(r"([-+]?\d*\.?\d+)", text)
        rate_match = re.search(r"([-+]?\d*\.?\d+)%", text)

        diff = float(diff_match.group()) if diff_match else 0.0
        rate = float(rate_match.group().replace('%', '')) if rate_match else 0.0  # ← % 제거

        direction = "even"
        if "▲" in text or "+" in text:
            direction = "up"
        elif "▼" in text or "-" in text:
            direction = "down"

        return diff, rate, direction

    kospi_diff, kospi_rate, kospi_direction = extract_change_info(kospi_change_text)
    kosdaq_diff, kosdaq_rate, kosdaq_direction = extract_change_info(kosdaq_change_text)

    return {
        "KOSPI": {
            "value": kospi_index,
            "diff": kospi_diff,
            "rate": kospi_rate,
            "direction": kospi_direction
        },
        "KOSDAQ": {
            "value": kosdaq_index,
            "diff": kosdaq_diff,
            "rate": kosdaq_rate,
            "direction": kosdaq_direction
        }
    }
