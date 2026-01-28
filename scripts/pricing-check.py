#!/usr/bin/env python3
"""
Check GPU prices from Gcore website and compare with database.
Usage: python3 scripts/pricing-check.py
"""

import os
import sys
import re
import urllib.request
import ssl
from pathlib import Path

import psycopg2

# Load .env file
env_path = Path(__file__).parent.parent / "backend" / ".env"
if env_path.exists():
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, value = line.split("=", 1)
                os.environ[key] = value

GCORE_URL = "https://gcore.com/go/gonka"

def get_db_prices():
    """Fetch current prices from database."""
    conn = psycopg2.connect(
        host=os.environ["DB_HOST"],
        port=os.environ.get("DB_PORT", "5432"),
        database=os.environ["DB_DATABASE"],
        user=os.environ["DB_USERNAME"],
        password=os.environ["DB_PASSWORD"],
        sslmode="require"
    )
    cur = conn.cursor()
    cur.execute("""
        SELECT gpu_type, price_per_hour
        FROM pricing_config
        WHERE is_active = true
        ORDER BY display_order
    """)
    prices = {row[0]: float(row[1]) if row[1] else None for row in cur.fetchall()}
    cur.close()
    conn.close()
    return prices

def fetch_gcore_prices():
    """Fetch prices from Gcore website."""
    # Create SSL context that doesn't verify (for simplicity)
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE

    req = urllib.request.Request(
        GCORE_URL,
        headers={'User-Agent': 'Mozilla/5.0 (compatible; MineGNK/1.0)'}
    )

    try:
        with urllib.request.urlopen(req, context=ctx, timeout=10) as response:
            html = response.read().decode('utf-8')
    except Exception as e:
        print(f"Error fetching Gcore page: {e}", file=sys.stderr)
        return None

    prices = {}

    # Website format: "8xA100 - One server with eight A100 GPUs - $0.99 per GPU per hour"
    gpu_types = ['A100', 'H100', 'H200', 'B200']

    for gpu in gpu_types:
        # Pattern: "8x<GPU>" followed by price "$X.XX per GPU per hour"
        # Note: no space between "8x" and GPU name
        pattern = rf'8x{gpu}[^$]*?\$(\d+\.?\d*)\s*per\s+GPU\s+per\s+hour'
        match = re.search(pattern, html, re.IGNORECASE | re.DOTALL)
        if match:
            prices[gpu] = float(match.group(1))
            continue

        # Alternative with space: "8x A100"
        pattern = rf'8x\s*{gpu}[^$]*?\$(\d+\.?\d*)\s*per\s+GPU'
        match = re.search(pattern, html, re.IGNORECASE | re.DOTALL)
        if match:
            prices[gpu] = float(match.group(1))

    return prices if prices else None

def main():
    print("Checking GPU prices...\n")

    # Get database prices
    try:
        db_prices = get_db_prices()
    except Exception as e:
        print(f"Error connecting to database: {e}", file=sys.stderr)
        sys.exit(1)

    # Get Gcore website prices
    gcore_prices = fetch_gcore_prices()

    if not gcore_prices:
        print("Could not fetch prices from Gcore website.")
        print("URL: " + GCORE_URL)
        print("\nCurrent database prices:")
        for gpu, price in db_prices.items():
            print(f"  {gpu}: ${price:.2f}/hour" if price else f"  {gpu}: Contact Sales")
        sys.exit(1)

    # Compare prices
    print(f"{'GPU':<8} {'Database':<12} {'Gcore.com':<12} {'Status':<10}")
    print("-" * 44)

    all_match = True
    all_gpus = set(db_prices.keys()) | set(gcore_prices.keys())

    for gpu in sorted(all_gpus):
        db_price = db_prices.get(gpu)
        gcore_price = gcore_prices.get(gpu)

        if db_price is None and gcore_price is not None:
            status = "MISSING"
            all_match = False
            db_str = "N/A"
            gcore_str = f"${gcore_price:.2f}"
        elif db_price is not None and gcore_price is None:
            status = "NOT ON WEB"
            db_str = f"${db_price:.2f}"
            gcore_str = "N/A"
        elif db_price == gcore_price:
            status = "OK"
            db_str = f"${db_price:.2f}"
            gcore_str = f"${gcore_price:.2f}"
        else:
            status = "MISMATCH"
            all_match = False
            db_str = f"${db_price:.2f}"
            gcore_str = f"${gcore_price:.2f}"

        print(f"{gpu:<8} {db_str:<12} {gcore_str:<12} {status:<10}")

    print()
    if all_match:
        print("All prices match!")
    else:
        print("Price differences detected. Run pricing-update.py to sync.")
        print("\nSuggested commands:")
        for gpu in sorted(all_gpus):
            db_price = db_prices.get(gpu)
            gcore_price = gcore_prices.get(gpu)
            if gcore_price and db_price != gcore_price:
                print(f"  python3 scripts/pricing-update.py {gpu} {gcore_price:.2f}")

if __name__ == '__main__':
    main()
