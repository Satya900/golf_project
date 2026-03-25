from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
import json
import random
import hashlib
import hmac
import base64
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timezone, date, timedelta
from supabase import create_client
from collections import Counter

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Supabase clients
supabase_url = os.environ['SUPABASE_URL']
supabase_anon_key = os.environ['SUPABASE_ANON_KEY']
supabase_service_key = os.environ['SUPABASE_SERVICE_ROLE_KEY']

supabase = create_client(supabase_url, supabase_anon_key)
supabase_admin = create_client(supabase_url, supabase_service_key)

# Polar config
POLAR_ACCESS_TOKEN = os.environ.get('POLAR_ACCESS_TOKEN', '')
POLAR_WEBHOOK_SECRET = os.environ.get('POLAR_WEBHOOK_SECRET', '')
POLAR_ORG_ID = os.environ.get('POLAR_ORGANIZATION_ID', '')
POLAR_MONTHLY_ID = os.environ.get('POLAR_MONTHLY_PRODUCT_ID', '')
POLAR_YEARLY_ID = os.environ.get('POLAR_YEARLY_PRODUCT_ID', '')

app = FastAPI()
api_router = APIRouter(prefix="/api")
security = HTTPBearer(auto_error=False)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ===================== AUTH HELPERS =====================

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = credentials.credentials
    try:
        user_resp = supabase_admin.auth.get_user(token)
        if not user_resp or not user_resp.user:
            raise HTTPException(status_code=401, detail="Invalid token")
        return {"id": str(user_resp.user.id), "email": user_resp.user.email, "token": token}
    except Exception as e:
        logger.error(f"Auth error: {e}")
        raise HTTPException(status_code=401, detail="Invalid token")

def require_admin(user=Depends(get_current_user)):
    profile = supabase_admin.table("profiles").select("role").eq("id", user["id"]).single().execute()
    if not profile.data or profile.data.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

# ===================== MODELS =====================

class SignupRequest(BaseModel):
    email: str
    password: str
    full_name: str = ""

class LoginRequest(BaseModel):
    email: str
    password: str

class ScoreCreate(BaseModel):
    score: int = Field(ge=1, le=45)
    played_date: str

class CharitySelect(BaseModel):
    charity_id: str
    contribution_pct: int = Field(ge=10, le=100, default=10)

class CheckoutRequest(BaseModel):
    product_id: str

class CharityCreate(BaseModel):
    name: str
    description: str = ""
    image_url: str = ""
    website_url: str = ""
    category: str = ""
    featured: bool = False

class DrawCreate(BaseModel):
    draw_date: str
    draw_type: str = "random"

class WinnerVerify(BaseModel):
    status: str

class ProofUpload(BaseModel):
    proof_image_url: str

class ScoreUpdate(BaseModel):
    score: int = Field(ge=1, le=45)
    played_date: str

# ===================== AUTH ROUTES =====================

@api_router.post("/auth/signup")
async def signup(req: SignupRequest):
    try:
        # Create user with admin API for auto-confirmation
        result = supabase_admin.auth.admin.create_user({
            "email": req.email,
            "password": req.password,
            "email_confirm": True,
            "user_metadata": {"full_name": req.full_name}
        })
        if result.user:
            # Now sign in to get a session token
            login_result = supabase.auth.sign_in_with_password({
                "email": req.email,
                "password": req.password
            })
            token = login_result.session.access_token if login_result.session else None
            return {
                "user": {"id": str(result.user.id), "email": result.user.email, "full_name": req.full_name, "role": "user"},
                "token": token,
                "message": "Account created successfully"
            }
        raise HTTPException(status_code=400, detail="Signup failed")
    except Exception as e:
        logger.error(f"Signup error: {e}")
        detail = str(e)
        if "already" in detail.lower() or "duplicate" in detail.lower():
            detail = "An account with this email already exists"
        raise HTTPException(status_code=400, detail=detail)

@api_router.post("/auth/login")
async def login(req: LoginRequest):
    try:
        result = supabase.auth.sign_in_with_password({"email": req.email, "password": req.password})
        if result.user and result.session:
            profile = supabase_admin.table("profiles").select("*").eq("id", str(result.user.id)).single().execute()
            return {
                "user": {
                    "id": str(result.user.id),
                    "email": result.user.email,
                    "full_name": profile.data.get("full_name", "") if profile.data else "",
                    "role": profile.data.get("role", "user") if profile.data else "user",
                },
                "token": result.session.access_token
            }
        raise HTTPException(status_code=401, detail="Invalid credentials")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise HTTPException(status_code=401, detail="Invalid credentials")

