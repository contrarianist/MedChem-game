from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import GameSession, PuzzleAttempt, StudentBadge
from .serializers import (
    GameSessionSerializer,
    PuzzleSubmitSerializer,
    StudentBadgeSerializer,
)

# کلید پاسخ‌های علمی و اعتبارسنجی سرورساید معماها
PUZZLE_SOLUTIONS = {
    # مرحله ورود
    ("entrance", "steroid_core"): {
        "type": "set_match",
        "expected": ["ring_a", "ring_b", "ring_c", "ring_d", "c17_sidechain"],
        "base_score": 150,
        "clue": None,
        "feedback_ok": "اسکلت سیکلوپنتانوپرهیدروفنانترن با موفقیت سنتز شد. گیت امنیتی R&D باز شد.",
        "feedback_err": "چیدمان حلقه‌های A، B، C و D یا زنجیره جانبی C17 صحیح نیست. ساختار پایه استروئید را بررسی کنید.",
    },
    # دپارتمان ۱: گلوکوکورتیکوئیدها
    ("glucocorticoid", "conformation_lock"): {
        "type": "exact_dict",
        "expected": {"H8": "beta", "H9": "alpha", "H14": "alpha"},
        "base_score": 200,
        "clue": None,
        "feedback_ok": "کانفورماسیون ترانس-آنتی-ترانس (8β, 9α, 14α) تایید شد. قفل پنل آزمایشگاه باز شد.",
        "feedback_err": "آرایش فضایی هیدروژن‌ها در اتصال حلقه‌های B/C و C/D با ایزومر فعال کورتیزول مطابقت ندارد.",
    },
    ("glucocorticoid", "sar_potency_sort"): {
        "type": "exact_list",
        "expected": ["5", "3", "4", "6", "2", "1"],
        "base_score": 250,
        "clue": {
            "id": "clue_gc_fluorine",
            "title": "سرنخ اول: فلوئوریناسیون در موقعیت 9α",
            "detail": "اهریمن یک گلوکوکورتیکوئید بسیار قوی حاوی اتم فلوئور (9α-F) و پیوند دوگانه C1=C2 است.",
        },
        "feedback_ok": "ترتیب قدرت ضدالتهابی (5 > 3 > 4 > 6 > 2 > 1) کاملاً دقیق است! وجود 9α-فلوئور و استخلاف C16 قدرت را به حداکثر رسانده است.",
        "feedback_err": "ترتیب قدرت صحیح نیست. به نقش پیوند دوگانه Δ1، فلوئور در کربن 9α و متیل/هیدروکسیل در C16 دقت کنید.",
    },
    # دپارتمان ۲: مینرالوکورتیکوئیدها
    ("mineralocorticoid", "effect_arrows"): {
        "type": "exact_dict",
        "expected": {
            "anti_inflammatory": "up",
            "half_life": "up",
            "mineralocorticoid": "down",
        },
        "base_score": 200,
        "clue": None,
        "feedback_ok": "تحلیل مقایسه‌ای کاملاً صحیح است! وجود متیل 6α و Δ1 اثر ضدالتهابی و نیمه‌عمر را افزایش و احتباس سدیم را کاهش می‌دهد.",
        "feedback_err": "مقایسه اثرات صحیح نیست. به اثر استخلاف متیل در حلقه B و پیوند دوگانه Δ1 بر کاهش اثر مینرالوکورتیکوئیدی دقت کنید.",
    },
    ("mineralocorticoid", "route_classification"): {
        "type": "bucket_sets",
        "expected": {
            "systemic": ["1", "5", "8"],
            "topical": ["2", "6", "7"],
            "inhalation": ["3", "4", "9"],
        },
        "base_score": 250,
        "clue": {
            "id": "clue_mc_topical",
            "title": "سرنخ دوم: تجویز موضعی (Topical)",
            "detail": "اهریمن برای اثرگذاری متمرکز و حداکثر لیپوفیلیته موضعی (استونیدها و استرهای C17/C21) طراحی شده است.",
        },
        "feedback_ok": "تفکیک مسیرهای تجویز کاملاً دقیق است! ترکیبات ۲، ۶ و ۷ (استونیدها و دی‌استرهای لیپوفیل) برای مصرف موضعی طراحی شده‌اند.",
        "feedback_err": "دسته‌بندی مسیر تجویز دارای خطاست. به نقش هیدروکسیل آزاد، کتال‌های حلقوی و تیواستر/استرهای تنفسی دقت کنید.",
    },
    # دپارتمان ۳: استروژن‌ها
    ("estrogen", "metabolism_enzymes"): {
        "type": "exact_dict",
        "expected": {
            "top_horizontal": "Estradiol dehydrogenase",
            "bottom_horizontal": "Estradiol dehydrogenase",
            "left_vertical": "16a-hydroxylase",
            "right_vertical": "16a-hydroxylase",
            "structure_positions": {
                "estradiol": "1",
                "estrone": "2",
                "estriol": "3",
                "hydroxyestrone": "4",
            },
        },
        "base_score": 200,
        "clue": None,
        "feedback_ok": "ساختارهای استرادیول، استرون، استریول و 16α-هیدروکسی‌استرون و مسیر آنزیمی آن‌ها به‌درستی مشخص شدند.",
        "feedback_err": "جایگاه ساختارها یا آنزیم‌ها درست نیست. به نوع واکنش (اکسیداسیون/احیا در C17 یا هیدروکسیلاسیون در C16) دقت کنید.",
    },
    ("estrogen", "oral_long_acting_design"): {
        "type": "set_match",
        "expected": ["add_17alpha_ethynyl", "methylate_3_hydroxyl"],
        "base_score": 150,
        "clue": None,
        "feedback_ok": "اتینیل‌استرادیول/مسترانول با اصلاح گروه 17α و متیلاسیون گروه فنولی C3 برای مصرف خوراکی و طول اثر بیشتر طراحی شد.",
        "feedback_err": "برای افزایش پایداری خوراکی و طول اثر، ساختار را روی کربن C17α و گروه فنولی C3 اصلاح کنید.",
    },
    ("estrogen", "estrogen_potency_sort"): {
        "type": "rank_tiers",
        "expected": [["3"], ["1", "2"], ["4"]],
        "base_score": 150,
        "clue": None,
        "feedback_ok": "ترتیب قدرت صحیح است: ترکیب ۳ > ترکیب‌های ۱ و ۲ (برابر) > ترکیب ۴.",
        "feedback_err": "ترتیب قدرت صحیح نیست. به نقش فاصله گروه‌های فنولی، ممانعت فضایی اتینیل و قطبیت استریول دقت کنید.",
    },
    ("estrogen", "receptor_docking_and_class"): {
        "type": "exact_dict",
        "expected": {
            "rotation_angle": 315,
        },
        "base_score": 150,
        "clue": None,
        "feedback_ok": "اتصال لیگاند با برقراری پیوندهای هیدروژنی دقیق با Glu 353، Arg 394 و His 524 انجام شد.",
        "feedback_err": "لیگاند هنوز دقیقاً روبه‌روی آمینواسیدهای جایگاه فعال قرار نگرفته است. آن را بچرخانید تا دو سر هیدروکسیل با Glu 353/Arg 394 و His 524 هم‌تراز شوند.",
    },
    ("estrogen", "active_metabolite_prevention"): {
        "type": "one_of",
        "expected": [
            "block_c4_fluorine",
            "block_c2_fluorine",
            "methylate_c3_oh",
            "prevent_active_metabolite",
        ],
        "base_score": 150,
        "clue": None,
        "feedback_ok": "عالی! با مسدود کردن موقعیت ارتو (C2/C4 با فلوئور) یا پوشاندن فنول C3، مسیر هیدروکسیلاسیون کاتکولی و تشکیل کوئینون سرطان‌زا مهار شد.",
        "feedback_err": "اصلاح انجام‌شده مانع تشکیل متابولیت کاتکول-کوئینون سرطان‌زا نمی‌شود یا اتصال به گیرنده را از بین می‌برد. موقعیت‌های ارتو نسبت به فنول (C2 یا C4) یا خود C3-OH را بررسی کنید.",
    },
    ("estrogen", "estrogen_drug_classification"): {
        "type": "exact_dict",
        "expected": {
            "serm": "B",
            "pure_antiestrogen": "C",
            "steroid_aromatase_inhibitor": "A",
            "non_steroid_aromatase_inhibitor": "D",
        },
        "base_score": 200,
        "clue": {
            "id": "clue_est_cyanide",
            "title": "سرنخ سوم: گروه سیانید (-C≡N)",
            "detail": "ساختار نهایی اهریمن همانند مهارکننده‌های غیر استروئیدی آروماتاز (لتروزول/آناستروزول) دارای گروه سیانید است.",
        },
        "feedback_ok": "چهار ساختار به‌درستی به SERM، آنتی‌استروژن خالص و مهارکننده‌های استروئیدی و غیراستروئیدی آروماتاز متصل شدند.",
        "feedback_err": "دسته‌ها را مطابق ویژگی‌های ساختاری (حلقه بنزوتیوفن، زنجیره C7α، هسته استروئیدی و گروه تری‌آزول/سیانید) تطبیق دهید.",
    },
    # دپارتمان ۴: پروژستین‌ها
    ("progestin", "pk_safe_code"): {
        "type": "exact_dict",
        "expected": {
            "bioavailability": ["3", "4"],
            "half_life": ["2", "3", "4"],
            "low_androgen": ["1", "2", "3"],
        },
        "base_score": 200,
        "clue": None,
        "feedback_ok": "در اتاق باز شد! رمز ۷ / ۹ / ۶ (جمع اعداد ویژگی‌های فراهمی زیستی، نیمه‌عمر و کاهش آندروژنیسیته) تایید گردید.",
        "feedback_err": "انتخاب ترکیبات در ویژگی‌های فراهمی زیستی، نیمه‌عمر یا کاهش اثر آندروژنی دقیق نیست.",
    },
    ("progestin", "norandrostane_design"): {
        "type": "set_match",
        "expected": ["remove_c19_methyl", "c17_alpha_ethynyl", "c3_oxime_or_ester"],
        "base_score": 250,
        "clue": {
            "id": "clue_prog_activity",
            "title": "سرنخ چهارم: خاصیت پروژسترونی و اتینیل C17α",
            "detail": "اهریمن دارای استخلاف اتینیل در موقعیت 17α و ویژگی‌های آگونیستی گیرنده پروژسترون است.",
        },
        "feedback_ok": "طراحی پروژستین خوراکی طولانی‌اثر مشتق ۱۹-نورآندروستان (حذف متیل C19 + اتینیل 17α + اصلاح C3/C17) تکمیل شد!",
        "feedback_err": "اصلاحات ساختاری کامل نیست. برای حذف اثر آندروژنی، فعال‌سازی خوراکی و افزایش طول اثر به هر سه تغییر نیاز دارید.",
    },
    # دپارتمان ۵: آندروژن‌ها و مهارکننده‌ها
    ("androgen", "androgen_entry_potency_sort"): {
        "type": "exact_list",
        "expected": ["3", "2", "1", "4"],
        "base_score": 150,
        "clue": None,
        "feedback_ok": "ترتیب قدرت ترکیبات برای ورود به اتاق صحیح است: ۳ > ۲ > ۱ > ۴.",
        "feedback_err": "ترتیب قدرت نادرست است. به نقش ممانعت فضایی 17α-متیل، حلقه پیرازول و استخلاف‌های حلقه A/B دقت کنید.",
    },
    ("androgen", "flutamide_metabolite"): {
        "type": "exact_str",
        "expected": "2-hydroxyflutamide",
        "base_score": 150,
        "clue": None,
        "feedback_ok": "صحیح است! ۲-هیدروکسی‌فلوتامید متابولیت ماژور و فعال آنتی‌آندروژنی فلوتامید است که میل ترکیبی بسیار بالاتری به گیرنده آندروژن دارد.",
        "feedback_err": "پاسخ صحیح نیست. هیدروکسیلاسیون روی کربن متین زنجیره ایزوبوتیریل متابولیت فعال را ایجاد می‌کند.",
    },
    ("androgen", "sarm_alternative"): {
        "type": "one_of",
        "expected": ["6", "10"],
        "base_score": 150,
        "clue": None,
        "feedback_ok": "یک تعدیل‌کننده انتخابی گیرنده آندروژن (SARM) به‌عنوان جایگزین انتخاب شد.",
        "feedback_err": "جایگزین باید از گروه تعدیل‌کننده‌های انتخابی گیرنده آندروژن (SARM) با پل اتری (-O-) باشد.",
    },
    ("androgen", "low_androgenicity_design"): {
        "type": "set_match",
        "expected": ["remove_androgenic_features", "add_low_androgenic_features"],
        "base_score": 150,
        "clue": None,
        "feedback_ok": "گروه‌های آندروژن‌ساز حذف و تغییرات کاهنده آندروژنیسیته اضافه شدند.",
        "feedback_err": "طبق راهنمای زیگموند، بخش‌های آندروژن‌ساز را حذف و ساختارهای کاهنده آندروژنیسیته را اضافه کنید.",
    },
    ("androgen", "antiandrogen_classification"): {
        "type": "bucket_sets",
        "expected": {
            "steroid_antiandrogen": ["1", "7"],
            "non_steroid_antiandrogen": ["2", "8"],
            "five_alpha_reductase": ["3", "9"],
            "cyp17_inhibitor": ["4", "5"],
            "sarms": ["6", "10"],
        },
        "base_score": 250,
        "clue": None,
        "feedback_ok": "دسته‌بندی تمام ۱۰ ترکیب دارویی محور آندروژن با دقت ۱۰۰٪ انجام شد!",
        "feedback_err": "چیدمان دسته‌های دارویی دارای خطاست. به هسته ۴-آزااستروئیدی مهارکننده‌های ۵-آلفا ردوکتاز و ساختار مهارکننده‌های CYP17 دقت کنید.",
    },
    ("androgen", "five_alpha_reductase_complex"): {
        "type": "exact_dict",
        "expected": {
            "selected_inhibitors": ["3", "9"],
            "cofactor_complex": "nadph_covalent_adduct",
            "pharmacophore": "keto_enol_lactam",
        },
        "base_score": 250,
        "clue": {
            "id": "clue_and_5ar",
            "title": "سرنخ پنجم: مهار ۵-آلفا ردوکتاز و سیستم کتو-انول",
            "detail": "اهریمن دارای سیستم کونژوگه کتو-انول / لاکتام برای مهار آنزیم ۵-آلفا ردوکتاز و کاهش آندروژنیسیته است.",
        },
        "feedback_ok": "کمپلکس مهارکننده-NADPH در سایت فعال ۵-آلفا ردوکتاز تشکیل شد و آخرین سرنخ ساختاری اهریمن کشف گردید!",
        "feedback_err": "اجزای کمپلکس آنزیمی ۵-آلفا ردوکتاز صحیح انتخاب نشده‌اند.",
    },
    # مرحله نهایی: اتاق مخفی و سنتز پادزهر اهریمن
    ("final", "hidden_room_classification"): {
        "type": "exact_dict",
        "expected": {
            "1": "glucocorticoid",
            "2": "mineralocorticoid",
            "3": "androgen",
            "4": "progesterone",
            "5": "estrogen",
        },
        "base_score": 200,
        "clue": None,
        "feedback_ok": "هر پنج ساختار به‌درستی به خانواده هورمونی خود متصل شدند؛ اتاق مخفی باز است.",
        "feedback_err": "یک یا چند ساختار به خانواده هورمونی نادرست متصل شده‌اند. بررسی کنید و دوباره تلاش کنید.",
    },
    ("final", "biosynthesis_vault"): {
        "type": "exact_dict",
        "expected": {
            "step_1": "Pregnenolone",
            "step_2": "Progesterone",
            "step_3": "Testosterone",
            "vault_password": "CORTICOSTEROID",
        },
        "base_score": 300,
        "clue": None,
        "feedback_ok": "مسیر بیوسنتز کلسترول (پرگننولون ← پروژسترون ← تستوسترون) و رمز گاوصندوق CORTICOSTEROID تایید شد! محفظه ترکیب اهریمن باز شد.",
        "feedback_err": "واسطه‌های مسیر بیوسنتز کلسترول یا کلیدواژه رمز گاوصندوق صحیح نیست.",
    },
    ("final", "antidote_synthesis"): {
        "type": "set_match",
        "expected": [
            "remove_9alpha_f",
            "remove_cyanide",
            "add_11beta_antagonist_aryl",
            "hydrolyze_lipophilic_ester",
        ],
        "base_score": 400,
        "clue": None,
        "feedback_ok": "پادزهر آنتاگونیست با موفقیت سنتز شد! فرمول سمی اهریمن خنثی گردید و بازرسان FDA سلامت آزمایشگاه را تایید کردند.",
        "feedback_err": "اصلاحات پادزهر کامل نیست. بخش‌های سمی اهریمن را حذف کنید، استر لیپوفیل را هیدرولیز نمایید و گروه حجیم آنتاگونیستی را روی C11β قرار دهید.",
    },
}

