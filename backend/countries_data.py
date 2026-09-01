import re
import zlib

REGIONS = {
    "sea": {"label": "Southeast Asia", "transit": "3–10 days",
            "angle": "Regional proximity means fast sailings, low freight cost and easy factory visits from anywhere in Southeast Asia."},
    "easia": {"label": "East Asia", "transit": "7–14 days",
              "angle": "East Asia's premium residential and hospitality market has adopted green quartzite as the signature finish for high-end pools and spas."},
    "sasia": {"label": "South Asia", "transit": "10–18 days",
              "angle": "From resort atolls to urban luxury towers, South Asian developers specify Sukabumi stone for its performance in hot, humid climates."},
    "casia": {"label": "Central Asia", "transit": "30–45 days (multimodal)",
              "angle": "Central Asian projects reach us through established multimodal corridors, with rail and truck legs handled by experienced forwarders."},
    "me": {"label": "Middle East", "transit": "14–25 days",
           "angle": "The Middle East is one of our strongest markets — green stone stays comfortable underfoot in extreme heat and pairs naturally with resort architecture."},
    "eu": {"label": "Europe", "transit": "28–40 days",
           "angle": "European architects value the stone's sub-0.4% absorption, which lets it survive freeze–thaw cycles that destroy lesser materials."},
    "africa": {"label": "Africa", "transit": "25–40 days",
               "angle": "Africa's fast-growing hospitality and residential sectors source factory-direct to keep landed costs competitive."},
    "na": {"label": "North America", "transit": "25–40 days",
           "angle": "North American pool builders import Pedra Bali for custom residential and boutique-hotel projects that demand an authentic Bali finish."},
    "ca": {"label": "Central America & Caribbean", "transit": "30–45 days",
           "angle": "Caribbean and Central American resorts choose green quartzite for its luminous turquoise effect in beachfront pools."},
    "sa": {"label": "South America", "transit": "35–50 days",
           "angle": "South American importers and distributors partner with us for consistent grading and container programs across the continent."},
    "oceania": {"label": "Oceania", "transit": "10–20 days",
                "angle": "Oceania is a natural market — short sailing times from Indonesia and a strong outdoor-living culture built around pools."},
}

