"""
RADD AI V2 — Tests for: Personas, Sales Engine, Return Prevention, 
Revenue Attribution, Operational Radar, Smart Rules, Conversation Stages, Starter Packs
"""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'apps', 'api'))


# ═══════════════════════════════════════════════
# AI Personas Tests
# ═══════════════════════════════════════════════

class TestPersonas:
    def test_sales_intent_selects_sales_persona(self):
        from radd.personas.engine import select_persona, PersonaType
        persona = select_persona("product_inquiry", True, 2)
        assert persona.type == PersonaType.SALES

    def test_support_intent_selects_support_persona(self):
        from radd.personas.engine import select_persona, PersonaType
        persona = select_persona("order_status", False, 2)
        assert persona.type == PersonaType.SUPPORT

    def test_greeting_first_turn_selects_receptionist(self):
        from radd.personas.engine import select_persona, PersonaType
        persona = select_persona("greeting", False, 1)
        assert persona.type == PersonaType.RECEPTIONIST

    def test_each_persona_has_different_prompt(self):
        from radd.personas.engine import PERSONAS, PersonaType
        prompts = set()
        for p in PERSONAS.values():
            prompts.add(p.system_prompt[:50])
        assert len(prompts) == 4  # 4 unique prompts (Receptionist, Sales, Support, Complaint Handler)

    def test_build_persona_prompt_injects_context(self):
        from radd.personas.engine import PERSONAS, PersonaType, build_persona_prompt
        prompt = build_persona_prompt(
            PERSONAS[PersonaType.SALES],
            store_name="متجر الورد",
            dialect="gulf",
            customer_context="عميل VIP",
            product_context="عطر عود 280 ريال",
        )
        assert "متجر الورد" in prompt
        assert "عميل VIP" in prompt
        assert "عطر عود" in prompt

    def test_persona_greeting_varies_by_type(self):
        from radd.personas.engine import get_persona_greeting, PersonaType
        g1 = get_persona_greeting(PersonaType.RECEPTIONIST, "gulf", "أحمد")
        g2 = get_persona_greeting(PersonaType.SALES, "gulf", "أحمد")
        g3 = get_persona_greeting(PersonaType.SUPPORT, "gulf", "أحمد")
        assert g1 != g2 != g3


# ═══════════════════════════════════════════════
# Conversation Stage Tests
# ═══════════════════════════════════════════════

class TestConversationStages:
    def test_product_inquiry_is_inquiry_stage(self):
        from radd.sales.engine import determine_stage, ConversationStage
        stage = determine_stage("product_inquiry", True, "عندكم عطر", 1)
        assert stage == ConversationStage.INQUIRY

    def test_comparison_is_consideration(self):
        from radd.sales.engine import determine_stage, ConversationStage
        stage = determine_stage("product_comparison", True, "ايهم افضل", 2)
        assert stage == ConversationStage.CONSIDERATION

    def test_hesitation_is_objection(self):
        from radd.sales.engine import determine_stage, ConversationStage
        stage = determine_stage("purchase_hesitation", True, "غالي", 3)
        assert stage == ConversationStage.OBJECTION

    def test_return_is_return_request(self):
        from radd.sales.engine import determine_stage, ConversationStage
        stage = determine_stage("return_policy", False, "ابي ارجع", 1)
        assert stage == ConversationStage.RETURN_REQUEST

    def test_complaint_detected(self):
        from radd.sales.engine import determine_stage, ConversationStage
        stage = determine_stage("general", False, "هذا أسوأ متجر", 1)
        assert stage == ConversationStage.COMPLAINT

    def test_order_status_is_post_purchase(self):
        from radd.sales.engine import determine_stage, ConversationStage
        stage = determine_stage("order_status", False, "وين طلبي", 1)
        assert stage == ConversationStage.POST_PURCHASE


# ═══════════════════════════════════════════════
# Return Prevention Tests
# ═══════════════════════════════════════════════