@api_router.get("/auth/me")
async def get_me(user=Depends(get_current_user)):
    profile = supabase_admin.table("profiles").select("*, charities(name)").eq("id", user["id"]).single().execute()
    if not profile.data:
        raise HTTPException(status_code=404, detail="Profile not found")
    sub = supabase_admin.table("subscriptions").select("*").eq("user_id", user["id"]).eq("status", "active").order("created_at", desc=True).limit(1).execute()
    p = profile.data
    p.pop("charities", None)
    return {
        **p,
        "subscription": sub.data[0] if sub.data else None,
    }

# ===================== SCORE ROUTES =====================

@api_router.get("/scores")
async def get_scores(user=Depends(get_current_user)):
    scores = supabase_admin.table("scores").select("*").eq("user_id", user["id"]).order("played_date", desc=True).limit(5).execute()
    return scores.data or []

@api_router.post("/scores")
async def add_score(req: ScoreCreate, user=Depends(get_current_user)):
    # Check subscription status
    sub = supabase_admin.table("subscriptions").select("status").eq("user_id", user["id"]).eq("status", "active").limit(1).execute()
    if not sub.data:
        raise HTTPException(status_code=403, detail="Active subscription required to enter scores")

    existing = supabase_admin.table("scores").select("id, played_date").eq("user_id", user["id"]).order("played_date", desc=True).execute()
    scores = existing.data or []

    # If we already have 5 scores, delete the oldest
    if len(scores) >= 5:
        oldest = scores[-1]
        supabase_admin.table("scores").delete().eq("id", oldest["id"]).execute()

    result = supabase_admin.table("scores").insert({
        "user_id": user["id"],
        "score": req.score,
        "played_date": req.played_date,
    }).execute()
    return result.data[0] if result.data else {}

@api_router.delete("/scores/{score_id}")
async def delete_score(score_id: str, user=Depends(get_current_user)):
    supabase_admin.table("scores").delete().eq("id", score_id).eq("user_id", user["id"]).execute()
    return {"message": "Score deleted"}

# ===================== SUBSCRIPTION ROUTES =====================

@api_router.post("/subscriptions/checkout")
async def create_checkout(req: CheckoutRequest, user=Depends(get_current_user)):
    try:
        import httpx
        profile = supabase_admin.table("profiles").select("email").eq("id", user["id"]).single().execute()
        email = profile.data["email"] if profile.data else user["email"]

        plan = "month" if req.product_id == POLAR_MONTHLY_ID else "year"
        app_url = os.environ.get("APP_URL", "https://compare-files-3.preview.emergentagent.com")

        async with httpx.AsyncClient() as client:
            resp = await client.post(
                "https://sandbox-api.polar.sh/v1/checkouts/custom/",
                headers={
                    "Authorization": f"Bearer {POLAR_ACCESS_TOKEN}",
                    "Content-Type": "application/json",
                },
                json={
                    "product_id": req.product_id,
                    "customer_email": email,
                    "success_url": f"{app_url}/subscription/success?plan={plan}",
                    "metadata": {"user_id": user["id"], "plan": plan},
                }
            )
            data = resp.json()
            if resp.status_code >= 400:
                logger.error(f"Polar checkout error: {data}")
                raise HTTPException(status_code=400, detail=f"Checkout failed: {data}")
            return {"checkout_url": data.get("url"), "checkout_id": data.get("id")}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Checkout error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/subscriptions/me")
async def get_my_subscription(user=Depends(get_current_user)):
    sub = supabase_admin.table("subscriptions").select("*").eq("user_id", user["id"]).order("created_at", desc=True).limit(1).execute()
    return sub.data[0] if sub.data else None

@api_router.get("/subscriptions/portal")
async def get_portal_url(user=Depends(get_current_user)):
    try:
        import httpx
        profile = supabase_admin.table("profiles").select("polar_customer_id").eq("id", user["id"]).single().execute()
        customer_id = profile.data.get("polar_customer_id") if profile.data else None
        if not customer_id:
            raise HTTPException(status_code=404, detail="No billing account found")
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                "https://sandbox-api.polar.sh/v1/customer-sessions/",
                headers={"Authorization": f"Bearer {POLAR_ACCESS_TOKEN}", "Content-Type": "application/json"},
                json={"customer_id": customer_id}
            )
            data = resp.json()
            return {"portal_url": data.get("customer_portal_url")}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Portal error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ===================== CHARITY ROUTES =====================

