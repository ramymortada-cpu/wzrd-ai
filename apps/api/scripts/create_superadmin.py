"""
Create or promote a user to superadmin.

Usage:
    uv run python scripts/create_superadmin.py

The script will prompt for workspace slug, email, and password.
If the user already exists in the workspace, it will promote them to superadmin.
If not, it will create a new user with the owner role and superadmin flag.
"""
import asyncio
import sys
import uuid
from getpass import getpass

sys.path.insert(0, ".")

from sqlalchemy import select

from radd.auth.service import hash_password
from radd.db.models import User, Workspace
from radd.db.session import get_db_session


async def main() -> None:
    print("=== Radd — Create Superadmin User ===\n")
    workspace_slug = input("Workspace slug: ").strip()
    email = input("Email: ").strip()
    password = getpass("Password: ")
    confirm = getpass("Confirm password: ")

    if password != confirm:
        print("Passwords do not match.")
        return

    if len(password) < 8:
        print("Password must be at least 8 characters.")
        return

    # Look up workspace (no RLS)
    async with get_db_session() as db:
        ws = (
            await db.execute(select(Workspace).where(Workspace.slug == workspace_slug))
        ).scalar_one_or_none()

        if not ws:
            print(f"Workspace '{workspace_slug}' not found.")
            return

        # Check if user already exists
        existing = (
            await db.execute(
                select(User).where(
                    User.workspace_id == ws.id,
                    User.email == email,
                )
            )
        ).scalar_one_or_none()

        if existing:
            existing.is_superadmin = True
            existing.is_active = True
            print(f"\n✅ User '{email}' promoted to superadmin in workspace '{workspace_slug}'.")
        else:
            user = User(
                workspace_id=ws.id,
                email=email,
                name="Super Admin",
                role="owner",
                password_hash=hash_password(password),
                is_active=True,
                is_superadmin=True,
            )
            db.add(user)
            await db.flush()
            print(f"\n✅ Superadmin user created:")
            print(f"   Workspace: {workspace_slug}")
            print(f"   Email:     {email}")
            print(f"   Role:      owner + superadmin")
            print(f"\nLogin at /login with workspace='{workspace_slug}' then visit /superadmin")


if __name__ == "__main__":
    asyncio.run(main())