DEPARTMENT_REQUIRED_COUNT = {
    "entrance": 1,
    "glucocorticoid": 2,
    "mineralocorticoid": 2,
    "estrogen": 6,
    "progestin": 2,
    "androgen": 6,
    "final": 3,
}

DEPARTMENT_BADGES = {
    "glucocorticoid": ("master_glucocorticoids", "استاد کورتیکواستروئیدها", "تکمیل بدون خطای دپارتمان گلوکوکورتیکوئیدها و تحلیل SAR"),
    "mineralocorticoid": ("master_mineralocorticoids", "متخصص تعادل الکترولیتی", "تکمیل بدون خطای بخش مینرالوکورتیکوئیدها و تشخیص مسیر تجویز"),
    "estrogen": ("master_estrogens", "کاوشگر گیرنده‌های استروژنی", "تکمیل بدون خطای آزمایشگاه استروژن‌ها و داکینگ سه‌بعدی"),
    "progestin": ("master_progestins", "معمار ۱۹-نورآندروستان", "تکمیل بدون خطای بخش پروژستین‌ها و طراحی پیش‌داروی خوراکی"),
    "androgen": ("master_androgens", "مهارکننده ۵-آلفا ردوکتاز", "تکمیل بدون خطای دپارتمان آندروژن‌ها و آنتی‌آندروژن‌ها"),
    "final": ("savior_of_pharmacochem", "قهرمان شیمی دارویی فارماکوکم", "سنتز موفق پادزهر اهریمن و نجات آزمایشگاه قبل از بازرسی FDA"),
}