@api_router.get("/charities")
async def get_charities():
    result = supabase_admin.table("charities").select("*").order("featured", desc=True).order("name").execute()
    return result.data or []

@api_router.get("/charities/{charity_id}")
async def get_charity(charity_id: str):
    result = supabase_admin.table("charities").select("*").eq("id", charity_id).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Charity not found")
    return result.data

@api_router.post("/charities/select")
async def select_charity(req: CharitySelect, user=Depends(get_current_user)):
    supabase_admin.table("profiles").update({
        "selected_charity_id": req.charity_id,
        "charity_contribution_pct": req.contribution_pct
    }).eq("id", user["id"]).execute()
    return {"message": "Charity selected"}

# ===================== DRAW ROUTES =====================

@api_router.get("/draws")
async def get_draws():
    result = supabase_admin.table("draws").select("*").eq("status", "published").order("draw_date", desc=True).execute()
    return result.data or []

@api_router.get("/draws/{draw_id}")
async def get_draw(draw_id: str):
    draw = supabase_admin.table("draws").select("*").eq("id", draw_id).single().execute()
    if not draw.data:
        raise HTTPException(status_code=404, detail="Draw not found")
    results = supabase_admin.table("draw_results").select("*, profiles(full_name, email)").eq("draw_id", draw_id).execute()
    return {**draw.data, "results": results.data or []}

@api_router.get("/draws/my-results")
async def get_my_results(user=Depends(get_current_user)):
    results = supabase_admin.table("draw_results").select("*, draws(draw_date, winning_numbers)").eq("user_id", user["id"]).order("created_at", desc=True).execute()
    return results.data or []

# ===================== WINNER ROUTES =====================

@api_router.post("/winners/{result_id}/proof")
async def upload_proof(result_id: str, req: ProofUpload, user=Depends(get_current_user)):
    supabase_admin.table("draw_results").update({
        "proof_image_url": req.proof_image_url,
        "verification_status": "submitted"
    }).eq("id", result_id).eq("user_id", user["id"]).execute()
    return {"message": "Proof uploaded"}

# ===================== ADMIN ROUTES =====================

@api_router.get("/admin/users")
async def admin_get_users(user=Depends(require_admin)):
    users = supabase_admin.table("profiles").select("*").order("created_at", desc=True).execute()
    return users.data or []

@api_router.get("/admin/users/{user_id}")
async def admin_get_user(user_id: str, user=Depends(require_admin)):
    profile = supabase_admin.table("profiles").select("*").eq("id", user_id).single().execute()
    scores = supabase_admin.table("scores").select("*").eq("user_id", user_id).order("played_date", desc=True).execute()
    sub = supabase_admin.table("subscriptions").select("*").eq("user_id", user_id).order("created_at", desc=True).limit(1).execute()
    return {
        "profile": profile.data,
        "scores": scores.data or [],
        "subscription": sub.data[0] if sub.data else None
    }

@api_router.put("/admin/users/{user_id}")
async def admin_update_user(user_id: str, data: dict, user=Depends(require_admin)):
    allowed = {"full_name", "role", "charity_contribution_pct", "selected_charity_id"}
    updates = {k: v for k, v in data.items() if k in allowed}
    supabase_admin.table("profiles").update(updates).eq("id", user_id).execute()
    return {"message": "User updated"}

@api_router.put("/admin/users/{user_id}/scores/{score_id}")
async def admin_update_score(user_id: str, score_id: str, req: ScoreUpdate, user=Depends(require_admin)):
    supabase_admin.table("scores").update({
        "score": req.score,
        "played_date": req.played_date
    }).eq("id", score_id).eq("user_id", user_id).execute()
    return {"message": "Score updated"}

@api_router.get("/admin/subscriptions")
async def admin_get_subscriptions(user=Depends(require_admin)):
    subs = supabase_admin.table("subscriptions").select("*, profiles(full_name, email)").order("created_at", desc=True).execute()
    return subs.data or []

@api_router.get("/admin/charities")
async def admin_get_charities(user=Depends(require_admin)):
    return (supabase_admin.table("charities").select("*").order("name").execute()).data or []

@api_router.post("/admin/charities")
async def admin_create_charity(req: CharityCreate, user=Depends(require_admin)):
    result = supabase_admin.table("charities").insert(req.model_dump()).execute()
    return result.data[0] if result.data else {}