# (name, region_key, gateway port / routing)
COUNTRIES = [
    ("Singapore", "sea", "Port of Singapore"), ("Malaysia", "sea", "Port Klang"), ("Thailand", "sea", "Laem Chabang"),
    ("Vietnam", "sea", "Ho Chi Minh City (Cat Lai)"), ("Philippines", "sea", "Manila"), ("Cambodia", "sea", "Sihanoukville"),
    ("Myanmar", "sea", "Yangon"), ("Laos", "sea", "Vientiane (via Laem Chabang)"), ("Brunei", "sea", "Muara"),
    ("Timor-Leste", "sea", "Dili"),
    ("China", "easia", "Shanghai"), ("Japan", "easia", "Tokyo / Yokohama"), ("South Korea", "easia", "Busan"),
    ("Taiwan", "easia", "Kaohsiung"), ("Hong Kong", "easia", "Hong Kong"), ("Macau", "easia", "Macau (via Hong Kong)"),
    ("Mongolia", "easia", "Ulaanbaatar (via Tianjin)"),
    ("India", "sasia", "Nhava Sheva (Mumbai)"), ("Pakistan", "sasia", "Karachi"), ("Bangladesh", "sasia", "Chattogram"),
    ("Sri Lanka", "sasia", "Colombo"), ("Maldives", "sasia", "Malé"), ("Nepal", "sasia", "Kathmandu (via Kolkata)"),
    ("Bhutan", "sasia", "Thimphu (via Kolkata)"), ("Afghanistan", "sasia", "Kabul (via Karachi)"),
    ("Kazakhstan", "casia", "Almaty (via Lianyungang rail)"), ("Uzbekistan", "casia", "Tashkent (multimodal)"),
    ("Turkmenistan", "casia", "Ashgabat (multimodal)"), ("Kyrgyzstan", "casia", "Bishkek (multimodal)"),
    ("Tajikistan", "casia", "Dushanbe (multimodal)"),
    ("United Arab Emirates", "me", "Jebel Ali (Dubai)"), ("Saudi Arabia", "me", "Jeddah Islamic Port"),
    ("Qatar", "me", "Hamad Port (Doha)"), ("Kuwait", "me", "Shuwaikh"), ("Bahrain", "me", "Khalifa Bin Salman"),
    ("Oman", "me", "Sohar"), ("Jordan", "me", "Aqaba"), ("Israel", "me", "Haifa"), ("Lebanon", "me", "Beirut"),
    ("Iraq", "me", "Umm Qasr"), ("Iran", "me", "Bandar Abbas"), ("Yemen", "me", "Aden"), ("Syria", "me", "Latakia"),
    ("Turkey", "me", "Istanbul (Ambarlı)"), ("Cyprus", "me", "Limassol"),
    ("United Kingdom", "eu", "Felixstowe"), ("Ireland", "eu", "Dublin"), ("France", "eu", "Le Havre"),
    ("Germany", "eu", "Hamburg"), ("Netherlands", "eu", "Rotterdam"), ("Belgium", "eu", "Antwerp"),
    ("Luxembourg", "eu", "Luxembourg (via Antwerp)"), ("Spain", "eu", "Valencia"), ("Portugal", "eu", "Lisbon / Sines"),
    ("Italy", "eu", "Genoa"), ("Greece", "eu", "Piraeus"), ("Malta", "eu", "Marsaxlokk"),
    ("Switzerland", "eu", "Basel (via Rotterdam)"), ("Austria", "eu", "Vienna (via Koper)"),
    ("Poland", "eu", "Gdańsk"), ("Czech Republic", "eu", "Prague (via Hamburg)"),
    ("Slovakia", "eu", "Bratislava (via Koper)"), ("Hungary", "eu", "Budapest (via Koper)"),
    ("Slovenia", "eu", "Koper"), ("Croatia", "eu", "Rijeka"), ("Bosnia and Herzegovina", "eu", "Ploče"),
    ("Serbia", "eu", "Belgrade (via Rijeka)"), ("Montenegro", "eu", "Bar"), ("Albania", "eu", "Durrës"),
    ("North Macedonia", "eu", "Skopje (via Thessaloniki)"), ("Bulgaria", "eu", "Varna"),
    ("Romania", "eu", "Constanța"), ("Moldova", "eu", "Chișinău (via Constanța)"), ("Ukraine", "eu", "Odesa"),
    ("Denmark", "eu", "Aarhus"), ("Sweden", "eu", "Gothenburg"), ("Norway", "eu", "Oslo"),
    ("Finland", "eu", "Helsinki"), ("Iceland", "eu", "Reykjavík"), ("Estonia", "eu", "Tallinn"),
    ("Latvia", "eu", "Riga"), ("Lithuania", "eu", "Klaipėda"), ("Belarus", "eu", "Minsk (via Klaipėda)"),
    ("Russia", "eu", "St. Petersburg"), ("Georgia", "eu", "Poti"), ("Armenia", "eu", "Yerevan (via Poti)"),
    ("Azerbaijan", "eu", "Baku (multimodal)"),
    ("Egypt", "africa", "Alexandria"), ("Morocco", "africa", "Casablanca"), ("Algeria", "africa", "Algiers"),
    ("Tunisia", "africa", "Radès"), ("Libya", "africa", "Tripoli"), ("Sudan", "africa", "Port Sudan"),
    ("South Africa", "africa", "Durban"), ("Nigeria", "africa", "Lagos (Apapa)"), ("Ghana", "africa", "Tema"),
    ("Ivory Coast", "africa", "Abidjan"), ("Senegal", "africa", "Dakar"), ("Kenya", "africa", "Mombasa"),
    ("Tanzania", "africa", "Dar es Salaam"), ("Uganda", "africa", "Kampala (via Mombasa)"),
    ("Rwanda", "africa", "Kigali (via Dar es Salaam)"), ("Ethiopia", "africa", "Addis Ababa (via Djibouti)"),
    ("Djibouti", "africa", "Djibouti"), ("Somalia", "africa", "Mogadishu"), ("Mozambique", "africa", "Maputo"),
    ("Zimbabwe", "africa", "Harare (via Beira)"), ("Zambia", "africa", "Lusaka (via Dar es Salaam)"),
    ("Botswana", "africa", "Gaborone (via Durban)"), ("Namibia", "africa", "Walvis Bay"),
    ("Angola", "africa", "Luanda"), ("DR Congo", "africa", "Matadi"), ("Republic of the Congo", "africa", "Pointe-Noire"),
    ("Cameroon", "africa", "Douala"), ("Gabon", "africa", "Libreville"), ("Benin", "africa", "Cotonou"),
    ("Togo", "africa", "Lomé"), ("Burkina Faso", "africa", "Ouagadougou (via Lomé)"),
    ("Mali", "africa", "Bamako (via Dakar)"), ("Guinea", "africa", "Conakry"), ("Sierra Leone", "africa", "Freetown"),
    ("Liberia", "africa", "Monrovia"), ("Gambia", "africa", "Banjul"), ("Mauritania", "africa", "Nouakchott"),
    ("Niger", "africa", "Niamey (via Cotonou)"), ("Chad", "africa", "N'Djamena (via Douala)"),
    ("Madagascar", "africa", "Toamasina"), ("Mauritius", "africa", "Port Louis"), ("Seychelles", "africa", "Victoria"),
    ("Comoros", "africa", "Moroni"), ("Malawi", "africa", "Lilongwe (via Beira)"),
    ("Eswatini", "africa", "Mbabane (via Durban)"), ("Lesotho", "africa", "Maseru (via Durban)"),
    ("Eritrea", "africa", "Massawa"), ("Cape Verde", "africa", "Praia"), ("Equatorial Guinea", "africa", "Malabo"),
    ("Central African Republic", "africa", "Bangui (via Douala)"), ("South Sudan", "africa", "Juba (via Mombasa)"),
    ("Burundi", "africa", "Bujumbura (via Dar es Salaam)"), ("Guinea-Bissau", "africa", "Bissau"),
    ("São Tomé and Príncipe", "africa", "São Tomé"),
    ("United States", "na", "Los Angeles / Houston / New York"), ("Canada", "na", "Vancouver"),
    ("Mexico", "na", "Manzanillo"),
    ("Guatemala", "ca", "Puerto Quetzal"), ("Belize", "ca", "Belize City"), ("Honduras", "ca", "Puerto Cortés"),
    ("El Salvador", "ca", "Acajutla"), ("Nicaragua", "ca", "Corinto"), ("Costa Rica", "ca", "Puerto Limón"),
    ("Panama", "ca", "Balboa"), ("Cuba", "ca", "Mariel"), ("Jamaica", "ca", "Kingston"),
    ("Haiti", "ca", "Port-au-Prince"), ("Dominican Republic", "ca", "Caucedo"), ("Bahamas", "ca", "Nassau"),
    ("Barbados", "ca", "Bridgetown"), ("Trinidad and Tobago", "ca", "Port of Spain"),
    ("Saint Lucia", "ca", "Castries"), ("Grenada", "ca", "St. George's"), ("Antigua and Barbuda", "ca", "St. John's"),
    ("Dominica", "ca", "Roseau"), ("Saint Kitts and Nevis", "ca", "Basseterre"),
    ("Saint Vincent and the Grenadines", "ca", "Kingstown"),
    ("Brazil", "sa", "Santos"), ("Argentina", "sa", "Buenos Aires"), ("Chile", "sa", "San Antonio"),
    ("Peru", "sa", "Callao"), ("Colombia", "sa", "Cartagena"), ("Ecuador", "sa", "Guayaquil"),
    ("Venezuela", "sa", "La Guaira"), ("Uruguay", "sa", "Montevideo"),
    ("Paraguay", "sa", "Asunción (via Buenos Aires)"), ("Bolivia", "sa", "La Paz (via Arica)"),
    ("Guyana", "sa", "Georgetown"), ("Suriname", "sa", "Paramaribo"),
    ("Australia", "oceania", "Sydney (Port Botany)"), ("New Zealand", "oceania", "Auckland"),
    ("Fiji", "oceania", "Suva"), ("Papua New Guinea", "oceania", "Port Moresby"),
    ("Solomon Islands", "oceania", "Honiara"), ("Vanuatu", "oceania", "Port Vila"), ("Samoa", "oceania", "Apia"),
    ("Tonga", "oceania", "Nuku'alofa"), ("Micronesia", "oceania", "Pohnpei"), ("Palau", "oceania", "Koror"),
    ("Marshall Islands", "oceania", "Majuro"), ("Kiribati", "oceania", "Tarawa"), ("Tuvalu", "oceania", "Funafuti"),
    ("Nauru", "oceania", "Nauru"), ("French Polynesia", "oceania", "Papeete"), ("New Caledonia", "oceania", "Nouméa"),
]


