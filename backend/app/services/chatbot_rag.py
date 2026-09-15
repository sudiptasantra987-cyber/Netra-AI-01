import re
from typing import Dict, Any, List, Optional
from app.models.schema import ChatResponse

# Curated Medical Knowledge Base for Eye Health & Care Navigation
KNOWLEDGE_BASE = {
    "diabetic_retinopathy": {
        "en": (
            "Diabetic Retinopathy occurs when prolonged high blood sugar damages the fragile microvessels nourishing the retina. "
            "In early stages (Non-Proliferative DR), vessels leak fluid or form microaneurysms. If untreated, it can advance to Proliferative DR "
            "with fragile neovascularization risking hemorrhage and retinal detachment.\n\n"
            "Key recommendations:\n"
            "• Strict glycemic control (target HbA1c < 7.0%)\n"
            "• Blood pressure and lipid management\n"
            "• Annual dilated retinal examination by a retina specialist\n"
            "• Optical Coherence Tomography (OCT) if macular edema is suspected."
        ),
        "hi": (
            "डायबिटिक रेटिनोपैथी तब होती है जब उच्च रक्त शर्करा (हाई ब्लड शुगर) रेटिना की सूक्ष्म रक्त वाहिकाओं को नुकसान पहुंचाती है। "
            "शुरुआती चरण में वाहिकाओं से तरल पदार्थ रिस सकता है। समय पर जांच न होने पर दृष्टि हानि हो सकती है।\n\n"
            "महत्वपूर्ण सावधानियां:\n"
            "• ब्लड शुगर (HbA1c < 7.0%) और रक्तचाप को नियंत्रित रखें\n"
            "• वर्ष में कम से कम एक बार रेटिना विशेषज्ञ से पुतली फैलाकर जांच कराएं\n"
            "• स्वस्थ आहार और नियमित व्यायाम अपनाएं।"
        ),
        "bn": (
            "ডায়াবেটিক রেটিনোপ্যাথি হলো ডায়াবেটিসের কারণে চোখের রেটিনার রক্তনালীর ক্ষতি। "
            "প্রাথমিক পর্যায়ে রক্তনালী থেকে রক্ত বা তরল ফুটো হতে পারে। চিকিৎসা না করালে দৃষ্টিশক্তি হ্রাস পেতে পারে।\n\n"
            "প্রয়োজনীয় সতর্কতা:\n"
            "• রক্তে শর্করার মাত্রা (HbA1c < 7.0%) এবং রক্তচাপ নিয়ন্ত্রণে রাখুন\n"
            "• বছরে অন্তত একবার চক্ষু বিশেষজ্ঞের দ্বারা রেটিনা পরীক্ষা করান\n"
            "• চোখের সামান্য পরিবর্তনেও অবিলম্বে ডাক্তারের পরামর্শ নিন।"
        )
    },
    "glaucoma": {
        "en": (
            "Glaucoma is often termed the 'silent thief of sight' because it gradually damages the optic nerve, typically due to elevated intraocular pressure (IOP), "
            "often without early pain or warning symptoms. Peripheral vision is compromised first.\n\n"
            "Key recommendations:\n"
            "• Measurement of Intraocular Pressure (Tonometry) and Corneal Pachymetry\n"
            "• Visual Field (Perimetry) testing to map peripheral sight\n"
            "• Consistent adherence to prescribed pressure-lowering eye drops (e.g., prostaglandin analogues or beta-blockers)."
        ),
        "hi": (
            "ग्लॉकोमा (काला मोतिया) को 'दृष्टि का मूक चोर' कहा जाता है क्योंकि यह ऑप्टिक नर्व को धीरे-धीरे नुकसान पहुंचाता है, "
            "जो अक्सर बिना किसी शुरुआती दर्द के आंखों के दबाव (IOP) बढ़ने से होता है।\n\n"
            "महत्वपूर्ण कदम:\n"
            "• आंखों के दबाव (टोनोमेट्री) की नियमित जांच कराएं\n"
            "• डॉक्टर द्वारा बताई गई आई ड्रॉप्स को कभी न छोड़ें।"
        ),
        "bn": (
            "গ্লুকোমা (কালা ছানি) চোখের অপটিক নার্ভের ক্ষতি করে, যা সাধারণত চোখের অভ্যন্তরীণ চাপ (IOP) বৃদ্ধির ফলে ঘটে। "
            "এর প্রাথমিক লক্ষণ সাধারণত বোঝা যায় না।\n\n"
            "প্রয়োজনীয় পদক্ষেপ:\n"
            "• নিয়মিত চোখের প্রেশার মাপুন\n"
            "• চিকিৎসকের নির্দেশিত চোখের ড্রপ নিয়মিত ব্যবহার করুন।"
        )
    },
    "cataract": {
        "en": (
            "A cataract is the progressive clouding of the eye's natural crystalline lens, leading to faded colors, halos around lights, "
            "difficulty with night driving, and blurred vision.\n\n"
            "Key recommendations:\n"
            "• Modern phacoemulsification surgery with intraocular lens (IOL) implantation is safe, quick, and restores clear vision.\n"
            "• Surgery is typically recommended when blurry vision impairs your daily activities and quality of life."
        ),
        "hi": (
            "मोतियाबिंद (सफेद मोतिया) आंख के प्राकृतिक लेंस का धुंधलापन है, जिससे दृष्टि धुंधली हो जाती है और रात में गाड़ी चलाने में परेशानी होती है। "
            "फेकोइमल्सीफिकेशन सर्जरी द्वारा नया लेंस (IOL) लगाकर दृष्टि पूर्णतः ठीक की जा सकती है।"
        ),
        "bn": (
            "ছানি হলো চোখের প্রাকৃতিক লেন্সের অস্বচ্ছতা বা ঘোলাটে ভাব, যার ফলে দৃষ্টিশক্তি ঝাপসা হয়ে যায়। "
            "একটি সহজ ও ব্যথাহীন লেন্স প্রতিস্থাপন (IOL) অস্ত্রোপচারের মাধ্যমে সম্পূর্ণ স্বাভাবিক দৃষ্টি পুনরুদ্ধার সম্ভব।"
        )
    },
    "amd": {
        "en": (
            "Age-Related Macular Degeneration (AMD) affects the macula, the specialized center of the retina responsible for sharp, straight-ahead vision. "
            "Dry AMD involves drusen buildup, while Wet AMD involves abnormal blood vessels leaking fluid under the macula.\n\n"
            "Key recommendations:\n"
            "• Monitor vision at home using an Amsler Grid for wavy or distorted lines\n"
            "• AREDS2 formula antioxidant supplements for intermediate dry AMD\n"
            "• Anti-VEGF intravitreal injections for active wet AMD."
        ),
        "hi": (
            "मैक्यूलर डिजनरेशन (AMD) रेटिना के केंद्रीय भाग (मैक्यूला) को प्रभावित करता है, जिससे सीधी और बारीक दृष्टि कमजोर हो जाती है। "
            "एम्सलर ग्रिड चार्ट से घर पर दृष्टि की सीधी रेखाओं की जांच करें और विशेषज्ञ से परामर्श लें।"
        ),
        "bn": (
            "বয়সজনিত ম্যাকুলার অবক্ষয় (AMD) রেটিনার কেন্দ্রীয় অংশকে ক্ষতিগ্রস্ত করে, যার ফলে সূক্ষ্ম দৃষ্টি দুর্বল হয়। "
            "অ্যামসলার গ্রিডের মাধ্যমে দৃষ্টির বিকৃতি লক্ষ্য করুন এবং রেটিনা বিশেষজ্ঞের পরামর্শ নিন।"
        )
    }
}