@api_router.put("/admin/charities/{charity_id}")
async def admin_update_charity(charity_id: str, data: dict, user=Depends(require_admin)):
    supabase_admin.table("charities").update(data).eq("id", charity_id).execute()
    return {"message": "Charity updated"}

@api_router.delete("/admin/charities/{charity_id}")
async def admin_delete_charity(charity_id: str, user=Depends(require_admin)):
    supabase_admin.table("charities").delete().eq("id", charity_id).execute()
    return {"message": "Charity deleted"}

# ===================== DRAW ADMIN =====================

def generate_winning_numbers():
    return sorted(random.sample(range(1, 46), 5))

def algorithmic_draw(draw_id: str):
    """Generate numbers weighted by most/least frequent user scores"""
    scores = supabase_admin.table("scores").select("score").execute()
    if not scores.data or len(scores.data) < 5:
        return generate_winning_numbers()
    counter = Counter(s["score"] for s in scores.data)
    all_scores = list(range(1, 46))
    weights = [counter.get(s, 1) for s in all_scores]
    return sorted(random.choices(all_scores, weights=weights, k=5))

def calculate_prize_pool():
    active = supabase_admin.table("subscriptions").select("plan").eq("status", "active").execute()
    count = len(active.data) if active.data else 0
    monthly_rate = 10.0
    yearly_rate = 8.33
    total = 0
    for s in (active.data or []):
        total += monthly_rate if s["plan"] == "month" else yearly_rate
    prize_portion = total * 0.6
    return {
        "total": round(prize_portion, 2),
        "five_match": round(prize_portion * 0.40, 2),
        "four_match": round(prize_portion * 0.35, 2),
        "three_match": round(prize_portion * 0.25, 2),
        "subscriber_count": count,
    }

def find_winners(draw_id: str, winning_numbers: list):
    """Find all subscribers whose latest 5 scores match the winning numbers"""
    users = supabase_admin.table("subscriptions").select("user_id").eq("status", "active").execute()
    winners = []
    for u in (users.data or []):
        scores = supabase_admin.table("scores").select("score").eq("user_id", u["user_id"]).order("played_date", desc=True).limit(5).execute()
        user_scores = sorted([s["score"] for s in (scores.data or [])])
        winning_set = set(winning_numbers)
        user_set = set(user_scores)
        matched = winning_set & user_set
        if len(matched) >= 3:
            match_type = f"{len(matched)}-match"
            winners.append({
                "draw_id": draw_id,
                "user_id": u["user_id"],
                "match_type": match_type,
                "matched_numbers": sorted(list(matched)),
            })
    return winners

@api_router.get("/admin/draws")
async def admin_get_draws(user=Depends(require_admin)):
    draws = supabase_admin.table("draws").select("*").order("draw_date", desc=True).execute()
    return draws.data or []

@api_router.post("/admin/draws")
async def admin_create_draw(req: DrawCreate, user=Depends(require_admin)):
    result = supabase_admin.table("draws").insert({
        "draw_date": req.draw_date,
        "draw_type": req.draw_type,
        "created_by": user["id"],
        "winning_numbers": [],
    }).execute()
    return result.data[0] if result.data else {}

