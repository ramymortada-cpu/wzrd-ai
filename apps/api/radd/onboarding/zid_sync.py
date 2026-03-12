from __future__ import annotations
"""
RADD AI — Zid Full Integration
Full integration with Zid e-commerce platform (زد).
Same depth as Salla Auto-Sync:
- Products → KB documents
- Store policies → KB documents
- Orders webhook → Revenue attribution
"""
import uuid
import structlog
import httpx

logger = structlog.get_logger()

ZID_API_BASE = "https://api.zid.sa/v1"


# ─── Data Fetchers ────────────────────────────────────────────────────────────

async def fetch_zid_products(
    access_token: str,
    store_id: str,
    page: int = 1,
    per_page: int = 50,
) -> list[dict]:
    """Fetch products from Zid store."""
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Accept": "application/json",
        "X-Manager-Token": access_token,
    }
    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            resp = await client.get(
                f"{ZID_API_BASE}/managers/store/products",
                headers=headers,
                params={"page": page, "per_page": per_page},
            )
            resp.raise_for_status()
            data = resp.json()
            return data.get("products", data.get("data", []))
        except Exception as e:
            logger.error("zid.fetch_products_failed", error=str(e))
            return []


async def fetch_zid_store_info(access_token: str, store_id: str) -> dict:
    """Fetch store info including policies from Zid."""
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Accept": "application/json",
        "X-Manager-Token": access_token,
    }
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            resp = await client.get(
                f"{ZID_API_BASE}/managers/store",
                headers=headers,
            )
            resp.raise_for_status()
            return resp.json().get("store", resp.json())
        except Exception as e:
            logger.error("zid.fetch_store_failed", error=str(e))
            return {}


# ─── Content Converters ──────────────────────────────────────────────────────

def zid_product_to_kb_content(product: dict) -> str:
    """Convert Zid product data to KB document content (Arabic)."""
    name = (product.get("name") or {}).get("ar", "") or product.get("name", "")
    description = (product.get("description") or {}).get("ar", "") or product.get("description", "")
    price = product.get("price", "")
    sku = product.get("sku", "")
    available = product.get("quantity", 0)

    lines = [f"# منتج: {name}"]
    if price:
        lines.append(f"السعر: {price} ر.س")
    if sku:
        lines.append(f"رمز المنتج (SKU): {sku}")
    lines.append(f"الكمية المتاحة: {available if available else 'غير محدد'}")

    if description:
        lines.append(f"\n## الوصف\n{description}")

    # Variants
    variants = product.get("variants", [])
    if variants:
        lines.append("\n## الخيارات المتاحة")
        for v in variants[:10]:
            vname = (v.get("name") or {}).get("ar", "") or v.get("name", "")
            vprice = v.get("price", "")
            if vname:
                lines.append(f"- {vname}" + (f" — {vprice} ر.س" if vprice else ""))

    return "\n".join(lines)


def zid_store_policies_to_kb_content(store_info: dict) -> str:
    """Convert Zid store policies to KB content."""
    lines = ["# سياسات وإعدادات المتجر"]

    store_name = (store_info.get("name") or {}).get("ar", "") or store_info.get("name", "")
    if store_name:
        lines.append(f"اسم المتجر: {store_name}")

    # Return policy
    return_policy = store_info.get("return_policy", "")
    if return_policy:
        lines.append(f"\n## سياسة الإرجاع\n{return_policy}")
    else:
        lines.append("\n## سياسة الإرجاع\nالإرجاع مقبول خلال 7 أيام من تاريخ الاستلام للمنتجات غير المستخدمة.")

    # Shipping
    shipping_time = store_info.get("shipping_time", "")
    if shipping_time:
        lines.append(f"\n## مواعيد التوصيل\n{shipping_time}")
    else:
        lines.append("\n## مواعيد التوصيل\nالتوصيل خلال 3-7 أيام عمل.")

    # Payment
    payment_methods = store_info.get("payment_methods", [])
    if payment_methods:
        methods_str = "، ".join([
            (m.get("name") or {}).get("ar", m.get("name", "")) for m in payment_methods
        ])
        lines.append(f"\n## طرق الدفع\n{methods_str}")

    return "\n".join(lines)