def _slugify(name: str) -> str:
    s = name.lower().replace("'", "").replace("ã", "a").replace("é", "e").replace("ú", "u")
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")


COUNTRIES_INDEX = [
    {"name": n, "slug": _slugify(n), "region": r, "region_label": REGIONS[r]["label"], "port": p}
    for n, r, p in COUNTRIES
]
_BY_SLUG = {c["slug"]: c for c in COUNTRIES_INDEX}


def _pick(options, key):
    return options[zlib.crc32(key.encode()) % len(options)]


def build_country_content(c):
    name, port, region = c["name"], c["port"], REGIONS[c["region"]]
    hero_title = _pick([
        f"Sukabumi Green Stone for {name}",
        f"Pedra Bali, Delivered to {name}",
        f"Indonesian Green Stone for Projects in {name}",
    ], name)
    intro_1 = _pick([
        f"PT. Murfy Alam Indonesia exports premium Sukabumi Green Stone — known worldwide as Pedra Bali — directly from our factory in West Java to buyers in {name}. Pool builders, importers, architects and developers in {name} work with us to source the original zeolite-rich green quartzite at factory-direct prices, with full export documentation handled in-house.",
        f"Looking for a reliable Sukabumi Green Stone supplier serving {name}? PT. Murfy Alam Indonesia ships export-grade Pedra Bali pool tiles, coping, mosaics and cladding from our own facility in Sukabumi, West Java, directly to {name} — no trading companies, no middlemen, one accountable partner.",
        f"From our quarry-side factory in Sukabumi, West Java, PT. Murfy Alam Indonesia delivers the original Pedra Bali green stone to projects across {name}. Every container is cut, graded and packed under one roof, then shipped with complete documentation to your port.",
    ], name + "i1")
    intro_2 = f"{region['angle']} Typical ocean transit from Tanjung Priok (Jakarta) to {port} is {region['transit']}, and our export desk manages the entire chain — from cut list to bill of lading."
    benefits = [
        {"title": "Factory-Direct Pricing", "text": f"No intermediaries between our Sukabumi facility and your project in {name}. You buy at source, with transparent FOB, CFR or CIF quotations."},
        {"title": "Export-Grade Quality", "text": "Every tile is calibrated to ±1 mm, graded piece by piece and documented in a pallet-level QC report before it is packed."},
        {"title": "Proven Logistics", "text": f"Weekly sailings from Jakarta with established routings to {port}. ISPM-15 crates, foam interleaving and professional container lashing as standard."},
        {"title": "Full Documentation", "text": "Commercial invoice, packing list, certificate of origin, phytosanitary/fumigation certificates and B/L — prepared in-house for smooth customs clearance."},
    ]
    applications = [
        {"title": "Swimming Pools", "text": f"The signature luminous turquoise finish for residential and resort pools in {name} — slip-resistant and cool underfoot."},
        {"title": "Wall Cladding & Facades", "text": "Green quartzite, black lava and andesite panels for interior and exterior architectural surfaces."},
        {"title": "Spa & Wellness", "text": "Mesh-mounted mosaics and honed slabs for hammams, spas and wellness suites."},
        {"title": "Paving & Landscaping", "text": "Andesite and lava stone pavers for terraces, walkways and public spaces."},
    ]
    process = [
        {"step": "01", "title": "Inquiry & Quotation", "text": f"Send your drawings or quantities. Within 24 hours you receive a detailed quotation for delivery to {name}."},
        {"step": "02", "title": "Sampling", "text": "Physical samples are couriered worldwide so you can verify colour, finish and grade before committing."},
        {"step": "03", "title": "Production", "text": "Blocks are hand-selected, cut to your specification and graded piece by piece at our Sukabumi facility."},
        {"step": "04", "title": "Export Packing", "text": "ISPM-15 fumigated crates, interleaving and container lashing engineered for long ocean voyages."},
        {"step": "05", "title": "Shipping & Documents", "text": f"Loading at Tanjung Priok, Jakarta, then {region['transit']} ocean transit to {port}. Full document set couriered ahead of arrival."},
    ]
    faq = [
        {"q": f"Do you export Sukabumi Green Stone to {name}?",
         "a": f"Yes. PT. Murfy Alam Indonesia ships Pedra Bali green stone from Jakarta, Indonesia to {name} via {port}, under FOB, CFR or CIF terms with complete export documentation."},
        {"q": f"How long does shipping take from Indonesia to {name}?",
         "a": f"Typical ocean transit from Tanjung Priok (Jakarta) to {port} is {region['transit']}, plus production lead time of 2–4 weeks depending on volume and finish."},
        {"q": "What is the minimum order quantity?",
         "a": f"Our standard MOQ is one 20-ft container (approximately 550–650 m² of 20 mm tiles). LCL trial shipments to {name} are possible for sample verification projects."},
        {"q": f"Can I get samples delivered to {name}?",
         "a": f"Yes — we courier physical sample sets to {name} so you can verify colour, finish and thickness before ordering. Contact our export desk via WhatsApp or the inquiry form."},
        {"q": "Which products are available for export?",
         "a": "Sukabumi Green Stone pool tiles, Pedra Hijau, pool coping and bullnose, mesh-mounted mosaics, black lava stone and andesite — all cut to order in custom sizes and finishes."},
    ]
    return {
        "seo": {
            "title": f"Sukabumi Green Stone Supplier to {name} | Pedra Bali Exporter — PT. Murfy Alam Indonesia",
            "description": f"Import Sukabumi Green Stone (Pedra Bali) to {name} factory-direct from Indonesia. Pool tiles, coping, mosaics & cladding shipped to {port} in {region['transit']}. Get a quote within 24 hours.",
            "keywords": f"sukabumi green stone {name.lower()}, pedra bali supplier {name.lower()}, green stone pool tiles {name.lower()}, indonesian natural stone exporter {name.lower()}, bali stone {name.lower()}",
        },
        "hero": {"overline": f"EXPORT MARKET — {region['label'].upper()}", "title": hero_title,
                 "body": f"Factory-direct Pedra Bali pool tiles, coping and cladding shipped from Indonesia to {port} in {region['transit']}."},
        "intro": [intro_1, intro_2],
        "benefits": benefits,
        "logistics": {"origin": "Tanjung Priok, Jakarta, Indonesia", "destination": port,
                      "transit": region["transit"], "terms": "FOB · CFR · CIF",
                      "packing": "ISPM-15 crates, foam interleaving, container lashing"},
        "applications": applications,
        "process": process,
        "faq": faq,
        "cta": {"title": f"Start Your Project in {name}",
                "text": f"Send your drawings, quantities or just an idea — our export team replies within 24 hours with a delivered quotation for {name}."},
    }


