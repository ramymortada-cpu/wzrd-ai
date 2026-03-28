"""Admin analytics endpoints: KPIs, revenue, radar, RADD score, churn, agent performance, followups."""
from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy import func, select

from radd.admin.analytics import get_kpis
from radd.auth.middleware import CurrentUser, require_admin, require_reviewer
from radd.config import settings
from radd.db.models import RadarAlert, RevenueEvent, Workspace
from radd.db.session import get_db_session
from radd.limiter import limiter

router = APIRouter(tags=["admin-analytics"])


@router.get("/analytics")
@limiter.limit(settings.default_rate_limit)
async def get_analytics(request: Request, current: Annotated[CurrentUser, Depends(require_reviewer)]):
    """8 KPI cards for the dashboard."""
    async with get_db_session(current.workspace_id) as db:
        kpis = await get_kpis(db, current.workspace_id)
    return kpis


@router.get("/revenue/summary")
@limiter.limit(settings.default_rate_limit)
async def get_revenue_summary(
    request: Request,
    current: Annotated[CurrentUser, Depends(require_reviewer)],
    period: str = Query("this_month", description="this_month | last_month | all_time"),
):
    """Revenue attribution summary for the dashboard."""
    from radd.revenue.attribution import get_revenue_summary
    async with get_db_session(current.workspace_id) as db:
        result = await db.execute(
            select(Workspace).where(Workspace.id == current.workspace_id)
        )
        ws = result.scalar_one_or_none()
        subscription_cost = float(ws.subscription_price_sar) if ws and ws.subscription_price_sar else 499.0
        summary = await get_revenue_summary(
            db_session=db,
            workspace_id=str(current.workspace_id),
            period=period,
            subscription_cost=subscription_cost,
        )
    return {
        "period": period,
        "total_attributed_sar": summary.total_attributed,
        "assisted_sales_sar": summary.assisted_sales,
        "returns_prevented_sar": summary.returns_prevented,
        "carts_recovered_sar": summary.carts_recovered,
        "upsells_sar": 0,
        "event_count": summary.assisted_sales_count + summary.returns_prevented_count + summary.carts_recovered_count,
        "roi_multiplier": summary.roi_multiple,
        "subscription_cost_sar": summary.subscription_cost,
    }