class TestReturnPrevention:
    def test_wrong_size_detected(self):
        from radd.returns.prevention import detect_return_reason, ReturnReason
        reason = detect_return_reason("المقاس كبير علي")
        assert reason == ReturnReason.WRONG_SIZE

    def test_defective_detected(self):
        from radd.returns.prevention import detect_return_reason, ReturnReason
        reason = detect_return_reason("المنتج خربان ومكسور")
        assert reason == ReturnReason.DEFECTIVE

    def test_changed_mind_detected(self):
        from radd.returns.prevention import detect_return_reason, ReturnReason
        reason = detect_return_reason("غيرت رأيي ما ابيه")
        assert reason == ReturnReason.CHANGED_MIND

    def test_defective_cannot_prevent(self):
        from radd.returns.prevention import generate_prevention_response, ReturnReason
        result = generate_prevention_response(ReturnReason.DEFECTIVE, "gulf")
        assert result.can_prevent is False

    def test_wrong_size_can_prevent(self):
        from radd.returns.prevention import generate_prevention_response, ReturnReason
        result = generate_prevention_response(ReturnReason.WRONG_SIZE, "gulf", "قميص", 200)
        assert result.can_prevent is True
        assert result.estimated_saved_amount == 200
        assert "تبديل" in result.response_text or "بدل" in result.response_text or "مقاس" in result.response_text

    def test_price_objection_offers_discount(self):
        from radd.returns.prevention import generate_prevention_response, ReturnReason
        result = generate_prevention_response(ReturnReason.TOO_EXPENSIVE, "gulf", "عطر", 300)
        assert result.can_prevent is True
        assert "خصم" in result.response_text

    def test_response_dialect_varies(self):
        from radd.returns.prevention import generate_prevention_response, ReturnReason
        gulf = generate_prevention_response(ReturnReason.WRONG_SIZE, "gulf")
        egyptian = generate_prevention_response(ReturnReason.WRONG_SIZE, "egyptian")
        assert gulf.response_text != egyptian.response_text


# ═══════════════════════════════════════════════
# Revenue Attribution Tests
# ═══════════════════════════════════════════════

class TestRevenue:
    def test_format_briefing_empty(self):
        from radd.revenue.attribution import RevenueSummary, format_revenue_for_briefing
        summary = RevenueSummary("this_month", 0, 0, 0, 0, 0, 0, 0, 499, 0)
        result = format_revenue_for_briefing(summary)
        assert result == ""

    def test_format_briefing_with_data(self):
        from radd.revenue.attribution import RevenueSummary, format_revenue_for_briefing
        summary = RevenueSummary(
            period="this_month",
            total_attributed=55000,
            assisted_sales=40000, assisted_sales_count=20,
            returns_prevented=10000, returns_prevented_count=8,
            carts_recovered=5000, carts_recovered_count=5,
            subscription_cost=499,
            roi_multiple=110.2,
        )
        result = format_revenue_for_briefing(summary)
        assert "55,000" in result
        assert "110.2x" in result
        assert "20 بيعة" in result

    def test_roi_calculation(self):
        from radd.revenue.attribution import RevenueSummary
        s = RevenueSummary("m", 5000, 5000, 10, 0, 0, 0, 0, 499, round(5000/499, 1))
        assert s.roi_multiple == 10.0


# ═══════════════════════════════════════════════
# Smart Rules Tests
# ═══════════════════════════════════════════════

class TestSmartRules:
    def test_vip_complaint_matches(self):
        from radd.rules.engine import evaluate_rules, DEFAULT_RULES, ActionType
        result = evaluate_rules(DEFAULT_RULES, "general", "vip", "complaint", "", 14)
        assert result.matched is True
        assert result.action_type == ActionType.ESCALATE_OWNER

    def test_return_matches_prevention(self):
        from radd.rules.engine import evaluate_rules, DEFAULT_RULES, ActionType
        result = evaluate_rules(DEFAULT_RULES, "return_policy", "standard", "return_request", "", 14)
        assert result.matched is True
        assert result.action_type == ActionType.TRY_PREVENTION

    def test_night_time_adjusts_confidence(self):
        from radd.rules.engine import evaluate_rules, DEFAULT_RULES, ActionType
        result = evaluate_rules(DEFAULT_RULES, "general", "standard", "unknown", "", 23)
        assert result.matched is True
        assert result.action_type == ActionType.ADJUST_CONFIDENCE

    def test_daytime_no_night_rule(self):
        from radd.rules.engine import evaluate_rules, DEFAULT_RULES
        result = evaluate_rules(DEFAULT_RULES, "greeting", "standard", "unknown", "مرحبا", 14)
        # Should NOT match night guard at 2 PM
        if result.matched:
            assert result.rule.id != "default_night_guard"

    def test_threat_keyword_escalates(self):
        from radd.rules.engine import evaluate_rules, DEFAULT_RULES, ActionType
        result = evaluate_rules(DEFAULT_RULES, "general", "standard", "complaint", "بنشر تقييم سلبي", 14)
        assert result.matched is True
        assert result.action_type == ActionType.ESCALATE_OWNER

    def test_sales_intent_uses_persona(self):
        from radd.rules.engine import evaluate_rules, DEFAULT_RULES, ActionType
        result = evaluate_rules(DEFAULT_RULES, "product_inquiry", "standard", "inquiry", "عندكم عطر", 14)
        assert result.matched is True
        assert result.action_type == ActionType.USE_PERSONA
        assert result.action_value == "sales"

    def test_priority_order(self):
        """Higher priority rules should match first."""
        from radd.rules.engine import evaluate_rules, DEFAULT_RULES, ActionType
        # VIP complaint + threat keyword — both should match, but threat (95) > VIP (100) wait...
        # Actually VIP+complaint is priority 100, threat is 95. So VIP wins.
        result = evaluate_rules(DEFAULT_RULES, "general", "vip", "complaint", "بنشر تقييم", 14)
        assert result.matched is True
        assert result.rule.priority >= 95

    def test_apply_rule_action(self):
        from radd.rules.engine import apply_rule_action, RuleMatchResult, SmartRule, TriggerType, ActionType
        rule = SmartRule("test", "test", "test", TriggerType.INTENT, "x", ActionType.ESCALATE_OWNER, "owner")
        match = RuleMatchResult(True, rule, ActionType.ESCALATE_OWNER, "owner")
        action = apply_rule_action(match)
        assert action["force_escalation"] is True
        assert action["escalation_target"] == "owner"


