#!/usr/bin/env python3
"""View current GPU pricing from Gcore managed PostgreSQL"""

import os
import sys
from pathlib import Path

# Load .env file
env_path = Path(__file__).parent.parent / "backend" / ".env"
if env_path.exists():
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, value = line.split("=", 1)
                os.environ[key] = value

import psycopg2

def main():
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
        SELECT gpu_type, price_per_hour, is_contact_sales, is_active, display_order
        FROM pricing_config
        ORDER BY display_order
    """)

    rows = cur.fetchall()

    print(f"{'GPU':<10} {'Price/Hour':<15} {'Contact Sales':<15} {'Active':<10}")
    print("-" * 50)

    for row in rows:
        gpu_type, price, is_contact, is_active, _ = row
        price_str = f"${float(price):.2f}" if price else "-"
        contact_str = "Yes" if is_contact else "No"
        active_str = "Yes" if is_active else "No"
        print(f"{gpu_type:<10} {price_str:<15} {contact_str:<15} {active_str:<10}")

    cur.close()
    conn.close()

if __name__ == "__main__":
    main()