@api_router.post("/admin/draws/{draw_id}/run")
async def admin_run_draw(draw_id: str, user=Depends(require_admin)):
    draw = supabase_admin.table("draws").select("*").eq("id", draw_id).single().execute()
    if not draw.data:
        raise HTTPException(status_code=404, detail="Draw not found")
    if draw.data["status"] == "published":
        raise HTTPException(status_code=400, detail="Draw already published")

    draw_type = draw.data.get("draw_type", "random")
    winning = algorithmic_draw(draw_id) if draw_type == "algorithmic" else generate_winning_numbers()
    pool = calculate_prize_pool()

    # Find previous jackpot rollover
    prev_draws = supabase_admin.table("draws").select("jackpot_rollover").eq("status", "published").order("draw_date", desc=True).limit(1).execute()
    rollover = prev_draws.data[0]["jackpot_rollover"] if prev_draws.data else 0

    supabase_admin.table("draws").update({
        "winning_numbers": winning,
        "total_prize_pool": pool["total"],
        "five_match_pool": pool["five_match"] + rollover,
        "four_match_pool": pool["four_match"],
        "three_match_pool": pool["three_match"],
        "status": "simulated",
    }).eq("id", draw_id).execute()

    # Find winners and create results
    winners = find_winners(draw_id, winning)
    five_winners = [w for w in winners if w["match_type"] == "5-match"]
    four_winners = [w for w in winners if w["match_type"] == "4-match"]
    three_winners = [w for w in winners if w["match_type"] == "3-match"]

    five_pool = pool["five_match"] + rollover
    four_pool = pool["four_match"]
    three_pool = pool["three_match"]

    new_rollover = 0
    if not five_winners:
        new_rollover = five_pool

    for w in five_winners:
        w["prize_amount"] = round(five_pool / len(five_winners), 2)
    for w in four_winners:
        w["prize_amount"] = round(four_pool / len(four_winners), 2) if four_winners else 0
    for w in three_winners:
        w["prize_amount"] = round(three_pool / len(three_winners), 2) if three_winners else 0

    # Delete old results for this draw
    supabase_admin.table("draw_results").delete().eq("draw_id", draw_id).execute()

    for w in winners:
        supabase_admin.table("draw_results").insert(w).execute()

    if new_rollover > 0:
        supabase_admin.table("draws").update({"jackpot_rollover": new_rollover}).eq("id", draw_id).execute()

    updated = supabase_admin.table("draws").select("*").eq("id", draw_id).single().execute()
    return {
        **updated.data,
        "winners_count": len(winners),
        "results": winners,
    }

@api_router.post("/admin/draws/{draw_id}/simulate")
async def admin_simulate_draw(draw_id: str, user=Depends(require_admin)):
    return await admin_run_draw(draw_id, user)

@api_router.post("/admin/draws/{draw_id}/publish")
async def admin_publish_draw(draw_id: str, user=Depends(require_admin)):
    draw = supabase_admin.table("draws").select("*").eq("id", draw_id).single().execute()
    if not draw.data:
        raise HTTPException(status_code=404, detail="Draw not found")
    if draw.data["status"] == "published":
        raise HTTPException(status_code=400, detail="Already published")
    if draw.data["status"] == "pending":
        raise HTTPException(status_code=400, detail="Run the draw first")

    supabase_admin.table("draws").update({
        "status": "published",
        "published_at": datetime.now(timezone.utc).isoformat(),
    }).eq("id", draw_id).execute()
    return {"message": "Draw published"}

@api_router.get("/admin/winners")
async def admin_get_winners(user=Depends(require_admin)):
    results = supabase_admin.table("draw_results").select("*, profiles(full_name, email), draws(draw_date, winning_numbers)").order("created_at", desc=True).execute()
    return results.data or []

@api_router.put("/admin/winners/{result_id}/verify")
async def admin_verify_winner(result_id: str, req: WinnerVerify, user=Depends(require_admin)):
    updates = {"verification_status": req.status}
    if req.status == "approved":
        updates["verified_at"] = datetime.now(timezone.utc).isoformat()
    supabase_admin.table("draw_results").update(updates).eq("id", result_id).execute()
    return {"message": f"Winner {req.status}"}

@api_router.put("/admin/winners/{result_id}/pay")
async def admin_mark_paid(result_id: str, user=Depends(require_admin)):
    supabase_admin.table("draw_results").update({
        "payment_status": "paid",
        "paid_at": datetime.now(timezone.utc).isoformat(),
    }).eq("id", result_id).execute()
    return {"message": "Marked as paid"}

# ===================== ADMIN REPORTS =====================

@api_router.get("/admin/reports")
async def admin_get_reports(user=Depends(require_admin)):
    users = supabase_admin.table("profiles").select("id", count="exact").execute()
    active_subs = supabase_admin.table("subscriptions").select("id", count="exact").eq("status", "active").execute()
    pool = calculate_prize_pool()
    contributions = supabase_admin.table("charity_contributions").select("amount").execute()
    total_charity = sum(c["amount"] for c in (contributions.data or []))
    draws_published = supabase_admin.table("draws").select("id", count="exact").eq("status", "published").execute()
    winners_total = supabase_admin.table("draw_results").select("id, prize_amount").execute()

    return {
        "total_users": users.count or 0,
        "active_subscribers": active_subs.count or 0,
        "prize_pool": pool,
        "total_charity_contributions": round(total_charity, 2),
        "total_draws": draws_published.count or 0,
        "total_winners": len(winners_total.data) if winners_total.data else 0,
        "total_prizes_awarded": round(sum(w.get("prize_amount", 0) for w in (winners_total.data or [])), 2),
    }