# ═══════════════════════════════════════════════
# Starter Packs Tests
# ═══════════════════════════════════════════════

class TestStarterPacks:
    def test_perfumes_pack_exists(self):
        from radd.sales.engine import get_starter_pack
        pack = get_starter_pack("perfumes")
        assert pack is not None
        assert pack.sector_ar == "عطور ومستحضرات تجميل"
        assert len(pack.kb_documents) >= 3

    def test_fashion_pack_exists(self):
        from radd.sales.engine import get_starter_pack
        pack = get_starter_pack("fashion")
        assert pack is not None
        assert len(pack.kb_documents) >= 2

    def test_electronics_pack_exists(self):
        from radd.sales.engine import get_starter_pack
        pack = get_starter_pack("electronics")
        assert pack is not None

    def test_nonexistent_sector_returns_none(self):
        from radd.sales.engine import get_starter_pack
        assert get_starter_pack("spaceship") is None

    def test_available_sectors(self):
        from radd.sales.engine import get_available_sectors
        sectors = get_available_sectors()
        assert len(sectors) >= 4
        names = [s["id"] for s in sectors]
        assert "perfumes" in names
        assert "fashion" in names

    def test_pack_has_custom_keywords(self):
        from radd.sales.engine import get_starter_pack
        pack = get_starter_pack("perfumes")
        assert "product_inquiry" in pack.custom_keywords
        assert "EDP" in pack.custom_keywords["product_inquiry"]


# ═══════════════════════════════════════════════
# Salla Auto-Sync Tests
# ═══════════════════════════════════════════════

class TestSallaSync:
    def test_product_to_kb_content(self):
        from radd.onboarding.salla_sync import SallaProduct, product_to_kb_content
        product = SallaProduct(
            id="123", name="عود ملكي", price=280,
            description="عطر عود فاخر", in_stock=True,
            sizes=["50ml", "100ml"], colors=["ذهبي"],
        )
        content = product_to_kb_content(product)
        assert "عود ملكي" in content
        assert "280" in content
        assert "متوفر" in content
        assert "50ml" in content

    def test_out_of_stock_product(self):
        from radd.onboarding.salla_sync import SallaProduct, product_to_kb_content
        product = SallaProduct(id="456", name="عطر نادر", price=500, description="", in_stock=False)
        content = product_to_kb_content(product)
        assert "نفد" in content

    def test_low_stock_warning(self):
        from radd.onboarding.salla_sync import SallaProduct, product_to_kb_content
        product = SallaProduct(id="789", name="عطر محدود", price=350, description="", in_stock=True, quantity=3)
        content = product_to_kb_content(product)
        assert "3 فقط" in content

    def test_store_policies_to_kb(self):
        from radd.onboarding.salla_sync import SallaStoreInfo, store_policies_to_kb_content
        store = SallaStoreInfo(
            name="متجر الورد",
            description="متجر عطور",
            return_policy="الإرجاع خلال 14 يوم",
            shipping_policy="شحن مجاني فوق 200 ريال",
            payment_methods=["مدى", "فيزا", "تمارا"],
        )
        docs = store_policies_to_kb_content(store)
        assert len(docs) >= 3  # return + shipping + payment
        titles = [d["title"] for d in docs]
        assert "سياسة الإرجاع والاسترداد" in titles


if __name__ == "__main__":
    import pytest
    pytest.main([__file__, "-v"])