@router.get("/revenue/events")
@limiter.limit(settings.default_rate_limit)
async def list_revenue_events(
    request: Request,
    current: Annotated[CurrentUser, Depends(require_reviewer)],
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
):
    """Paginated list of revenue attribution events."""
    async with get_db_session(current.workspace_id) as db:
        total_result = await db.execute(
            select(func.count(RevenueEvent.id)).where(RevenueEvent.workspace_id == current.workspace_id)
        )
        total = total_result.scalar_one()
        result = await db.execute(
            select(RevenueEvent)
            .where(RevenueEvent.workspace_id == current.workspace_id)
            .order_by(RevenueEvent.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        events = result.scalars().all()
    return {
        "items": [
            {
                "id": str(e.id),
                "event_type": e.event_type,
                "amount_sar": float(e.amount_sar),
                "product_name": e.product_name,
                "order_id": e.order_id,
                "conversation_id": str(e.conversation_id) if e.conversation_id else None,
                "created_at": e.created_at.isoformat(),
            }
            for e in events
        ],
        "total": total,
        "page": page,
    }


@router.get("/radar/alerts")
@limiter.limit(settings.default_rate_limit)
async def list_radar_alerts(
    request: Request,
    current: Annotated[CurrentUser, Depends(require_reviewer)],
    unread_only: bool = Query(False),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
):
    """List operational radar alerts for this workspace."""
    async with get_db_session(current.workspace_id) as db:
        q = select(RadarAlert).where(RadarAlert.workspace_id == current.workspace_id)
        if unread_only:
            q = q.where(RadarAlert.is_read == False)
        total_result = await db.execute(select(func.count()).select_from(q.subquery()))
        total = total_result.scalar_one()
        q = q.order_by(RadarAlert.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
        result = await db.execute(q)
        alerts = result.scalars().all()
    return {
        "items": [
            {
                "id": str(a.id),
                "alert_type": a.alert_type,
                "severity": a.severity,
                "title": a.title,
                "description": a.description,
                "suggested_action": a.suggested_action,
                "is_read": a.is_read,
                "created_at": a.created_at.isoformat(),
            }
            for a in alerts
        ],
        "total": total,
        "page": page,
    }


@router.post("/radar/scan")
@limiter.limit("5/minute")
async def trigger_radar_scan(
    request: Request,
    current: Annotated[CurrentUser, Depends(require_admin)],
):
    """Manually trigger an operational radar scan for this workspace."""
    from radd.radar.detector import scan_for_anomalies
    async with get_db_session(current.workspace_id) as db:
        alerts = await scan_for_anomalies(db_session=db, workspace_id=str(current.workspace_id))
        saved = []
        for alert in alerts:
            ra = RadarAlert(
                workspace_id=current.workspace_id,
                alert_type=alert.alert_type.value if hasattr(alert.alert_type, "value") else str(alert.alert_type),
                severity=alert.severity.value if hasattr(alert.severity, "value") else str(alert.severity),
                title=alert.title,
                description=alert.description,
                suggested_action=alert.suggested_action,
                metadata_=alert.metadata if hasattr(alert, "metadata") else {},
            )
            db.add(ra)
            saved.append({"alert_type": ra.alert_type, "severity": ra.severity, "title": ra.title})
        await db.flush()
    return {"scanned": True, "alerts_found": len(saved), "alerts": saved}


@router.patch("/radar/alerts/{alert_id}/read")
@limiter.limit(settings.default_rate_limit)
async def mark_alert_read(
    request: Request,
    alert_id: uuid.UUID,
    current: Annotated[CurrentUser, Depends(require_reviewer)],
):
    async with get_db_session(current.workspace_id) as db:
        result = await db.execute(
            select(RadarAlert).where(
                RadarAlert.id == alert_id,
                RadarAlert.workspace_id == current.workspace_id,
            )
        )
        alert = result.scalar_one_or_none()
        if not alert:
            from fastapi import HTTPException
            raise HTTPException(status_code=404, detail="Alert not found")
        alert.is_read = True
    return {"marked_read": True}


@router.get("/radd-score")
@limiter.limit(settings.default_rate_limit)
async def get_radd_score(
    request: Request,
    current: Annotated[CurrentUser, Depends(require_reviewer)],
    period_days: int = Query(30, ge=7, le=365),
):
    """Get RADD Score (0-100) for this workspace."""
    from radd.analytics.radd_score import calculate_radd_score
    async with get_db_session(current.workspace_id) as db:
        score = await calculate_radd_score(db, str(current.workspace_id), period_days)
    return {
        "total": score.total,
        "grade": score.grade,
        "summary_ar": score.summary_ar,
        "breakdown": {
            "automation": score.automation_score,
            "quality": score.quality_score,
            "escalation_health": score.escalation_score,
            "knowledge_coverage": score.knowledge_score,
            "customer_happiness": score.happiness_score,
        },
        "period_days": period_days,
    }


@router.get("/churn-radar")
@limiter.limit(settings.default_rate_limit)
async def get_churn_radar(
    request: Request,
    current: Annotated[CurrentUser, Depends(require_reviewer)],
    inactive_days: int = Query(45, ge=7, le=180),
    auto_winback: bool = Query(False),
):
    """Detect customers at churn risk. Optionally schedule win-back messages."""
    from radd.analytics.churn_radar import (
        get_churn_summary,
        scan_for_churn_risk,
        schedule_winback_for_at_risk,
    )
    async with get_db_session(current.workspace_id) as db:
        alerts = await scan_for_churn_risk(db, str(current.workspace_id), inactive_days)
        winback_scheduled = 0
        if auto_winback:
            winback_scheduled = await schedule_winback_for_at_risk(db, str(current.workspace_id), alerts)
    summary = get_churn_summary(alerts)
    return {
        "summary": summary,
        "winback_scheduled": winback_scheduled,
        "alerts": [
            {
                "customer_id": a.customer_id,
                "customer_tier": a.customer_tier,
                "risk_level": a.risk_level.value,
                "reason": a.reason,
                "days_inactive": a.days_inactive,
                "total_revenue": a.total_revenue,
                "suggested_action": a.suggested_action,
                "last_seen_at": a.last_seen_at,
            }
            for a in alerts[:100]
        ],
    }


@router.get("/agent-performance")
@limiter.limit(settings.default_rate_limit)
async def get_agent_performance(
    request: Request,
    current: Annotated[CurrentUser, Depends(require_admin)],
    period_days: int = Query(30, ge=7, le=365),
):
    """Get performance metrics for all agents."""
    from radd.analytics.agent_performance import get_agent_performance, get_team_summary
    async with get_db_session(current.workspace_id) as db:
        metrics = await get_agent_performance(db, str(current.workspace_id), period_days)
    summary = get_team_summary(metrics)
    return {
        "summary": summary,
        "agents": [
            {
                "user_id": m.user_id,
                "agent_name": m.agent_name,
                "total_assigned": m.total_assigned,
                "total_resolved": m.total_resolved,
                "resolution_rate": m.resolution_rate,
                "avg_resolution_minutes": m.avg_resolution_minutes,
                "avg_first_response_minutes": m.avg_first_response_minutes,
                "estimated_csat": m.estimated_csat,
            }
            for m in metrics
        ],
        "period_days": period_days,
    }


@router.get("/followups/stats")
@limiter.limit(settings.default_rate_limit)
async def get_followup_stats(
    request: Request,
    current: Annotated[CurrentUser, Depends(require_reviewer)],
):
    """Get follow-up queue statistics."""
    from radd.followups.scheduler import get_followup_stats
    async with get_db_session(current.workspace_id) as db:
        stats = await get_followup_stats(db, str(current.workspace_id))
    return stats


@router.post("/followups/process")
@limiter.limit("10/minute")
async def process_followups(
    request: Request,
    current: Annotated[CurrentUser, Depends(require_admin)],
):
    """Manually trigger follow-up processing (normally runs on schedule)."""
    from radd.followups.scheduler import process_due_followups
    async with get_db_session(current.workspace_id) as db:
        processed = await process_due_followups(db, str(current.workspace_id))
    return {"processed": len(processed), "items": processed}
