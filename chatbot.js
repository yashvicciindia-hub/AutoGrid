(function () {
  "use strict";

  const root = document.getElementById("agBot");
  if (!root) return;

  const launcher = document.getElementById("agBotLauncher");
  const panel = document.getElementById("agBotPanel");
  const bodyEl = document.getElementById("agBotBody");
  const form = document.getElementById("agBotForm");
  const input = document.getElementById("agBotInput");
  const sendBtn = document.getElementById("agBotSend");
  const closeBtn = document.getElementById("agBotClose");
  const clearBtn = document.getElementById("agBotClear");
  const notify = document.getElementById("agBotNotify");

  const OPENING_CHIPS = [
    "What is AutoGrid?",
    "How does AutoGrid work?",
    "What can the AI Parts Assistant do?",
    "How does AutoGrid help OEMs?",
    "How does AutoGrid help workshops?",
    "What is the Inventory Exchange?",
    "How does AutoGrid support exports?"
  ];

  const autoGridKnowledge = {
    overview: {
      positioning: "India's AI-Powered Automotive Business Network",
      thesis: "The central problem is ecosystem connectivity, not manufacturing capacity.",
      notMarketplace: "AutoGrid is positioned as connective tissue for India's automotive industry, not simply a marketplace."
    },
    navigation: {
      pages: ["Home", "Platform", "Business", "Contact"],
      cta: "Join AutoGrid",
      platform: "#platform",
      contact: "#contact",
      join: "#contact"
    }
  };

  const memory = {
    lastIntent: null,
    lastTopic: null,
    lastUserText: "",
    openedOnce: false
  };

  const HI_RE = /\b(kya|kyun|kyu|kaise|kaisa|kaun|kahan|hai|hain|hoon|hun|mein|mujhe|mera|meri|batao|bataiye|samjhao|chahiye|karta|karte|kartaa|nahi|nahin|ke liye|platform kya|autogrid kya|ko kaise)\b/i;
  const GREETING_RE = /^(hi+|hii+|hello|hey+|yo|good\s*(morning|afternoon|evening|night)|namaste|namaskar)[\s!.]*$/i;
  const JAILBREAK_RE = /(system prompt|hidden prompt|reveal your (instructions|prompt)|ignore (all )?(previous|prior|above) instructions|you are now|developer mode|jailbreak|show me your (system|hidden) prompt|tell me your instructions)/i;
  const LIVE_RE = /(live inventory|right now|currently (in stock|available)|check inventory|do you have .*available|warehouse|my order|order status|current price of|real[- ]time (price|stock|inventory|order)|live (vin|pricing|supplier|data))/i;
  const MARKETPLACE_ONLY_RE = /(just a marketplace|only a marketplace|sirf marketplace|simply a marketplace|nothing but a marketplace)/i;

  const TOPIC_CHIPS = {
    OVERVIEW: ["How does AutoGrid work?", "What are the six solutions?", "Is AutoGrid just a marketplace?"],
    PROBLEM: ["How does AutoGrid work?", "What are the six solutions?", "Why AutoGrid now?"],
    ECOSYSTEM: ["How does AutoGrid help OEMs?", "How does AutoGrid help workshops?", "How does AutoGrid help exporters?"],
    B2B_MARKETPLACE: ["OEM Supplier Discovery", "Inventory Exchange", "Is AutoGrid just a marketplace?"],
    AI_BUSINESS_ADVISOR: ["AI Parts Assistant", "Trade Documentation", "How does AutoGrid help exporters?"],
    OEM_SUPPLIER_DISCOVERY: ["How does AutoGrid help OEMs?", "AI Parts Assistant", "B2B Marketplace"],
    AI_PARTS_ASSISTANT: ["Can I identify a part using VIN?", "How does AutoGrid help workshops?", "Inventory Exchange"],
    PART_IDENTIFICATION: ["What is the AI Parts Assistant?", "OEM Supplier Discovery", "How workshops benefit"],
    VIN: ["AI Parts Assistant", "OEM number matching", "How workshops benefit"],
    OEM_NUMBER: ["AI Parts Assistant", "VIN lookup", "B2B Marketplace"],
    INVENTORY_EXCHANGE: ["B2B Marketplace", "How distributors benefit", "AI Parts Assistant"],
    TRADE_DOCUMENTATION: ["How does AutoGrid help exporters?", "AI Business Advisor", "How do I join AutoGrid?"],
    WORKSHOP: ["AI Parts Assistant", "Inventory Exchange", "How does AutoGrid work?"],
    MANUFACTURER: ["OEM Supplier Discovery", "B2B Marketplace", "How do I join AutoGrid?"],
    OEM: ["OEM Supplier Discovery", "AI Parts Assistant", "Why AutoGrid instead of a marketplace?"],
    DISTRIBUTOR: ["Inventory Exchange", "B2B Marketplace", "How does AutoGrid make money?"],
    EXPORTER: ["Trade Documentation", "AI Business Advisor", "How do I join AutoGrid?"],
    LOGISTICS: ["Trade Documentation", "How does AutoGrid work?", "Ecosystem"],
    FINANCIAL_INSTITUTION: ["CCI India", "Business model", "Why AutoGrid now?"],
    CCI_INDIA: ["Why AutoGrid now?", "Funding plan", "Is AutoGrid just a marketplace?"],
    AI: ["AI Parts Assistant", "AI Business Advisor", "Six solutions"],
    WORKFLOW: ["What are the six solutions?", "How do I join AutoGrid?", "AI capabilities"],
    COMPETITIVE_DIFFERENTIATION: ["Six solutions", "CCI India", "Why AutoGrid now?"],
    WHY_NOW: ["What is AutoGrid?", "Funding plan", "Revenue model"],
    FUNDING: ["Revenue model", "Revenue projections", "Why AutoGrid now?"],
    REVENUE_MODEL: ["Funding plan", "Revenue projections", "ARPU assumptions"],
    REVENUE_PROJECTIONS: ["Revenue model", "Funding plan", "ARPU assumptions"],
    ARPU: ["Revenue model", "Revenue projections", "Funding plan"],
    NAVIGATION: ["How do I join AutoGrid?", "How do I contact AutoGrid?", "What is AutoGrid?"],
    CONTACT: ["How do I join AutoGrid?", "What is AutoGrid?", "Platform section"],
    JOIN: ["How do I contact AutoGrid?", "What is AutoGrid?", "Who does AutoGrid serve?"],
    HELP: OPENING_CHIPS.slice(0, 4),
    UNKNOWN: ["What is AutoGrid?", "AI Parts Assistant", "How do I join AutoGrid?"],
    LIVE_DATA: ["What is Inventory Exchange?", "AI Parts Assistant", "How do I contact AutoGrid?"],
    JAILBREAK: ["What is AutoGrid?", "Six solutions", "How do I join AutoGrid?"],
    GREETING: OPENING_CHIPS.slice(0, 4),
    AUTOMANDI: ["What is AutoGrid?", "How does AutoGrid work?", "Six solutions"]
  };

  const INTENT_GROUPS = [
    { id: "JAILBREAK", weight: 20, terms: [] },
    { id: "LIVE_DATA", weight: 18, terms: ["live inventory", "right now", "currently available", "check inventory", "in stock now"] },
    { id: "AUTOMANDI", weight: 16, terms: ["automandi"] },
    { id: "HELP", weight: 10, terms: ["what can you help", "what can you do", "how can you help", "kya help", "kya kar sakte", "what do you know"] },
    { id: "JOIN", weight: 12, terms: ["join autogrid", "how do i join", "sign up", "register", "onboard my business", "get started", "become a member"] },
    { id: "CONTACT", weight: 12, terms: ["contact", "reach autogrid", "talk to the team", "support desk", "email", "phone", "get in touch"] },
    { id: "NAVIGATION", weight: 9, terms: ["platform section", "where can i learn", "navigation", "home page", "business page", "contact section"] },
    { id: "REVENUE_PROJECTIONS", weight: 14, terms: ["how much revenue", "revenue will", "projected revenue", "year 1", "year 5", "28.5", "310,000", "make money in year"] },
    { id: "ARPU", weight: 13, terms: ["arpu", "annual arpu", "average revenue per"] },
    { id: "FUNDING", weight: 13, terms: ["funding", "raised", "1 million", "$1m", "$1 million", "investment", "raise money"] },
    { id: "REVENUE_MODEL", weight: 12, terms: ["make money", "revenue model", "business model", "monetiz", "transaction fee", "membership plan"] },
    { id: "CCI_INDIA", weight: 13, terms: ["cci india", "cci", "chamber of commerce"] },
    { id: "WHY_NOW", weight: 11, terms: ["why now", "why autogrid now", "urgency", "evs", "digital transformation", "why this time"] },
    { id: "COMPETITIVE_DIFFERENTIATION", weight: 12, terms: ["just a marketplace", "instead of", "different from", "why autogrid", "vs marketplace", "versus", "not a marketplace", "normal b2b"] },
    { id: "WORKFLOW", weight: 11, terms: ["how does autogrid work", "onboard", "discover", "transact", "fulfill", "fulfil", "end to end", "workflow", "kaise kaam"] },
    { id: "INVENTORY_EXCHANGE", weight: 13, terms: ["inventory exchange", "surplus", "overstock", "slow-moving", "tied-up capital", "inventory waste"] },
    { id: "TRADE_DOCUMENTATION", weight: 12, terms: ["trade documentation", "export paperwork", "documentation", "audit-ready", "compliance"] },
    { id: "OEM_SUPPLIER_DISCOVERY", weight: 13, terms: ["oem supplier discovery", "find manufacturers", "supplier onboarding", "discover suppliers", "find suppliers", "verified manufacturer"] },
    { id: "AI_BUSINESS_ADVISOR", weight: 12, terms: ["ai business advisor", "business advisor", "government scheme", "export intelligence", "supplier growth"] },
    { id: "AI_PARTS_ASSISTANT", weight: 12, terms: ["ai parts assistant", "parts assistant", "identify a part", "part identification"] },
    { id: "VIN", weight: 14, terms: ["vin", "vehicle identification"] },
    { id: "OEM_NUMBER", weight: 12, terms: ["oem number", "oem part number", "part number"] },
    { id: "PART_IDENTIFICATION", weight: 11, terms: ["identify", "image recognition", "photo of a part", "compatible alternative", "decode"] },
    { id: "B2B_MARKETPLACE", weight: 10, terms: ["b2b marketplace", "marketplace", "catalogue", "catalog", "procurement"] },
    { id: "WORKSHOP", weight: 12, terms: ["workshop", "garage", "mechanic", "repair", "spare parts", "sourcing parts", "source spare", "automotive component"] },
    { id: "MANUFACTURER", weight: 11, terms: ["manufacturer", "manufacturers", "msme", "component maker"] },
    { id: "OEM", weight: 11, terms: ["oem", "oems", "original equipment"] },
    { id: "DISTRIBUTOR", weight: 11, terms: ["distributor", "dealer", "dealers", "unsold inventory"] },
    { id: "EXPORTER", weight: 12, terms: ["exporter", "export", "international buyer", "cross-border", "exports"] },
    { id: "LOGISTICS", weight: 10, terms: ["logistics", "shipment", "freight", "delivery partner"] },
    { id: "FINANCIAL_INSTITUTION", weight: 10, terms: ["financial institution", "bank", "nbfc", "finance"] },
    { id: "AI", weight: 9, terms: ["ai capabilities", "artificial intelligence", "two ai engines", "ai engine"] },
    { id: "PROBLEM", weight: 10, terms: ["problem", "fragmented", "pain point", "whatsapp", "phone calls", "challenge", "why does india need"] },
    { id: "ECOSYSTEM", weight: 9, terms: ["ecosystem", "who does it serve", "who does autogrid serve", "stakeholders", "who is autogrid for"] },
    { id: "OVERVIEW", weight: 8, terms: ["what is autogrid", "what exactly is", "explain autogrid", "autogrid kya", "ye platform", "about autogrid", "what does autogrid do", "what is this website", "what is this platform", "this website"] }
  ];

  function normalize(text) {
    return String(text || "")
      .toLowerCase()
      .replace(/[’']/g, "'")
      .replace(/[^a-z0-9\u0900-\u097f\s$]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function isHinglish(text) {
    return HI_RE.test(text) || /[\u0900-\u097F]/.test(text);
  }

  function pick(lang, en, hi) {
    return lang === "hi" && hi ? hi : en;
  }

  function detectIntent(raw) {
    const text = normalize(raw);
    if (!text) return { intent: "UNKNOWN", lang: "en", entities: [] };

    const lang = isHinglish(raw) ? "hi" : "en";
    if (JAILBREAK_RE.test(raw)) return { intent: "JAILBREAK", lang, entities: [] };
    if (GREETING_RE.test(raw.trim())) return { intent: "GREETING", lang, entities: [] };
    if (MARKETPLACE_ONLY_RE.test(text) || MARKETPLACE_ONLY_RE.test(raw)) {
      return { intent: "COMPETITIVE_DIFFERENTIATION", lang, entities: ["marketplace"] };
    }
    if (/\bautomandi\b/i.test(raw)) return { intent: "AUTOMANDI", lang, entities: [] };
    if (LIVE_RE.test(text) || LIVE_RE.test(raw)) return { intent: "LIVE_DATA", lang, entities: [] };

    const scores = {};
    INTENT_GROUPS.forEach((group) => {
      group.terms.forEach((term) => {
        if (text.includes(term)) {
          scores[group.id] = (scores[group.id] || 0) + group.weight + Math.min(term.length / 8, 4);
        }
      });
    });

    if (/\bsix solutions?\b|\b6 solutions?\b|six capabilities|integrated solutions/.test(text)) {
      scores.SIX_SOLUTIONS = 22;
    }

    const shortFollowUp = /^(what about|and|can it|does it|how about|uske|iske|ye kya|aur)\b/.test(text) || text.split(" ").length <= 4;
    if (shortFollowUp && memory.lastIntent) {
      if (/\bvin\b/.test(text)) return { intent: "VIN", lang, entities: ["vin"] };
      if (/oem number|part number/.test(text)) return { intent: "OEM_NUMBER", lang, entities: ["oem-number"] };
      if (/identify|image|photo/.test(text) && memory.lastTopic === "parts") return { intent: "PART_IDENTIFICATION", lang, entities: [] };
      scores[memory.lastIntent] = (scores[memory.lastIntent] || 0) + 8;
    }

    let best = "UNKNOWN";
    let bestScore = 0;
    Object.keys(scores).forEach((id) => {
      if (scores[id] > bestScore) {
        best = id;
        bestScore = scores[id];
      }
    });

    if (bestScore < 8) best = memory.lastIntent && shortFollowUp ? memory.lastIntent : "UNKNOWN";

    const entities = [];
    if (/\boems?\b/.test(text)) entities.push("oem");
    if (/\bvin\b/.test(text)) entities.push("vin");
    if (/workshop|garage/.test(text)) entities.push("workshop");
    if (/exporter|export/.test(text)) entities.push("exporter");
    if (/manufacturer/.test(text)) entities.push("manufacturer");
    if (/distributor|dealer/.test(text)) entities.push("distributor");

    if (best === "OEM" && /supplier|discover|find|onboard/.test(text)) best = "OEM_SUPPLIER_DISCOVERY";
    if (best === "AI_PARTS_ASSISTANT" && /\bvin\b/.test(text)) best = "VIN";

    return { intent: best, lang, entities };
  }

  function answer(intent, lang) {
    const chips = TOPIC_CHIPS[intent] || TOPIC_CHIPS.UNKNOWN;

    const map = {
      GREETING: () => ({
        paragraphs: [pick(lang,
          "Welcome to AutoGrid. I'm the AutoGrid Assistant — I can help you explore our AI-powered automotive business network, procurement solutions and connected ecosystem.",
          "Welcome to AutoGrid. Main AutoGrid Assistant hoon — AI-powered automotive business network, procurement aur connected ecosystem samajhne mein help karta hoon."
        )],
        chips: OPENING_CHIPS
      }),
      AUTOMANDI: () => ({
        paragraphs: [pick(lang,
          "If you're referring to this platform, AutoGrid is India's AI-powered automotive business network. It is designed to connect manufacturers, suppliers, workshops, OEMs and other automotive businesses through one intelligent digital platform.",
          "Agar aap is platform ki baat kar rahe hain, to ye AutoGrid hai — India's AI-powered automotive business network. Ye manufacturers, suppliers, workshops, OEMs aur doosre automotive businesses ko ek intelligent digital platform par connect karta hai."
        )],
        chips: TOPIC_CHIPS.AUTOMANDI
      }),
      WEBSITE: () => ({
        paragraphs: [pick(lang,
          "This is AutoGrid — an AI-powered automotive business network designed to connect manufacturers, suppliers, workshops, OEMs and other automotive stakeholders through one intelligent digital platform.",
          "Ye AutoGrid hai — ek AI-powered automotive business network jo manufacturers, suppliers, workshops, OEMs aur doosre automotive stakeholders ko ek intelligent digital platform par connect karta hai."
        )],
        chips: TOPIC_CHIPS.OVERVIEW
      }),
      OVERVIEW: () => ({
        paragraphs: [pick(lang,
          "AutoGrid is India's AI-powered automotive business network. It is designed to connect manufacturers, suppliers, workshops, OEMs, distributors, dealers, exporters, logistics partners, fleet operators and financial institutions on one intelligent digital platform.",
          "AutoGrid India's AI-powered automotive business network hai. Ye manufacturers, suppliers, workshops, OEMs, distributors, dealers, exporters, logistics partners, fleet operators aur financial institutions ko ek intelligent digital platform par connect karta hai."
        ), pick(lang,
          "The source positions the core problem as ecosystem connectivity — not a lack of manufacturing capacity — and describes AutoGrid as the connective tissue of India's automotive industry, not simply a marketplace.",
          "Source ke mutabik asli problem manufacturing capacity ki kami nahi, balki ecosystem connectivity hai. AutoGrid ko sirf marketplace nahi, balki automotive industry ka connective tissue position kiya gaya hai."
        )],
        chips
      }),
      PROBLEM: () => ({
        paragraphs: [pick(lang,
          "India's automotive industry has strong manufacturing capacity, but the source describes a fragmented ecosystem: procurement split across thousands of suppliers, limited unified visibility, inventory gaps, overstock and shortages, and heavy dependence on phone calls, WhatsApp and paper-based communication.",
          "India ke automotive industry mein manufacturing capacity strong hai, lekin ecosystem fragmented hai — procurement scattered hai, supplier visibility limited hai, inventory gaps hain, aur kaam ab bhi phone, WhatsApp aur paper par chalata hai."
        ), pick(lang,
          "AutoGrid is designed to replace that fragmentation with connected, AI-powered workflows across discovery, procurement, inventory, documentation and intelligence.",
          "AutoGrid is fragmentation ko connected, AI-powered workflows se replace karne ke liye design kiya gaya hai."
        )],
        chips
      }),
      ECOSYSTEM: () => ({
        paragraphs: [pick(lang,
          "AutoGrid is designed to connect the automotive ecosystem: manufacturers, OEMs, Tier 1 and Tier 2 suppliers, distributors, dealers, workshops, fleet operators, exporters, logistics partners and financial institutions.",
          "AutoGrid automotive ecosystem ko connect karta hai: manufacturers, OEMs, Tier 1/Tier 2 suppliers, distributors, dealers, workshops, fleet operators, exporters, logistics partners aur financial institutions."
        )],
        bullets: pick(lang, [
          "Manufacturers — structured catalogues and better OEM/buyer reach",
          "OEMs — faster verified supplier discovery and onboarding",
          "Workshops — faster parts sourcing by image, VIN or part number",
          "Exporters — buyer access, export intelligence and documentation"
        ], [
          "Manufacturers — structured catalogues aur OEM/buyer reach",
          "OEMs — verified supplier discovery aur faster onboarding",
          "Workshops — image, VIN ya part number se faster sourcing",
          "Exporters — buyer access, export intelligence aur documentation"
        ]),
        chips
      }),
      SIX_SOLUTIONS: () => ({
        paragraphs: [pick(lang,
          "AutoGrid brings six connected capabilities together:",
          "AutoGrid ke six connected capabilities ye hain:"
        )],
        bullets: [
          "B2B Marketplace — verified automotive procurement",
          "AI Business Advisor — business, compliance and export guidance",
          "OEM Supplier Discovery — verified manufacturer discovery",
          "AI Parts Assistant — image, VIN and OEM-number based part identification",
          "Inventory Exchange — connects surplus inventory with demand",
          "Trade Documentation — digitized domestic and international documentation"
        ],
        chips: ["AI Parts Assistant", "Inventory Exchange", "Is AutoGrid just a marketplace?"]
      }),
      B2B_MARKETPLACE: () => ({
        paragraphs: [pick(lang,
          "The B2B Marketplace is designed to connect buyers and suppliers through structured automotive catalogues, with the goal of verified automotive procurement — not unstructured browsing.",
          "B2B Marketplace buyers aur suppliers ko structured automotive catalogues ke through connect karta hai, taaki procurement verified aur organised ho."
        ), pick(lang,
          "It is one layer of AutoGrid. The platform is not positioned as a marketplace alone.",
          "Ye AutoGrid ka ek layer hai — poora platform sirf marketplace nahi hai."
        )],
        chips
      }),
      AI_BUSINESS_ADVISOR: () => ({
        paragraphs: [pick(lang,
          "The AI Business Advisor is designed for business guidance: compliance, export intelligence, government schemes, supplier growth and broader market/business direction.",
          "AI Business Advisor business guidance ke liye design kiya gaya hai — compliance, export intelligence, government schemes, supplier growth aur market guidance."
        ), pick(lang,
          "It is distinct from the AI Parts Assistant, which focuses on part identification and sourcing rather than business advisory.",
          "Ye AI Parts Assistant se alag hai, jo parts identification aur sourcing par focused hai."
        )],
        chips
      }),
      OEM_SUPPLIER_DISCOVERY: () => ({
        paragraphs: [pick(lang,
          "OEM Supplier Discovery is designed to help OEMs identify and onboard verified manufacturers, making supplier discovery faster and more scalable than manual, resource-intensive searches.",
          "OEM Supplier Discovery OEMs ko verified manufacturers identify aur onboard karne mein help karta hai, taaki supplier discovery faster aur scalable ho."
        )],
        chips
      }),
      AI_PARTS_ASSISTANT: () => ({
        paragraphs: [pick(lang,
          "AutoGrid's AI Parts Assistant is designed to identify automotive parts using images, VINs and OEM part numbers. The platform capability set includes part identification, VIN lookup/decoding, OEM-number matching, compatible alternatives, availability, pricing and multi-supplier comparison.",
          "AutoGrid ka AI Parts Assistant parts ko image, VIN aur OEM part number se identify karne ke liye design kiya gaya hai — identification, VIN decoding, OEM matching, alternatives, availability, pricing aur supplier comparison ke saath."
        ), pick(lang,
          "This website assistant cannot run live VIN lookup, image recognition or real-time pricing. Those are described as AutoGrid platform capabilities. You can explore the AI Parts Assistant section on the Platform page.",
          "Ye website assistant live VIN lookup, image recognition ya real-time pricing nahi karta. Ye AutoGrid platform capabilities hain. Platform page par AI Parts Assistant section dekh sakte hain."
        )],
        chips
      }),
      PART_IDENTIFICATION: () => ({
        paragraphs: [pick(lang,
          "Yes — the AutoGrid platform is designed to identify parts from an image, VIN or OEM part number, then support compatibility, alternatives and supplier matching.",
          "Haan — AutoGrid platform parts ko image, VIN ya OEM part number se identify karne ke liye design kiya gaya hai."
        ), pick(lang,
          "I cannot perform that identification from this hardcoded assistant. Use the Platform page's AI Parts Assistant to try the on-site identification flow, or ask how the capability is designed to work.",
          "Is hardcoded assistant se main live identification nahi kar sakta. Platform page par AI Parts Assistant try kijiye."
        )],
        chips
      }),
      VIN: () => ({
        paragraphs: [pick(lang,
          "The AI Parts Assistant is designed to support VIN lookup and decoding as part of part identification and vehicle-compatible sourcing.",
          "AI Parts Assistant VIN lookup aur decoding support karne ke liye design kiya gaya hai."
        ), pick(lang,
          "This chatbot does not have access to a live VIN database. VIN identification is described as an AutoGrid platform capability, which you can explore on the Platform page.",
          "Is chatbot ke paas live VIN database nahi hai. VIN identification AutoGrid platform capability ke taur par describe ki gayi hai."
        )],
        chips
      }),
      OEM_NUMBER: () => ({
        paragraphs: [pick(lang,
          "The platform is designed to match OEM part numbers to the correct component, compatible alternatives and supplier options.",
          "Platform OEM part numbers ko sahi component, compatible alternatives aur supplier options se match karne ke liye design kiya gaya hai."
        ), pick(lang,
          "I cannot look up a live OEM catalogue from this assistant. The Platform page includes a part-number flow inside the AI Parts Assistant.",
          "Is assistant se live OEM catalogue lookup possible nahi hai. Platform page par part-number flow available hai."
        )],
        chips
      }),
      INVENTORY_EXCHANGE: () => ({
        paragraphs: [pick(lang,
          "Inventory Exchange is designed to connect surplus inventory with businesses that need it. The purpose is to reduce inventory waste, unlock tied-up capital, improve visibility and match supply with demand.",
          "Inventory Exchange surplus inventory ko un businesses se connect karta hai jinko uski zaroorat hai — waste kam karne, capital unlock karne aur supply-demand match karne ke liye."
        )],
        chips
      }),
      TRADE_DOCUMENTATION: () => ({
        paragraphs: [pick(lang,
          "Trade Documentation is designed to digitize domestic and international business documentation so it is faster, more compliant and audit-ready than paper-heavy processes.",
          "Trade Documentation domestic aur international documentation ko digitize karta hai — faster, more compliant aur audit-ready banane ke liye."
        ), pick(lang,
          "The source does not describe AutoGrid as guaranteeing government approval or compliance outcomes.",
          "Source AutoGrid ko government approval ya compliance guarantee ke taur par present nahi karta."
        )],
        chips
      }),
      WORKSHOP: () => ({
        paragraphs: [pick(lang,
          "The source frames a workshop pain point as spending more time sourcing parts than repairing vehicles. AutoGrid is designed to shorten that loop through the AI Parts Assistant and verified supplier discovery.",
          "Workshops ka pain point ye hai ki repairing se zyada time parts sourcing mein nikal jata hai. AutoGrid is loop ko AI Parts Assistant aur verified supplier discovery se chhota karne ke liye design kiya gaya hai."
        )],
        bullets: pick(lang, [
          "Identify parts using image, VIN or OEM part number",
          "Discover verified suppliers",
          "Compare available inventory and supplier options"
        ], [
          "Parts ko image, VIN ya OEM part number se identify kiya ja sakta hai",
          "Verified suppliers discover kiye ja sakte hain",
          "Available inventory aur supplier options compare kiye ja sakte hain"
        ]),
        chips
      }),
      MANUFACTURER: () => ({
        paragraphs: [pick(lang,
          "The source describes a manufacturer pain point as building quality products but struggling to reach OEMs. AutoGrid is designed to give manufacturers structured catalogues, digital discovery and a path into OEM supplier discovery.",
          "Manufacturers quality products banate hain lekin OEMs tak pahunchna mushkil hota hai. AutoGrid structured catalogues, digital discovery aur OEM supplier discovery ke through unhe reach dene ke liye design kiya gaya hai."
        )],
        chips
      }),
      OEM: () => ({
        paragraphs: [pick(lang,
          "The source describes OEM pain as slow, resource-intensive supplier finding. AutoGrid's OEM Supplier Discovery is designed to help OEMs identify and onboard verified manufacturers at greater speed and scale.",
          "OEMs ke liye verified suppliers dhundhna slow aur resource-intensive hota hai. AutoGrid ka OEM Supplier Discovery is process ko faster aur scalable banana chahta hai."
        )],
        chips
      }),
      DISTRIBUTOR: () => ({
        paragraphs: [pick(lang,
          "For distributors and dealers, the source highlights unsold inventory because buyers cannot find it. AutoGrid is designed to improve inventory visibility and demand matching through the marketplace and Inventory Exchange.",
          "Distributors/dealers ka inventory unsold reh sakta hai kyunki buyers usse dhoondh nahi paate. AutoGrid marketplace aur Inventory Exchange se visibility aur demand matching improve karne ke liye design kiya gaya hai."
        )],
        chips
      }),
      EXPORTER: () => ({
        paragraphs: [pick(lang,
          "The source frames an exporter pain point as not knowing where to find international buyers. AutoGrid is designed to support exporters with international buyer access, export intelligence and digitized trade documentation.",
          "Exporters ko international buyers dhundhne mein difficulty hoti hai. AutoGrid unhe buyer access, export intelligence aur digitized trade documentation se support karne ke liye design kiya gaya hai."
        )],
        chips
      }),
      LOGISTICS: () => ({
        paragraphs: [pick(lang,
          "Logistics partners are part of the AutoGrid ecosystem. The platform is designed to connect trade flows so movement of goods can sit alongside procurement, inventory and documentation rather than remaining a disconnected step.",
          "Logistics partners AutoGrid ecosystem ka hissa hain. Platform trade flows ko procurement, inventory aur documentation ke saath connect karne ke liye design kiya gaya hai."
        )],
        chips
      }),
      FINANCIAL_INSTITUTION: () => ({
        paragraphs: [pick(lang,
          "Financial institutions are described as stakeholders who gain an institutional trust layer and ecosystem visibility — not as a live lending product inside this website assistant.",
          "Financial institutions ke liye source institutional trust layer aur ecosystem visibility describe karta hai. Ye assistant koi live lending product nahi hai."
        )],
        chips
      }),
      CCI_INDIA: () => ({
        paragraphs: [pick(lang,
          "The source positions CCI India as well placed to build the platform because of institutional trust, policy access, industry reach with OEMs/MSMEs/associations, trade facilitation and the ability to convene stakeholders.",
          "Source ke mutabik CCI India platform build karne ke liye well placed hai — institutional trust, policy access, industry reach, trade facilitation aur stakeholder convening ki wajah se."
        ), pick(lang,
          "I don't have details of specific government contracts, endorsements or named partnerships beyond that positioning.",
          "Specific government contracts, endorsements ya named partnerships ke baare mein mere knowledge base mein extra detail nahi hai."
        )],
        chips
      }),
      AI: () => ({
        paragraphs: [pick(lang,
          "The source describes AI as operating across AutoGrid transactions and interactions. Two major engines are distinguished:",
          "Source ke mutabik AI AutoGrid ke transactions aur interactions across operate karta hai. Do major engines hain:"
        )],
        bullets: [
          "AI Parts Assistant — part identification, compatibility, VIN/OEM matching and sourcing",
          "AI Business Advisor — business guidance, compliance, export intelligence, schemes and supplier growth"
        ],
        chips
      }),
      WORKFLOW: () => ({
        paragraphs: [pick(lang,
          "The platform workflow is described as Onboard → Discover → Transact → Fulfill. Manufacturers upload products and AI structures the catalogue; workshops can search by image, VIN or part number; buyers locate inventory, select a verified supplier and process an order; fulfillment covers shipment and generated business intelligence.",
          "Workflow hai: Onboard → Discover → Transact → Fulfill. Manufacturers products upload karte hain, workshops image/VIN/part number se search karte hain, buyers verified suppliers se order process karte hain, aur fulfillment se business intelligence generate hoti hai."
        ), pick(lang,
          "Every transaction is described as contributing to ecosystem intelligence.",
          "Har transaction ecosystem intelligence mein contribute karta hai — ye source ka model hai."
        )],
        chips
      }),
      COMPETITIVE_DIFFERENTIATION: () => ({
        paragraphs: [pick(lang,
          "No. AutoGrid is positioned as a broader digital infrastructure layer for India's automotive ecosystem. It combines procurement, verified supplier discovery, inventory exchange, AI assistance, OEM connectivity, trade documentation and business intelligence.",
          "Nahi. AutoGrid ko sirf marketplace nahi, balki India's automotive ecosystem ke liye broader digital infrastructure layer ki tarah position kiya gaya hai — procurement, supplier discovery, inventory exchange, AI, OEM connectivity, documentation aur intelligence ke saath."
        )],
        bullets: [
          "Integrated AI",
          "Verified supplier network",
          "Inventory exchange",
          "Automated trade documentation",
          "OEM network and export enablement",
          "Institutional trust and business intelligence"
        ],
        chips
      }),
      WHY_NOW: () => ({
        paragraphs: [pick(lang,
          "The source identifies urgency from verified supply-chain demand, B2B digital transformation, rising vehicle complexity, EV and advanced technology growth, AI-enabled procurement, business intelligence needs, government focus on manufacturing/MSME growth, and rising export opportunities for Indian component manufacturers.",
          "Source ke mutabik urgency isliye hai kyunki verified supply chains, B2B digital transformation, vehicle complexity, EVs, AI-enabled procurement, MSME/manufacturing focus aur export opportunities badh rahe hain."
        )],
        chips
      }),
      FUNDING: () => ({
        paragraphs: [pick(lang,
          "The source outlines a $1 million strategic investment requirement/plan for scaling India's AI-powered automotive business network. It does not confirm that AutoGrid has already raised $1 million.",
          "Source $1 million ka strategic investment requirement/plan outline karta hai. Ye confirm nahi karta ki AutoGrid ne $1 million raise kar liye hain."
        )],
        bullets: [
          "Platform Infrastructure, Cloud & AI — $120K",
          "Industry Partnerships & OEM Onboarding — $220K",
          "Sales, Marketing & Customer Acquisition — $200K",
          "Operations + Business Development + Compliance + Working Capital — $460K"
        ],
        chips
      }),
      REVENUE_MODEL: () => ({
        paragraphs: [pick(lang,
          "The source describes multiple intended revenue streams rather than confirmed current earnings:",
          "Source intended revenue streams describe karta hai — confirmed current earnings nahi:"
        )],
        bullets: [
          "Platform Membership Plans",
          "Marketplace Transaction Fees",
          "Inventory Exchange Services",
          "OEM Supplier Discovery Premium",
          "Trade & Compliance Services",
          "Market Intelligence & API Licensing",
          "Advertising & Strategic Partner Commissions"
        ],
        chips
      }),
      REVENUE_PROJECTIONS: () => ({
        paragraphs: [pick(lang,
          "The source provides projected revenue rather than confirmed current revenue. Its five-year projection ranges from $310K in Year 1 to $28.5M in Year 5.",
          "Source projected revenue deta hai, confirmed current revenue nahi. Five-year projection Year 1 mein $310K se Year 5 mein $28.5M tak hai."
        )],
        bullets: [
          "Year 1 — $310,000",
          "Year 2 — $1,350,000",
          "Year 3 — $4,570,000",
          "Year 4 — $12,100,000",
          "Year 5 — $28,500,000"
        ],
        chips
      }),
      ARPU: () => ({
        paragraphs: [pick(lang,
          "These are business-plan assumptions/projections from the source, not reported actuals:",
          "Ye source ke business-plan assumptions/projections hain, reported actuals nahi:"
        )],
        bullets: [
          "Platform Membership Plans — $1,500 annual ARPU",
          "Marketplace Transaction Fees — $400",
          "Inventory Exchange — $1,000",
          "OEM Supplier Discovery Premium — $5,000",
          "Trade & Compliance — $1,000",
          "Market Intelligence & API — $5,000",
          "Advertising & Strategic Partner Commissions — $500"
        ],
        chips
      }),
      NAVIGATION: () => ({
        paragraphs: [pick(lang,
          "This website is AutoGrid. Primary navigation is Home, Platform, Business and Contact. The Platform section covers the six capabilities, including the AI Parts Assistant and B2B Marketplace. Business covers stakeholder solutions and the AI Business Advisor.",
          "Ye website AutoGrid hai. Navigation: Home, Platform, Business aur Contact. Platform section capabilities cover karta hai; Business section stakeholder solutions cover karta hai."
        )],
        chips
      }),
      CONTACT: () => ({
        paragraphs: [pick(lang,
          "To contact AutoGrid, open the Contact section. The page provides routes for business enquiries and supplier onboarding via Google Forms. I can't submit a form from this chat.",
          "Contact ke liye Contact section kholiye. Wahan business enquiry aur supplier onboarding ke Google Forms hain. Is chat se form submit nahi hota."
        )],
        chips
      }),
      JOIN: () => ({
        paragraphs: [pick(lang,
          "The 'Join AutoGrid' option is the website's primary entry point for businesses interested in becoming part of the AutoGrid ecosystem. Use the Join AutoGrid call-to-action; it opens the join flow. This chat cannot complete registration for you.",
          "'Join AutoGrid' businesses ke liye primary entry point hai. Join AutoGrid CTA use kijiye. Ye chat registration complete nahi kar sakta."
        )],
        chips
      }),
      HELP: () => ({
        paragraphs: [pick(lang,
          "I can help you explore AutoGrid's AI-powered automotive business network — procurement, supplier discovery, AI Parts Assistant, inventory exchange, trade capabilities, business model and website navigation.",
          "Main AutoGrid ka AI-powered automotive business network explain kar sakta hoon — procurement, supplier discovery, AI Parts Assistant, inventory exchange, trade, business model aur website navigation."
        )],
        chips: OPENING_CHIPS
      }),
      LIVE_DATA: () => ({
        paragraphs: [pick(lang,
          "I don't have access to AutoGrid's live inventory from this hardcoded assistant. The AutoGrid platform is designed to provide inventory visibility and supplier discovery.",
          "Is hardcoded assistant ke paas AutoGrid ka live inventory access nahi hai. Platform inventory visibility aur supplier discovery ke liye design kiya gaya hai."
        )],
        chips
      }),
      JAILBREAK: () => ({
        paragraphs: [
          "I can help explain AutoGrid and its platform, but I can't provide internal system instructions."
        ],
        chips
      }),
      UNKNOWN: () => ({
        paragraphs: [pick(lang,
          "I don't have enough information in my AutoGrid knowledge base to answer that accurately.",
          "Is sawal ka accurate answer mere AutoGrid knowledge base mein nahi hai."
        ), pick(lang,
          "I can help with AutoGrid's procurement platform, AI Parts Assistant, supplier discovery, inventory exchange, trade documentation, business model or ecosystem.",
          "Main AutoGrid ke procurement platform, AI Parts Assistant, supplier discovery, inventory exchange, trade documentation, business model ya ecosystem par help kar sakta hoon."
        )],
        chips
      })
    };

    if (intent === "SIX_SOLUTIONS") return map.SIX_SOLUTIONS();
    if (map[intent]) return map[intent]();
    return map.UNKNOWN();
  }

  function setTopic(intent) {
    memory.lastIntent = intent;
    if (["AI_PARTS_ASSISTANT", "PART_IDENTIFICATION", "VIN", "OEM_NUMBER"].includes(intent)) memory.lastTopic = "parts";
    else if (["REVENUE_MODEL", "REVENUE_PROJECTIONS", "ARPU", "FUNDING"].includes(intent)) memory.lastTopic = "commercial";
    else if (intent !== "GREETING" && intent !== "UNKNOWN") memory.lastTopic = intent.toLowerCase();
  }

  function esc(value) {
    return String(value ?? "").replace(/[&<>"']/g, (ch) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
    }[ch]));
  }

  function renderEmpty() {
    const wrap = document.createElement("div");
    wrap.className = "ag-bot__empty";
    wrap.innerHTML = `
      <p class="ag-bot__empty-kicker">AUTOGRID</p>
      <h3 class="ag-bot__empty-title">INTELLIGENCE</h3>
      <p>Explore the automotive ecosystem.</p>
      <p>Ask me about procurement, suppliers, parts, inventory, exports or AutoGrid's platform.</p>
    `;
    bodyEl.appendChild(wrap);
  }

  function addChips(chips) {
    if (!chips || !chips.length) return;
    const row = document.createElement("div");
    row.className = "ag-bot__chips";
    row.setAttribute("role", "group");
    row.setAttribute("aria-label", "Suggested questions");
    chips.forEach((label) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "ag-bot__chip";
      btn.textContent = label;
      btn.addEventListener("click", () => submitText(label));
      row.appendChild(btn);
    });
    bodyEl.appendChild(row);
  }

  function addMessage(role, payload) {
    const msg = document.createElement("article");
    msg.className = "ag-bot__msg ag-bot__msg--" + role;
    msg.setAttribute("role", role === "user" ? "listitem" : "status");

    const paragraphs = typeof payload === "string" ? [payload] : (payload.paragraphs || []);
    paragraphs.forEach((text) => {
      const p = document.createElement("p");
      p.textContent = text;
      msg.appendChild(p);
    });

    if (payload && payload.bullets && payload.bullets.length) {
      const ul = document.createElement("ul");
      payload.bullets.forEach((item) => {
        const li = document.createElement("li");
        li.textContent = item;
        ul.appendChild(li);
      });
      msg.appendChild(ul);
    }

    if (role === "bot") {
      const copy = document.createElement("button");
      copy.type = "button";
      copy.className = "ag-bot__copy";
      copy.setAttribute("aria-label", "Copy response");
      copy.innerHTML = '<svg viewBox="0 0 24 24" fill="none"><rect x="8" y="8" width="11" height="11" rx="2" stroke="currentColor" stroke-width="1.7"/><path d="M5 16V6a2 2 0 012-2h10" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>';
      copy.addEventListener("click", () => {
        const text = msg.innerText.replace(/\s+$/, "");
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).catch(() => {});
        }
      });
      msg.appendChild(copy);
    }

    if (payload && payload.error) {
      msg.classList.add("ag-bot__msg--error");
      const retry = document.createElement("button");
      retry.type = "button";
      retry.className = "ag-bot__retry";
      retry.textContent = "Retry";
      retry.addEventListener("click", () => {
        if (memory.lastUserText) submitText(memory.lastUserText);
      });
      msg.appendChild(retry);
    }

    bodyEl.appendChild(msg);
    if (payload && payload.chips) addChips(payload.chips);
    scrollToEnd();
  }

  function scrollToEnd() {
    bodyEl.scrollTop = bodyEl.scrollHeight;
  }

  function showTyping() {
    const el = document.createElement("div");
    el.className = "ag-bot__typing";
    el.setAttribute("aria-label", "Assistant is responding");
    el.innerHTML = "<span></span><span></span><span></span>";
    bodyEl.appendChild(el);
    scrollToEnd();
    return el;
  }

  function seedConversation() {
    bodyEl.innerHTML = "";
    renderEmpty();
    addMessage("bot", {
      paragraphs: [
        "Welcome to AutoGrid.",
        "I can help you explore AutoGrid's AI-powered automotive business network, procurement solutions, supplier discovery, inventory exchange and trade capabilities."
      ]
    });
    addChips(OPENING_CHIPS);
    memory.lastIntent = "GREETING";
    memory.lastTopic = null;
  }

  function submitText(text) {
    const value = String(text || "").trim();
    if (!value) return;
    memory.lastUserText = value;
    addMessage("user", value);
    input.value = "";

    const typing = showTyping();
    sendBtn.disabled = true;

    window.setTimeout(() => {
      try {
        typing.remove();
        const detected = detectIntent(value);
        if (/what is this (website|platform|site)/i.test(value)) detected.intent = "WEBSITE";
        const payload = answer(detected.intent, detected.lang);
        setTopic(detected.intent);
        addMessage("bot", payload);
      } catch (err) {
        typing.remove();
        addMessage("bot", {
          paragraphs: ["Something went wrong. Please try again."],
          error: true
        });
      } finally {
        sendBtn.disabled = false;
        input.focus();
      }
    }, 180);
  }

  function openPanel() {
    root.classList.add("is-open");
    panel.hidden = false;
    launcher.setAttribute("aria-expanded", "true");
    launcher.setAttribute("aria-label", "Close AutoGrid Assistant");
    notify.classList.add("is-hidden");
    if (!memory.openedOnce) {
      seedConversation();
      memory.openedOnce = true;
    }
    window.setTimeout(() => input.focus(), 50);
  }

  function closePanel() {
    root.classList.remove("is-open");
    panel.hidden = true;
    launcher.setAttribute("aria-expanded", "false");
    launcher.setAttribute("aria-label", "Open AutoGrid Assistant");
    launcher.focus();
  }

  function togglePanel() {
    if (panel.hidden) openPanel();
    else closePanel();
  }

  launcher.addEventListener("click", togglePanel);
  closeBtn.addEventListener("click", closePanel);
  clearBtn.addEventListener("click", () => {
    seedConversation();
    input.focus();
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    submitText(input.value);
  });

  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submitText(input.value);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !panel.hidden) {
      closePanel();
    }
  });

  if (window.visualViewport) {
    const syncViewport = () => {
      if (window.matchMedia("(max-width: 640px)").matches && !panel.hidden) {
        panel.style.height = Math.max(280, window.visualViewport.height - 16) + "px";
      } else {
        panel.style.height = "";
      }
    };
    window.visualViewport.addEventListener("resize", syncViewport);
  }

  void autoGridKnowledge;
})();