EMERGENCY_KEYWORDS = [
    "sudden vision loss", "lost my vision", "blind in one eye", "cannot see suddenly",
    "severe eye pain", "excruciating pain", "chemical in eye", "acid splash", "shampoo burn",
    "curtain over eye", "black shadow falling", "flashes of light", "shower of floaters",
    "puncture", "cut on eye", "blood in eye", "eye injury", "trauma",
    "अचानक रोशनी चली गई", "तेज आंख दर्द", "केमिकल गिर गया",
    "হঠাৎ দৃষ্টিহীন", "প্রচণ্ড চোখের ব্যথা", "চোখে অ্যাসিড বা কেমিক্যাল"
]

SAFETY_DISCLAIMER = {
    "en": "\n\n*Medical Safety Notice: Netra AI provides clinical screening and educational assistance only. This does not constitute an official diagnosis or treatment prescription. Always consult a certified ophthalmologist for clinical validation.*",
    "hi": "\n\n*चिकित्सा सुरक्षा सूचना: नेत्रा एआई केवल प्रारंभिक स्क्रीनिंग और शैक्षिक सहायता प्रदान करता है। यह आधिकारिक चिकित्सकीय निदान नहीं है। सटीक जांच हेतु नेत्र रोग विशेषज्ञ से अवश्य मिलें।*",
    "bn": "\n\n*চিকিৎসা নিরাপত্তা বিজ্ঞপ্তি: নেত্রা এআই কেবল প্রাথমিক স্ক্রিনিং এবং শিক্ষামূলক তথ্য প্রদান করে। এটি চূড়ান্ত চিকিৎসা প্রেসক্রিপশন নয়। সর্বদা চক্ষু বিশেষজ্ঞের সাথে সরাসরি পরামর্শ করুন।*"
}