def _normalize_dict_value(key, value):
    """نرمال‌سازی مقادیر دیکشنری: حذف وابستگی به ترتیب برای لیست‌های چندانتخابی و استانداردسازی رشته‌ها."""
    if key == "vault_password" and isinstance(value, str):
        return value.strip().upper()
    if isinstance(value, list):
        return sorted(str(x).strip() for x in value)
    if isinstance(value, dict):
        return {k: _normalize_dict_value(k, v) for k, v in value.items()}
    if isinstance(value, str):
        return value.strip()
    return value


def evaluate_answer(puzzle_key, submitted):
    rule = PUZZLE_SOLUTIONS.get(puzzle_key)
    if not rule:
        return False, "معمای نامعتبر"

    p_type = rule["type"]
    expected = rule["expected"]

    if p_type == "set_match":
        is_ok = (
            isinstance(submitted, list)
            and set(str(x) for x in submitted) == set(expected)
            and len(submitted) == len(expected)
        )
    elif p_type == "exact_dict":
        if not isinstance(submitted, dict):
            is_ok = False
        else:
            normalized_sub = {k: _normalize_dict_value(k, v) for k, v in submitted.items()}
            normalized_exp = {k: _normalize_dict_value(k, v) for k, v in expected.items()}
            is_ok = normalized_sub == normalized_exp
    elif p_type == "exact_list":
        is_ok = isinstance(submitted, list) and [str(x) for x in submitted] == expected
    elif p_type == "rank_tiers":
        if not isinstance(submitted, list) or len(submitted) != sum(map(len, expected)):
            is_ok = False
        else:
            offset = 0
            is_ok = True
            for tier in expected:
                submitted_tier = [str(x) for x in submitted[offset : offset + len(tier)]]
                if set(submitted_tier) != set(tier) or len(submitted_tier) != len(tier):
                    is_ok = False
                    break
                offset += len(tier)
    elif p_type == "one_of":
        is_ok = isinstance(submitted, str) and submitted.strip() in expected
    elif p_type == "exact_str":
        is_ok = isinstance(submitted, str) and submitted.strip() == expected
    elif p_type == "bucket_sets":
        if not isinstance(submitted, dict):
            is_ok = False
        else:
            is_ok = all(
                set(str(x) for x in submitted.get(k, [])) == set(v)
                and len(submitted.get(k, [])) == len(v)
                for k, v in expected.items()
            )
    else:
        is_ok = False

    return is_ok, (rule["feedback_ok"] if is_ok else rule["feedback_err"])


