from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BAD = "motionSafeImgBlock"
GOOD = "div"

for rel in [
    "src/components/v2/SellerShell.tsx",
    "src/components/v2/DashboardClient.tsx",
    "src/components/v2/LegacyAuthClient.tsx",
]:
    path = ROOT / rel
    if not path.exists():
        continue
    text = path.read_text(encoding="utf-8")
    if BAD in text:
        path.write_text(text.replace(BAD, GOOD), encoding="utf-8")
        print(f"fixed {rel}")