# ─── Main Sync Function ───────────────────────────────────────────────────────

async def sync_zid_store(
    workspace_id: str,
    access_token: str,
    store_id: str,
    kb_service,
    max_products: int = 100,
) -> dict:
    """
    Full Zid store sync → KB documents.
    Same interface as salla_sync.
    """
    products_synced = 0
    documents_created = 0

    # 1. Products
    products = await fetch_zid_products(access_token, store_id)
    for product in products[:max_products]:
        try:
            content = zid_product_to_kb_content(product)
            title = (product.get("name") or {}).get("ar", "") or str(product.get("name", ""))
            if not title or not content:
                continue

            # Check if already exists
            product_id = str(product.get("id", ""))
            existing = await kb_service.find_by_salla_id(workspace_id, f"zid_{product_id}")
            if existing:
                await kb_service.update_document(existing.id, content=content)
            else:
                doc = await kb_service.create_document(
                    title=title,
                    content=content,
                    content_type="product_catalog",
                    metadata={"source": "zid", "zid_product_id": product_id, "salla_id": f"zid_{product_id}"},
                )
                documents_created += 1

            products_synced += 1
        except Exception as e:
            logger.warning("zid.product_sync_failed", error=str(e))

    # 2. Store policies
    try:
        store_info = await fetch_zid_store_info(access_token, store_id)
        if store_info:
            policies_content = zid_store_policies_to_kb_content(store_info)
            existing_policy = await kb_service.find_by_title(workspace_id, "سياسات المتجر (Zid)")
            if existing_policy:
                await kb_service.update_document(existing_policy.id, content=policies_content)
            else:
                await kb_service.create_document(
                    title="سياسات المتجر (Zid)",
                    content=policies_content,
                    content_type="policy",
                    metadata={"source": "zid"},
                )
                documents_created += 1
    except Exception as e:
        logger.warning("zid.policies_sync_failed", error=str(e))

    logger.info(
        "zid.sync_complete",
        workspace_id=workspace_id,
        products_synced=products_synced,
        documents_created=documents_created,
    )

    return {
        "synced": True,
        "products_synced": products_synced,
        "documents_created": documents_created,
        "platform": "zid",
    }


# ─── Zid Webhook Handler ──────────────────────────────────────────────────────

async def handle_zid_order_webhook(
    event_type: str,
    order_data: dict,
    workspace_id: str,
    db_session,
) -> None:
    """
    Handle Zid order webhooks for revenue attribution.
    event_type: order.created, order.paid, order.delivered
    """
    if event_type not in ("order.paid", "order.delivered"):
        return

    from radd.db.models import RevenueEvent
    from sqlalchemy import text
    import uuid as uuid_mod

    order_id = str(order_data.get("id", ""))
    total = float(order_data.get("total", 0))
    customer_identifier = order_data.get("customer", {}).get("mobile", "")

    if not order_id or total <= 0:
        return

    # Find matching conversation within 24h
    try:
        conv_result = await db_session.execute(
            text("""
                SELECT c.id FROM conversations c
                JOIN customers cu ON cu.id = c.customer_id
                WHERE c.workspace_id = :wid
                  AND cu.channel_identifier_hash = encode(sha256(:phone::bytea), 'hex')
                  AND c.created_at >= NOW() - INTERVAL '24 hours'
                  AND c.resolution_type IN ('auto_template', 'auto_rag')
                ORDER BY c.created_at DESC
                LIMIT 1
            """),
            {"wid": workspace_id, "phone": customer_identifier},
        )
        conv_row = conv_result.fetchone()
        conversation_id = conv_row.id if conv_row else None

        event = RevenueEvent(
            workspace_id=uuid_mod.UUID(workspace_id),
            conversation_id=conversation_id,
            event_type="assisted_sale",
            amount_sar=total,
            order_id=order_id,
            metadata_={"platform": "zid", "event_type": event_type},
        )
        db_session.add(event)
        await db_session.flush()

        logger.info("zid.revenue_attributed", order_id=order_id, amount=total)
    except Exception as e:
        logger.error("zid.revenue_attribution_failed", error=str(e))
