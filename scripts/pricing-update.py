#!/usr/bin/env python3
"""Update GPU pricing in Gcore managed PostgreSQL

Usage:
    python3 scripts/pricing-update.py A100 2.50      # Set A100 to $2.50/hour
    python3 scripts/pricing-update.py H200 contact   # Set H200 to "Contact Sales"
"""

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
    if len(sys.argv) != 3:
        print("Usage: python3 scripts/pricing-update.py <GPU_TYPE> <PRICE>")
        print()
        print("Examples:")
        print("  python3 scripts/pricing-update.py A100 2.50      # Set to $2.50/hour")
        print("  python3 scripts/pricing-update.py H200 contact   # Set to 'Contact Sales'")
        print()
        print("GPU types: A100, H100, H200, B200")
        sys.exit(1)

    gpu_type = sys.argv[1].upper()
    price_arg = sys.argv[2].lower()

    conn = psycopg2.connect(
        host=os.environ["DB_HOST"],
        port=os.environ.get("DB_PORT", "5432"),
        database=os.environ["DB_DATABASE"],
        user=os.environ["DB_USERNAME"],
        password=os.environ["DB_PASSWORD"],
        sslmode="require"
    )

    cur = conn.cursor()

    # Show current value
    cur.execute("SELECT price_per_hour, is_contact_sales FROM pricing_config WHERE gpu_type = %s", (gpu_type,))
    row = cur.fetchone()

    if not row:
        print(f"Error: GPU type '{gpu_type}' not found")
        sys.exit(1)

    old_price, old_contact = row
    old_str = "Contact Sales" if old_contact else f"${float(old_price):.2f}/hour"

    # Update
    if price_arg == "contact":
        cur.execute("""
            UPDATE pricing_config
            SET price_per_hour = NULL, is_contact_sales = true, updated_at = NOW()
            WHERE gpu_type = %s
        """, (gpu_type,))
        new_str = "Contact Sales"
    else:
        price = float(price_arg)
        cur.execute("""
            UPDATE pricing_config
            SET price_per_hour = %s, is_contact_sales = false, updated_at = NOW()
            WHERE gpu_type = %s
        """, (price, gpu_type))
        new_str = f"${price:.2f}/hour"

    conn.commit()

    print(f"Updated {gpu_type}:")
    print(f"  Before: {old_str}")
    print(f"  After:  {new_str}")
    print()
    print("Changes are live (backend cache expires in 2 minutes)")

    cur.close()
    conn.close()

if __name__ == "__main__":
    main()