def get_country_payload(slug: str):
    c = _BY_SLUG.get(slug)
    if not c:
        return None
    related = [x for x in COUNTRIES_INDEX if x["region"] == c["region"] and x["slug"] != slug][:6]
    return {**c, "content": build_country_content(c),
            "related": [{"name": r["name"], "slug": r["slug"]} for r in related]}


slugify = _slugify

DEFAULT_KEYWORDS = [
    {"name": "Sukabumi Green Stone", "summary": "the original zeolite-rich green quartzite for luxury swimming pools"},
    {"name": "Pedra Bali", "summary": "the world-famous green quartzite behind Bali's iconic resort pools"},
    {"name": "Green Stone Pool Tiles", "summary": "calibrated green quartzite pool tiles in natural, honed and sawn finishes"},
    {"name": "Pool Coping", "summary": "bullnose, eased-edge and drop-face pool coping cut to drawing"},
    {"name": "Stone Mosaic", "summary": "mesh-mounted green stone mosaics for pools, spas and wet areas"},
    {"name": "Black Lava Stone", "summary": "volcanic basalt for facades, cladding and contemporary architecture"},
    {"name": "Andesite Stone", "summary": "dense grey volcanic stone for paving, steps and public spaces"},
    {"name": "Wall Cladding", "summary": "natural stone panels for interior and exterior architectural walls"},
    {"name": "Pool Paving", "summary": "slip-resistant natural stone for pool decks and surrounds"},
    {"name": "Natural Stone", "summary": "the full range of export-grade Indonesian natural stone, cut to order"},
]