def detect_emergency(user_query: str) -> bool:
    lower_q = user_query.lower()
    for kw in EMERGENCY_KEYWORDS:
        if kw in lower_q:
            return True
    return False

def generate_chat_response(
    query: str,
    language: str = "en",
    screening_context: Optional[Dict[str, Any]] = None,
    history: Optional[List[Any]] = None
) -> ChatResponse:
    lang = language if language in ["en", "hi", "bn"] else "en"
    
    # Check for Emergency Red Flags
    if detect_emergency(query):
        if lang == "hi":
            reply = (
                "🚨 **अति-आवश्यक चेतावनी (EMERGENCY RED-FLAG)**: आपके द्वारा बताए गए लक्षण (जैसे अचानक दृष्टि हानि, अत्यधिक दर्द या केमिकल एक्सपोज़र) एक आपातकालीन स्थिति का संकेत हो सकते हैं (उदा. रेटिनल डिटैचमेंट या एक्यूट ग्लूकोमा)।\n\n"
                "**तत्काल क्या करें:**\n"
                "1. बिना देर किए तुरंत निकटतम नेत्र अस्पताल (Eye Hospital/Emergency) पहुंचें।\n"
                "2. आंख को रगड़ें या दबाएं नहीं।\n"
                "3. यदि केमिकल गया है तो साफ पानी से 15 मिनट धोएं और तुरंत इमरजेंसी जाएं।\n"
                "4. आपातकालीन हेल्पलाइन: 112 / 108 पर कॉल करें।"
            )
        elif lang == "bn":
            reply = (
                "🚨 **জরুরী চিকিৎসা সতর্কতা (EMERGENCY RED-FLAG)**: আপনার উল্লিখিত লক্ষণগুলি (হঠাৎ দৃষ্টি হ্রাস, তীব্র চোখের যন্ত্রণা বা রাসায়নিক আঘাত) চোখের জরুরী অবস্থার ইঙ্গিত দেয় (যেমন রেটিনাল ডিটাচমেন্ট বা তীব্র গ্লুকোমা)।\n\n"
                "**অবিলম্বে করণীয়:**\n"
                "1. এক মুহূর্তও দেরি না করে নিকটতম চোখের হাসপাতালের ইমার্জেন্সিতে যান।\n"
                "2. চোখ ঘষবেন না বা চাপ দেবেন না।\n"
                "3. জরুরী সহায়তার জন্য অবিলম্বে 112 বা 108 নম্বরে যোগাযোগ করুন।"
            )
        else:
            reply = (
                "🚨 **POTENTIAL OCULAR EMERGENCY DETECTED**: The symptoms you described (such as sudden visual loss, excruciating ocular pain, chemical splash, or lightning-like flashes with dark shadows) are classic red flags for conditions like Retinal Detachment, Acute Angle-Closure Glaucoma, or severe chemical injury.\n\n"
                "**Immediate Action Protocol:**\n"
                "1. Proceed immediately to the nearest Ophthalmic Emergency Room or major hospital emergency department.\n"
                "2. Do NOT rub, press, or apply unprescribed eye drops to the eye.\n"
                "3. If chemical exposure occurred, continuously flush with clean tap water for 15 minutes while en route to emergency care.\n"
                "4. Call Emergency Services: 112 or 108."
            )
        return ChatResponse(
            reply=reply + SAFETY_DISCLAIMER[lang],
            language=lang,
            is_emergency=True,
            emergency_warning="Potential ocular emergency identified. Immediate in-person medical evaluation required.",
            suggested_actions=["Call Emergency 112/108", "Find Nearest Eye Hospital Emergency", "Do not rub eye"]
        )

    lower_query = query.lower()
    
    # 1. Check if patient is asking about their recent screening
    if screening_context and any(w in lower_query for w in ["result", "screening", "report", "my eye", "test", "gradcam", "risk", "रिपोर्ट", "रिजल्ट"]):
        primary_cond = screening_context.get("primary_condition", "Normal Eye Anatomy")
        risk_lvl = screening_context.get("risk_level", "Low Risk")
        conf = screening_context.get("primary_confidence", 85.0)
        
        if lang == "hi":
            reply = (
                f"आपकी हालिया एआई स्क्रीनिंग रिपोर्ट के अनुसार: **{primary_cond}** ({conf}% संभावना) आंकी गई है, जिसका जोखिम स्तर **{risk_lvl}** है।\n\n"
                "हीटमैप (Grad-CAM) ने उन क्षेत्रों को रेखांकित किया है जहां मॉडल ने असामान्य विशेषताएं पाई हैं। "
                "यदि जोखिम मध्यम या उच्च है, तो कृपया हमारे 'Find Ophthalmologist' टैब से तुरंत एक योग्य नेत्र विशेषज्ञ के साथ अपॉइंटमेंट बुक करें।"
            )
        elif lang == "bn":
            reply = (
                f"আপনার সাম্প্রতিক এআই স্ক্রিনিং ফলাফল অনুযায়ী: **{primary_cond}** ({conf}% আত্মবিশ্বাস) সনাক্ত হয়েছে এবং ঝুঁকি স্তর হলো **{risk_lvl}**।\n\n"
                "আমাদের গ্রেড-ক্যাম (Grad-CAM) মনোযোগ ম্যাপ রেটিনার সংবেদনশীল স্থানগুলি চিহ্নিত করেছে। "
                "সঠিক ক্লিনিকাল মূল্যায়নের জন্য অবিলম্বে নিকটবর্তী চক্ষু বিশেষজ্ঞের কাছে যান।"
            )
        else:
            reply = (
                f"Based on your latest screening scan, the Netra AI model identified **{primary_cond}** with a confidence score of **{conf}%** (Risk Category: **{risk_lvl}**).\n\n"
                "The Grad-CAM explainability heatmap highlighted specific focal regions contributing to this classification. "
                "Because AI screening is a preventative triaging tool and not a definitive diagnosis, we recommend clicking 'Find Ophthalmologist' on your dashboard to book a clinical consultation with one of our verified retina specialists."
            )
        return ChatResponse(
            reply=reply + SAFETY_DISCLAIMER[lang],
            language=lang,
            is_emergency=False,
            suggested_actions=["Book Doctor Appointment", "Download PDF Report", "Explain Grad-CAM Heatmap"]
        )
        
    # 2. Disease specific RAG retrieval
    if any(w in lower_query for w in ["diabet", "sugar", "retinopathy", "डायबिटीज", "ডায়াবেটিস"]):
        content = KNOWLEDGE_BASE["diabetic_retinopathy"][lang]
    elif any(w in lower_query for w in ["glaucoma", "pressure", "optic", "काला मोतिया", "গ্লুকোমা"]):
        content = KNOWLEDGE_BASE["glaucoma"][lang]
    elif any(w in lower_query for w in ["cataract", "cloudy", "lens", "मोतियाबिंद", "ছানি"]):
        content = KNOWLEDGE_BASE["cataract"][lang]
    elif any(w in lower_query for w in ["macular", "amd", "central vision", "मैक्यूला", "ম্যাকুলা"]):
        content = KNOWLEDGE_BASE["amd"][lang]
    elif any(w in lower_query for w in ["doctor", "appointment", "clinic", "hospital", "डॉक्टर", "ডাক্তার"]):
        if lang == "hi":
            content = "नेत्रा एआई आपके वर्तमान स्थान (GPS) का उपयोग करके निकटतम प्रमाणित नेत्र रोग विशेषज्ञों और रेटिना सर्जनों को खोज सकता है। आप 'Find Doctor' विकल्प चुनकर सीधे रियल-टाइम टाइम-स्लॉट बुक कर सकते हैं।"
        elif lang == "bn":
            content = "নেত্রা এআই আপনার অবস্থান অনুযায়ী নিকটবর্তী অভিজ্ঞ চক্ষুরোগ বিশেষজ্ঞদের তালিকা প্রদর্শন করে। আপনি 'Find Doctor' অপশনে গিয়ে সরাসরি অ্যাপয়েন্টমেন্টের সময় নির্ধারণ করতে পারেন।"
        else:
            content = "Netra AI allows you to discover top-rated ophthalmologists near you based on real-time geolocation. You can inspect their clinical credentials, hospital affiliations, consultation fees, and book verified time-slots seamlessly from the 'Find Doctor' tab."
    else:
        if lang == "hi":
            content = (
                "नमस्ते! मैं नेत्रा एआई (Netra AI) का नेत्र स्वास्थ्य सहायक हूँ। "
                "आप मुझसे आंखों की जांच, डायबिटिक रेटिनोपैथी, मोतियाबिंद, ग्लूकोमा, रिपोर्ट समझने या डॉक्टर खोजने के बारे में कोई भी प्रश्न पूछ सकते हैं।"
            )
        elif lang == "bn":
            content = (
                "নমস্কার! আমি নেত্রা এআই (Netra AI) চক্ষু স্বাস্থ্য সহকারী। "
                "আপনি চোখের রোগ, ডায়াবেটিক রেটিনোপ্যাথি, গ্লুকোমা, ছানি, স্ক্রিনিং ফলাফল বা ডাক্তার খোঁজার বিষয়ে যেকোনো তথ্য জানতে চাইতে পারেন।"
            )
        else:
            content = (
                "Hello! I am your Netra AI Eye-Health Assistant. I can assist you with understanding your retinal screening scans, "
                "navigating conditions like Diabetic Retinopathy, Glaucoma, Cataract, and Macular Degeneration, sharing preventative care guidelines, "
                "or helping you schedule a consultation with an ophthalmologist."
            )
            
    return ChatResponse(
        reply=content + SAFETY_DISCLAIMER[lang],
        language=lang,
        is_emergency=False,
        suggested_actions=["What is Diabetic Retinopathy?", "How does Glaucoma develop?", "Find Nearby Eye Specialists"]
    )