# ===================== WEBHOOK ROUTES =====================

@api_router.post("/webhooks/polar")
async def handle_polar_webhook(request: Request, background_tasks: BackgroundTasks):
    try:
        body = await request.body()
        payload = json.loads(body)
        event_type = payload.get("type", "")
        data = payload.get("data", {})

        logger.info(f"Polar webhook: {event_type}")

        if event_type == "subscription.created":
            background_tasks.add_task(process_subscription_created, data)
        elif event_type == "subscription.updated":
            background_tasks.add_task(process_subscription_updated, data)
        elif event_type == "subscription.revoked":
            background_tasks.add_task(process_subscription_revoked, data)
        elif event_type == "order.created":
            background_tasks.add_task(process_order_created, data)

        return {"status": "accepted", "event_type": event_type}
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        return {"status": "error"}

def process_subscription_created(data):
    try:
        metadata = data.get("metadata", {})
        user_id = metadata.get("user_id")
        plan = metadata.get("plan", "month")
        sub_id = data.get("id")
        customer_id = data.get("customer_id")

        if user_id:
            supabase_admin.table("profiles").update({"polar_customer_id": customer_id}).eq("id", user_id).execute()

        sub_data = {
            "polar_subscription_id": sub_id,
            "polar_customer_id": customer_id,
            "user_id": user_id,
            "product_id": data.get("product_id"),
            "plan": plan,
            "status": data.get("status", "active"),
            "current_period_start": data.get("current_period_start"),
            "current_period_end": data.get("current_period_end"),
            "cancel_at_period_end": data.get("cancel_at_period_end", False),
        }
        supabase_admin.table("subscriptions").upsert(sub_data, on_conflict="polar_subscription_id").execute()
        logger.info(f"Subscription created: {sub_id}")
    except Exception as e:
        logger.error(f"Process sub created error: {e}")

def process_subscription_updated(data):
    try:
        sub_id = data.get("id")
        supabase_admin.table("subscriptions").update({
            "status": data.get("status"),
            "current_period_start": data.get("current_period_start"),
            "current_period_end": data.get("current_period_end"),
            "cancel_at_period_end": data.get("cancel_at_period_end", False),
        }).eq("polar_subscription_id", sub_id).execute()
        logger.info(f"Subscription updated: {sub_id}")
    except Exception as e:
        logger.error(f"Process sub updated error: {e}")

def process_subscription_revoked(data):
    try:
        sub_id = data.get("id")
        supabase_admin.table("subscriptions").update({"status": "revoked"}).eq("polar_subscription_id", sub_id).execute()
        logger.info(f"Subscription revoked: {sub_id}")
    except Exception as e:
        logger.error(f"Process sub revoked error: {e}")

def process_order_created(data):
    try:
        order_id = data.get("id")
        existing = supabase_admin.table("orders").select("id").eq("polar_order_id", order_id).execute()
        if existing.data:
            return

        supabase_admin.table("orders").insert({
            "polar_order_id": order_id,
            "user_id": data.get("metadata", {}).get("user_id"),
            "amount": data.get("amount"),
            "currency": data.get("currency", "usd"),
            "billing_reason": data.get("billing_reason"),
            "status": data.get("status"),
        }).execute()

        if data.get("billing_reason") == "subscription_cycle":
            user_id = data.get("metadata", {}).get("user_id")
            if user_id:
                process_charity_contribution(user_id, data.get("amount", 0))
        logger.info(f"Order created: {order_id}")
    except Exception as e:
        logger.error(f"Process order error: {e}")

def process_charity_contribution(user_id, amount):
    try:
        profile = supabase_admin.table("profiles").select("selected_charity_id, charity_contribution_pct").eq("id", user_id).single().execute()
        if profile.data and profile.data.get("selected_charity_id"):
            pct = profile.data.get("charity_contribution_pct", 10) / 100
            contribution = round(amount * pct / 100, 2)
            supabase_admin.table("charity_contributions").insert({
                "user_id": user_id,
                "charity_id": profile.data["selected_charity_id"],
                "amount": contribution,
            }).execute()
            supabase_admin.rpc("increment_charity_total", {"charity_id_input": profile.data["selected_charity_id"], "amount_input": contribution}).execute()
    except Exception as e:
        logger.error(f"Charity contribution error: {e}")

# ===================== ROOT =====================

@api_router.get("/")
async def root():
    return {"message": "Golf Charity Platform API", "version": "1.0.0"}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)