def build_supplier_content(kw, c):
    name, port, region = c["name"], c["port"], REGIONS[c["region"]]
    k = kw["name"]
    kl = k.lower()
    summary = kw.get("summary") or "export-grade Indonesian natural stone, cut to order"
    key = kw["slug"] + c["slug"]
    hero_title = _pick([
        f"{k} Supplier in {name}",
        f"{k} for {name}, Factory-Direct",
        f"Import {k} to {name}",
    ], key)
    intro_1 = _pick([
        f"PT. Murfy Alam Indonesia is a factory-direct supplier of {kl} — {summary} — serving importers, pool builders and architects in {name}. Every order is quarried, cut and graded at our own facility in Sukabumi, West Java, Indonesia, then shipped with complete export documentation to {port}.",
        f"Sourcing {kl} for a project in {name}? We manufacture and export {summary} from Sukabumi, West Java — no trading companies in between. Buyers in {name} receive calibrated, piece-graded stone with a pallet-level QC report in every container.",
        f"As the factory behind the stone, PT. Murfy Alam Indonesia supplies {kl} ({summary}) directly to buyers in {name}. From cut list to bill of lading, one partner is accountable for quality, packing and on-time delivery to {port}.",
    ], key + "i")
    intro_2 = f"{region['angle']} Ocean transit from Tanjung Priok (Jakarta) to {port} is typically {region['transit']}, with a production lead time of 2–4 weeks depending on volume and finish."
    benefits = [
        {"title": f"Factory-Direct {k}", "text": f"You buy {kl} at source. Transparent FOB, CFR or CIF quotations to {name} with no intermediary margins."},
        {"title": "Cut to Your Specification", "text": f"Custom sizes, thicknesses and finishes produced to drawing — {kl} calibrated to ±1 mm export tolerance."},
        {"title": f"Proven Route to {name}", "text": f"Weekly sailings from Jakarta with established routings to {port}. ISPM-15 crates and professional lashing as standard."},
        {"title": "Complete Documentation", "text": "Commercial invoice, packing list, certificate of origin and fumigation certificates prepared in-house for smooth customs clearance."},
    ]
    process = [
        {"step": "01", "title": "Inquiry & Quotation", "text": f"Send drawings or quantities for {kl}. Within 24 hours you receive a delivered quotation for {name}."},
        {"step": "02", "title": "Sampling", "text": f"Physical {kl} samples are couriered to {name} so you can verify colour, finish and grade first."},
        {"step": "03", "title": "Production", "text": f"Blocks are hand-selected and your {kl} is cut, calibrated and graded piece by piece in Sukabumi."},
        {"step": "04", "title": "Export Packing", "text": "ISPM-15 fumigated crates, foam interleaving and container lashing engineered for long ocean voyages."},
        {"step": "05", "title": "Shipping & Documents", "text": f"Loading at Tanjung Priok, then {region['transit']} transit to {port}. Documents couriered ahead of arrival."},
    ]
    faq = [
        {"q": f"Do you supply {kl} to {name}?",
         "a": f"Yes. PT. Murfy Alam Indonesia exports {kl} factory-direct from Sukabumi, Indonesia to {name} via {port}, under FOB, CFR or CIF terms with full export documentation."},
        {"q": f"What is the price of {kl} in {name}?",
         "a": f"Pricing depends on size, thickness, finish and volume. Because we are the factory, importers in {name} buy at source — send your quantities and destination port for a delivered price within 24 hours."},
        {"q": f"How long does delivery of {kl} to {name} take?",
         "a": f"Production takes 2–4 weeks, then ocean transit from Jakarta to {port} is typically {region['transit']}."},
        {"q": "What is the minimum order and can I get samples?",
         "a": f"Standard MOQ is one 20-ft container; LCL trial orders are possible. We courier {kl} sample sets to {name} before you commit."},
        {"q": f"Can {kl} be cut to custom sizes and finishes?",
         "a": f"Yes — {kl} is produced to order: custom dimensions, thicknesses from 10–30 mm and natural, honed, sawn or rough finishes to match your specification."},
    ]
    return {
        "seo": {
            "title": f"{k} Supplier in {name} | Factory-Direct from Indonesia — PT. Murfy Alam Indonesia",
            "description": f"Buy {kl} in {name} factory-direct from Indonesia — {summary}. Shipped to {port} in {region['transit']}. MOQ 1 container, samples available. Quote within 24 hours.",
            "keywords": f"{kl} supplier {name.lower()}, {kl} {name.lower()}, buy {kl} {name.lower()}, {kl} price {name.lower()}, indonesian {kl} exporter",
        },
        "hero": {"overline": f"{k.upper()} — {name.upper()}", "title": hero_title,
                 "body": f"{summary[0].upper() + summary[1:]}, shipped factory-direct from Indonesia to {port} in {region['transit']}."},
        "intro": [intro_1, intro_2],
        "benefits": benefits,
        "logistics": {"origin": "Tanjung Priok, Jakarta, Indonesia", "destination": port,
                      "transit": region["transit"], "terms": "FOB · CFR · CIF",
                      "packing": "ISPM-15 crates, foam interleaving, container lashing"},
        "process": process,
        "faq": faq,
        "cta": {"title": f"Get a {k} Quote for {name}",
                "text": f"Send your drawings, sizes or quantities — our export team replies within 24 hours with a delivered quotation for {kl} to {name}."},
    }


def get_supplier_payload(kw, country_slug: str):
    c = _BY_SLUG.get(country_slug)
    if not c:
        return None
    related = [x for x in COUNTRIES_INDEX if x["region"] == c["region"] and x["slug"] != country_slug][:6]
    return {
        "keyword": {"name": kw["name"], "slug": kw["slug"], "summary": kw.get("summary", "")},
        "country": c,
        "content": build_supplier_content(kw, c),
        "related_countries": [{"name": r["name"], "slug": r["slug"]} for r in related],
    }