class ActiveSessionView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        session = (
            GameSession.objects.filter(student=request.user, status="completed")
            .order_by("-completed_at")
            .first()
        )
        if not session:
            session, _ = GameSession.objects.get_or_create(
                student=request.user,
                status="in_progress",
                defaults={"time_remaining_seconds": 3600},
            )
        badges = StudentBadge.objects.filter(student=request.user)
        return Response(
            {
                "session": GameSessionSerializer(session).data,
                "badges": StudentBadgeSerializer(badges, many=True).data,
            }
        )

    def post(self, request):
        GameSession.objects.filter(student=request.user, status="in_progress").update(
            status="expired", completed_at=timezone.now()
        )
        session = GameSession.objects.create(
            student=request.user,
            status="in_progress",
            time_remaining_seconds=3600,
        )
        return Response(
            {"session": GameSessionSerializer(session).data},
            status=status.HTTP_201_CREATED,
        )


class SubmitPuzzleView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = PuzzleSubmitSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        session = (
            GameSession.objects.filter(student=request.user, status="in_progress").first()
            or GameSession.objects.filter(student=request.user, status="completed").first()
        )
        if not session:
            session = GameSession.objects.create(student=request.user, status="in_progress")

        stage_code = data["stage_code"]
        puzzle_code = data["puzzle_code"]
        puzzle_key = (stage_code, puzzle_code)

        attempt, _ = PuzzleAttempt.objects.get_or_create(
            session=session,
            stage_code=stage_code,
            puzzle_code=puzzle_code,
        )

        is_correct, feedback = evaluate_answer(puzzle_key, data["answer"])

        if attempt.is_solved:
            return Response(
                {
                    "correct": is_correct,
                    "feedback": feedback,
                    "score_earned": attempt.score_earned,
                    "unlocked_clue": None,
                    "new_badge": None,
                    "session": GameSessionSerializer(session).data,
                }
            )

        elapsed_clamped = max(0, min(3600, int(data["time_spent_seconds"])))
        remaining_clamped = max(0, min(3600, int(data["time_remaining_seconds"])))

        attempt.attempts_count += 1
        attempt.time_spent_seconds += elapsed_clamped
        attempt.submitted_answer = {"value": data["answer"]}

        session.time_remaining_seconds = remaining_clamped
        session.total_time_spent_seconds += elapsed_clamped

        new_badge = None
        unlocked_clue = None

        if is_correct:
            rule = PUZZLE_SOLUTIONS[puzzle_key]
            penalty = attempt.errors_count * 25
            earned = max(50, rule["base_score"] - penalty)
            attempt.is_solved = True
            attempt.score_earned = earned
            attempt.solved_at = timezone.now()
            session.total_score += earned

            if rule["clue"]:
                unlocked_clue = rule["clue"]
                clues = list(session.unlocked_clues)
                if not any(c.get("id") == unlocked_clue["id"] for c in clues):
                    clues.append(unlocked_clue)
                    session.unlocked_clues = clues

            attempt.save()

            required_count = DEPARTMENT_REQUIRED_COUNT.get(stage_code, 1)
            solved_in_stage = PuzzleAttempt.objects.filter(
                session=session,
                stage_code=stage_code,
                is_solved=True,
            ).count()

            if solved_in_stage >= required_count:
                completed = list(session.completed_stages)
                if stage_code not in completed:
                    completed.append(stage_code)
                    session.completed_stages = completed

                if stage_code == "final":
                    session.status = "completed"
                    session.completed_at = timezone.now()
                    b_code, b_title, b_desc = DEPARTMENT_BADGES["final"]
                    badge, created = StudentBadge.objects.get_or_create(
                        student=request.user,
                        badge_code=b_code,
                        defaults={"title": b_title, "description": b_desc},
                    )
                    if created:
                        new_badge = StudentBadgeSerializer(badge).data
                elif stage_code in DEPARTMENT_BADGES:
                    total_stage_errors = sum(
                        PuzzleAttempt.objects.filter(
                            session=session, stage_code=stage_code
                        ).values_list("errors_count", flat=True)
                    )
                    if total_stage_errors == 0:
                        b_code, b_title, b_desc = DEPARTMENT_BADGES[stage_code]
                        badge, created = StudentBadge.objects.get_or_create(
                            student=request.user,
                            badge_code=b_code,
                            defaults={"title": b_title, "description": b_desc},
                        )
                        if created:
                            new_badge = StudentBadgeSerializer(badge).data
        else:
            attempt.errors_count += 1
            session.total_errors += 1
            attempt.save()

        session.save()

        return Response(
            {
                "correct": is_correct,
                "feedback": feedback,
                "score_earned": attempt.score_earned,
                "unlocked_clue": unlocked_clue,
                "new_badge": new_badge,
                "session": GameSessionSerializer(session).data,
            }
        )


class LeaderboardView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        ordered_sessions = (
            GameSession.objects.select_related("student")
            .order_by("-total_score", "total_errors", "total_time_spent_seconds")
        )
        seen_students = set()
        results = []
        for s in ordered_sessions:
            if s.student_id in seen_students:
                continue
            seen_students.add(s.student_id)
            results.append(
                {
                    "rank": len(results) + 1,
                    "student_id": s.student.student_id,
                    "full_name": s.student.full_name,
                    "total_score": s.total_score,
                    "total_errors": s.total_errors,
                    "time_spent_seconds": s.total_time_spent_seconds,
                    "completed_stages_count": len(s.completed_stages),
                }
            )
            if len(results) >= 20:
                break
        return Response({"leaderboard": results})
