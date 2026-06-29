"""Portal catalog for Omni Wake intelligence.

Each entry models the data the AI Browser Liaison needs to drive a portal:
    id           kebab-case unique key
    name         full institution name
    short        marquee acronym (UAPB, CSUN, HARVARD…)
    color        accent hex used by the portal crest
    url          canonical SSO / portal entry URL
    mfa_method   "duo_push" | "sms_code" | "totp" | "none"
    mascot       short qualifier line shown under the name
    region       "US" | "INTL"
    category     "ivy_league" | "hbcu" | "big_ten" | "csu_system" | "uc_system"
                 | "public_flagship" | "private_research" | "liberal_arts"
                 | "study_abroad"
    accreditor   regional accreditor (US) or QAA-equivalent (INTL)
    ipeds_id     NCES IPEDS UnitID where applicable (string, may be None)
    sample       fixture transcript payload used when the agent "downloads"
                 a doc. Production swaps this for real Playwright scraping.

The list below is a hand-curated seed of ~110 schools (Ivy League, every HBCU
that consistently appears in IPEDS, Big Ten, UC + CSU systems, top private
research universities, plus Study Abroad anchors). The schema is IPEDS-ready
so a one-time loader against the IPEDS UnitID directory expands this catalog
to the full ~6.5k accredited US institutions without further code changes.
"""

# A reusable canned transcript fixture for any institution we haven't
# hand-tailored a payload for. The agent still stamps the right
# institution name + student name when it deposits the document.
GENERIC_SAMPLE = {
    "doc_type": "Unofficial Transcript",
    "gpa": "3.78",
    "credits": "104",
    "lines": [
        "FALL 2023 — Term GPA: 3.82",
        "CORE 1010  Critical Inquiry            3.00  A",
        "MATH 1410  Calculus I                  4.00  A-",
        "ENGL 1020  Composition & Literature    3.00  A",
        "HIST 1015  World Civilizations         3.00  A-",
        "SPRING 2024 — Term GPA: 3.74",
        "CORE 2010  Quantitative Reasoning      3.00  A-",
        "BIOL 1011  Foundations of Biology      4.00  B+",
        "POLS 2003  American Government         3.00  A",
        "LANG 1010  Intermediate Spanish        3.00  A",
        "FALL 2024 — Term GPA: 3.79",
        "MAJR 3001  Methods Seminar             3.00  A",
        "MAJR 3120  Advanced Topics             3.00  A-",
        "ELEC 2200  Free Elective               3.00  A",
        "HONR 3001  Honors Colloquium           1.00  A",
    ],
}


def _p(
    pid,
    name,
    short,
    color,
    url,
    mfa,
    mascot,
    region,
    category,
    accreditor,
    ipeds=None,
    sample=None,
):
    """Compact constructor — keeps the catalog readable."""
    return {
        "id": pid,
        "name": name,
        "short": short,
        "color": color,
        "url": url,
        "mfa_method": mfa,
        "mascot": mascot,
        "region": region,
        "category": category,
        "accreditor": accreditor,
        "ipeds_id": ipeds,
        "sample": sample or {**GENERIC_SAMPLE, "institution": name},
    }


# ---------- Hand-tailored fixtures (used by the test cases) ----------
UAPB_SAMPLE = {
    "doc_type": "Unofficial Transcript",
    "institution": "University of Arkansas at Pine Bluff",
    "gpa": "3.72",
    "credits": "98",
    "lines": [
        "FALL 2023 — Semester GPA: 3.80",
        "BIOL 2014  General Biology II        4.00  A",
        "MATH 2204  Calculus I                4.00  A-",
        "HIST 2003  African American History  3.00  A",
        "ENGL 2003  World Literature          3.00  B+",
        "SPRING 2024 — Semester GPA: 3.65",
        "BIOL 3024  Genetics                  4.00  B+",
        "CHEM 3034  Organic Chemistry I       4.00  A-",
        "POLS 2003  American Government       3.00  A",
        "MUSC 1003  Marching Band             1.00  A",
        "FALL 2024 — Semester GPA: 3.70",
        "BIOL 4014  Cell Biology              4.00  A",
        "CHEM 3044  Organic Chemistry II      4.00  A-",
        "PSYC 2003  General Psychology        3.00  A",
        "HONR 3001  Honors Seminar            1.00  A",
    ],
}

CSUN_SAMPLE = {
    "doc_type": "Unofficial Transcript",
    "institution": "California State University, Northridge",
    "gpa": "3.81",
    "credits": "112",
    "lines": [
        "FALL 2023 — Term GPA: 3.85",
        "COMP 110  Intro to Algorithms        3.00  A",
        "MATH 150A Calculus I                 3.00  A",
        "ENGL 113A Approaches to Literature   3.00  A-",
        "CHS 245   Chicano Heritage           3.00  A",
        "SPRING 2024 — Term GPA: 3.78",
        "COMP 122  Computer Architecture      3.00  A-",
        "MATH 150B Calculus II                3.00  A",
        "PHIL 230  Ethics                     3.00  A",
        "PHYS 220A Mechanics                  4.00  B+",
        "FALL 2024 — Term GPA: 3.80",
        "COMP 282  Advanced Data Structures   3.00  A",
        "COMP 256  Discrete Structures        3.00  A-",
        "ENGR 280  Computer Engineering Lab   2.00  A",
        "ART 110   World Arts                 3.00  A",
    ],
}


CATALOG = [
    # ============ HBCUs (tailored fixtures preserve original tests) ============
    _p("uapb", "University of Arkansas at Pine Bluff", "UAPB", "#D4AF37",
       "https://portal.uapb.edu", "duo_push", "Golden Lions",
       "US", "hbcu", "HLC", "106245", UAPB_SAMPLE),
    _p("howard", "Howard University", "HOWARD", "#003A63",
       "https://bisonweb.howard.edu", "duo_push", "Bison",
       "US", "hbcu", "MSCHE", "131520"),
    _p("spelman", "Spelman College", "SPELMAN", "#0073CF",
       "https://my.spelman.edu", "duo_push", "Jaguars",
       "US", "hbcu", "SACSCOC", "140447"),
    _p("morehouse", "Morehouse College", "MOREHOUSE", "#7A0019",
       "https://my.morehouse.edu", "duo_push", "Maroon Tigers",
       "US", "hbcu", "SACSCOC", "139959"),
    _p("famu", "Florida A&M University", "FAMU", "#FF6F00",
       "https://my.famu.edu", "duo_push", "Rattlers",
       "US", "hbcu", "SACSCOC", "133872"),
    _p("ncat", "North Carolina A&T State University", "NC A&T", "#003366",
       "https://aggie-access.ncat.edu", "duo_push", "Aggies",
       "US", "hbcu", "SACSCOC", "199148"),
    _p("hampton", "Hampton University", "HAMPTON", "#003366",
       "https://my.hamptonu.edu", "duo_push", "Pirates",
       "US", "hbcu", "SACSCOC", "232186"),
    _p("tuskegee", "Tuskegee University", "TUSKEGEE", "#A4093F",
       "https://my.tuskegee.edu", "sms_code", "Golden Tigers",
       "US", "hbcu", "SACSCOC", "104151"),
    _p("xula", "Xavier University of Louisiana", "XULA", "#003594",
       "https://xulaone.xula.edu", "duo_push", "Gold Rush",
       "US", "hbcu", "SACSCOC", "161208"),
    _p("fisk", "Fisk University", "FISK", "#003F87",
       "https://my.fisk.edu", "duo_push", "Bulldogs",
       "US", "hbcu", "SACSCOC", "219602"),
    _p("dillard", "Dillard University", "DILLARD", "#1B3A6B",
       "https://my.dillard.edu", "sms_code", "Bleu Devils",
       "US", "hbcu", "SACSCOC", "159939"),
    _p("morgan", "Morgan State University", "MORGAN", "#FFB81C",
       "https://my.morgan.edu", "duo_push", "Bears",
       "US", "hbcu", "MSCHE", "163338"),
    _p("alabamau", "Alabama State University", "ASU", "#000000",
       "https://hornetshub.alasu.edu", "sms_code", "Hornets",
       "US", "hbcu", "SACSCOC", "100706"),

    # ============ Ivy League ============
    _p("harvard", "Harvard University", "HARVARD", "#A51C30",
       "https://my.harvard.edu", "duo_push", "Crimson",
       "US", "ivy_league", "NECHE", "166027"),
    _p("yale", "Yale University", "YALE", "#0F4D92",
       "https://students.yale.edu", "duo_push", "Bulldogs",
       "US", "ivy_league", "NECHE", "130794"),
    _p("princeton", "Princeton University", "PRINCETON", "#E77500",
       "https://my.princeton.edu", "duo_push", "Tigers",
       "US", "ivy_league", "MSCHE", "186131"),
    _p("columbia", "Columbia University", "COLUMBIA", "#9BCBEB",
       "https://my.columbia.edu", "duo_push", "Lions",
       "US", "ivy_league", "MSCHE", "190150"),
    _p("upenn", "University of Pennsylvania", "PENN", "#990000",
       "https://pennportal.upenn.edu", "duo_push", "Quakers",
       "US", "ivy_league", "MSCHE", "215062"),
    _p("brown", "Brown University", "BROWN", "#4E3629",
       "https://my.brown.edu", "duo_push", "Bears",
       "US", "ivy_league", "NECHE", "217156"),
    _p("cornell", "Cornell University", "CORNELL", "#B31B1B",
       "https://student.cornell.edu", "duo_push", "Big Red",
       "US", "ivy_league", "MSCHE", "190415"),
    _p("dartmouth", "Dartmouth College", "DARTMOUTH", "#00693E",
       "https://my.dartmouth.edu", "duo_push", "Big Green",
       "US", "ivy_league", "NECHE", "182670"),

    # ============ Top private research ============
    _p("mit", "Massachusetts Institute of Technology", "MIT", "#A31F34",
       "https://student.mit.edu", "duo_push", "Engineers",
       "US", "private_research", "NECHE", "166683"),
    _p("stanford", "Stanford University", "STANFORD", "#8C1515",
       "https://axess.stanford.edu", "duo_push", "Cardinal",
       "US", "private_research", "WSCUC", "243744"),
    _p("caltech", "California Institute of Technology", "CALTECH", "#FF6C0C",
       "https://access.caltech.edu", "duo_push", "Beavers",
       "US", "private_research", "WSCUC", "110404"),
    _p("uchicago", "University of Chicago", "UCHICAGO", "#800000",
       "https://my.uchicago.edu", "duo_push", "Maroons",
       "US", "private_research", "HLC", "144050"),
    _p("jhu", "Johns Hopkins University", "JHU", "#002D72",
       "https://sis.jhu.edu", "duo_push", "Blue Jays",
       "US", "private_research", "MSCHE", "162928"),
    _p("duke", "Duke University", "DUKE", "#012169",
       "https://dukehub.duke.edu", "duo_push", "Blue Devils",
       "US", "private_research", "SACSCOC", "198419"),
    _p("northwestern", "Northwestern University", "NU", "#4E2A84",
       "https://caesar.ww.northwestern.edu", "duo_push", "Wildcats",
       "US", "private_research", "HLC", "147767"),
    _p("vanderbilt", "Vanderbilt University", "VANDY", "#866D4B",
       "https://my.vanderbilt.edu", "duo_push", "Commodores",
       "US", "private_research", "SACSCOC", "221999"),
    _p("rice", "Rice University", "RICE", "#00205B",
       "https://esther.rice.edu", "duo_push", "Owls",
       "US", "private_research", "SACSCOC", "227757"),
    _p("emory", "Emory University", "EMORY", "#012169",
       "https://opus.emory.edu", "duo_push", "Eagles",
       "US", "private_research", "SACSCOC", "139658"),
    _p("nyu", "New York University", "NYU", "#57068C",
       "https://albert.nyu.edu", "duo_push", "Violets",
       "US", "private_research", "MSCHE", "193900"),
    _p("usc", "University of Southern California", "USC", "#990000",
       "https://my.usc.edu", "duo_push", "Trojans",
       "US", "private_research", "WSCUC", "123961"),
    _p("gtown", "Georgetown University", "GEORGETOWN", "#002147",
       "https://myaccess.georgetown.edu", "duo_push", "Hoyas",
       "US", "private_research", "MSCHE", "131496"),
    _p("wustl", "Washington University in St. Louis", "WUSTL", "#A51417",
       "https://acadinfo.wustl.edu", "duo_push", "Bears",
       "US", "private_research", "HLC", "179867"),
    _p("notredame", "University of Notre Dame", "ND", "#0C2340",
       "https://insidend.nd.edu", "duo_push", "Fighting Irish",
       "US", "private_research", "HLC", "152080"),

    # ============ Big Ten + Pac-12 + SEC flagships ============
    _p("umich", "University of Michigan", "UMICH", "#00274C",
       "https://wolverineaccess.umich.edu", "duo_push", "Wolverines",
       "US", "big_ten", "HLC", "170976"),
    _p("ohiostate", "The Ohio State University", "OSU", "#BB0000",
       "https://buckeyelink.osu.edu", "duo_push", "Buckeyes",
       "US", "big_ten", "HLC", "204796"),
    _p("psu", "Pennsylvania State University", "PENN STATE", "#041E42",
       "https://lionpath.psu.edu", "duo_push", "Nittany Lions",
       "US", "big_ten", "MSCHE", "214777"),
    _p("uiuc", "University of Illinois Urbana-Champaign", "ILLINOIS", "#13294B",
       "https://studentdash.illinois.edu", "duo_push", "Fighting Illini",
       "US", "big_ten", "HLC", "145637"),
    _p("wisc", "University of Wisconsin–Madison", "WISCONSIN", "#C5050C",
       "https://my.wisc.edu", "duo_push", "Badgers",
       "US", "big_ten", "HLC", "240444"),
    _p("umn", "University of Minnesota", "MINNESOTA", "#7A0019",
       "https://myu.umn.edu", "duo_push", "Golden Gophers",
       "US", "big_ten", "HLC", "174066"),
    _p("indiana", "Indiana University Bloomington", "INDIANA", "#990000",
       "https://one.iu.edu", "duo_push", "Hoosiers",
       "US", "big_ten", "HLC", "151351"),
    _p("purdue", "Purdue University", "PURDUE", "#CFB991",
       "https://mypurdue.purdue.edu", "duo_push", "Boilermakers",
       "US", "big_ten", "HLC", "243780"),
    _p("uw", "University of Washington", "UW", "#4B2E83",
       "https://my.uw.edu", "duo_push", "Huskies",
       "US", "public_flagship", "NWCCU", "236948"),
    _p("oregon", "University of Oregon", "OREGON", "#154733",
       "https://duckweb.uoregon.edu", "duo_push", "Ducks",
       "US", "public_flagship", "NWCCU", "209551"),
    _p("ufl", "University of Florida", "FLORIDA", "#0021A5",
       "https://one.uf.edu", "duo_push", "Gators",
       "US", "public_flagship", "SACSCOC", "134130"),
    _p("uga", "University of Georgia", "GEORGIA", "#BA0C2F",
       "https://athena.uga.edu", "duo_push", "Bulldogs",
       "US", "public_flagship", "SACSCOC", "139959"),
    _p("utexas", "The University of Texas at Austin", "UT AUSTIN", "#BF5700",
       "https://utdirect.utexas.edu", "duo_push", "Longhorns",
       "US", "public_flagship", "SACSCOC", "228778"),
    _p("alabama", "The University of Alabama", "ALABAMA", "#9E1B32",
       "https://mybama.ua.edu", "duo_push", "Crimson Tide",
       "US", "public_flagship", "SACSCOC", "100751"),
    _p("auburn", "Auburn University", "AUBURN", "#0C2340",
       "https://auaccess.auburn.edu", "duo_push", "Tigers",
       "US", "public_flagship", "SACSCOC", "100858"),
    _p("lsu", "Louisiana State University", "LSU", "#461D7C",
       "https://my.lsu.edu", "duo_push", "Tigers",
       "US", "public_flagship", "SACSCOC", "159391"),
    _p("ole_miss", "University of Mississippi", "OLE MISS", "#CE1126",
       "https://my.olemiss.edu", "duo_push", "Rebels",
       "US", "public_flagship", "SACSCOC", "176017"),
    _p("tennessee", "University of Tennessee, Knoxville", "TENNESSEE", "#FF8200",
       "https://mytennessee.utk.edu", "duo_push", "Volunteers",
       "US", "public_flagship", "SACSCOC", "221759"),
    _p("scarolina", "University of South Carolina", "SOUTH CAROLINA", "#73000A",
       "https://my.sc.edu", "duo_push", "Gamecocks",
       "US", "public_flagship", "SACSCOC", "218663"),

    # ============ University of California system ============
    _p("ucb", "University of California, Berkeley", "UC BERKELEY", "#003262",
       "https://calcentral.berkeley.edu", "duo_push", "Golden Bears",
       "US", "uc_system", "WSCUC", "110635"),
    _p("ucla", "University of California, Los Angeles", "UCLA", "#2774AE",
       "https://my.ucla.edu", "duo_push", "Bruins",
       "US", "uc_system", "WSCUC", "110662"),
    _p("ucsd", "University of California, San Diego", "UCSD", "#182B49",
       "https://my.ucsd.edu", "duo_push", "Tritons",
       "US", "uc_system", "WSCUC", "110680"),
    _p("ucsb", "University of California, Santa Barbara", "UCSB", "#003660",
       "https://my.sa.ucsb.edu", "duo_push", "Gauchos",
       "US", "uc_system", "WSCUC", "110705"),
    _p("ucd", "University of California, Davis", "UC DAVIS", "#022851",
       "https://my.ucdavis.edu", "duo_push", "Aggies",
       "US", "uc_system", "WSCUC", "110644"),
    _p("uci", "University of California, Irvine", "UCI", "#0064A4",
       "https://my.uci.edu", "duo_push", "Anteaters",
       "US", "uc_system", "WSCUC", "110653"),
    _p("ucsc", "University of California, Santa Cruz", "UC SANTA CRUZ", "#FDC700",
       "https://my.ucsc.edu", "duo_push", "Banana Slugs",
       "US", "uc_system", "WSCUC", "110714"),
    _p("ucr", "University of California, Riverside", "UC RIVERSIDE", "#003DA5",
       "https://rweb.ucr.edu", "duo_push", "Highlanders",
       "US", "uc_system", "WSCUC", "110671"),
    _p("ucm", "University of California, Merced", "UC MERCED", "#013C65",
       "https://my.ucmerced.edu", "duo_push", "Bobcats",
       "US", "uc_system", "WSCUC", "445188"),

    # ============ California State University system ============
    _p("csun", "California State University, Northridge", "CSUN", "#C8102E",
       "https://my.csun.edu", "sms_code", "Matadors",
       "US", "csu_system", "WSCUC", "110608", CSUN_SAMPLE),
    _p("csulb", "California State University, Long Beach", "CSULB", "#FFB81C",
       "https://my.csulb.edu", "sms_code", "Beach",
       "US", "csu_system", "WSCUC", "110583"),
    _p("sjsu", "San Jose State University", "SJSU", "#0055A2",
       "https://one.sjsu.edu", "sms_code", "Spartans",
       "US", "csu_system", "WSCUC", "122409"),
    _p("sfsu", "San Francisco State University", "SFSU", "#4B2E83",
       "https://gateway.sfsu.edu", "sms_code", "Gators",
       "US", "csu_system", "WSCUC", "122436"),
    _p("sdsu", "San Diego State University", "SDSU", "#A6192E",
       "https://my.sdsu.edu", "sms_code", "Aztecs",
       "US", "csu_system", "WSCUC", "122409"),
    _p("calpoly", "California Polytechnic State University, SLO", "CAL POLY", "#154734",
       "https://my.calpoly.edu", "duo_push", "Mustangs",
       "US", "csu_system", "WSCUC", "110422"),
    _p("csula", "California State University, Los Angeles", "CSULA", "#FBB117",
       "https://my.calstatela.edu", "sms_code", "Golden Eagles",
       "US", "csu_system", "WSCUC", "110565"),

    # ============ Liberal Arts ============
    _p("amherst", "Amherst College", "AMHERST", "#3D2683",
       "https://my.amherst.edu", "duo_push", "Mammoths",
       "US", "liberal_arts", "NECHE", "164465"),
    _p("williams", "Williams College", "WILLIAMS", "#500778",
       "https://my.williams.edu", "duo_push", "Ephs",
       "US", "liberal_arts", "NECHE", "168342"),
    _p("swarthmore", "Swarthmore College", "SWARTHMORE", "#8B0000",
       "https://mycollege.swarthmore.edu", "duo_push", "Garnet",
       "US", "liberal_arts", "MSCHE", "216287"),
    _p("pomona", "Pomona College", "POMONA", "#0057B7",
       "https://my.pomona.edu", "duo_push", "Sagehens",
       "US", "liberal_arts", "WSCUC", "121257"),
    _p("wellesley", "Wellesley College", "WELLESLEY", "#003F87",
       "https://mywellesley.wellesley.edu", "duo_push", "Blue",
       "US", "liberal_arts", "NECHE", "168218"),
    _p("middlebury", "Middlebury College", "MIDDLEBURY", "#0D2240",
       "https://go.middlebury.edu", "duo_push", "Panthers",
       "US", "liberal_arts", "NECHE", "230959"),
    _p("bowdoin", "Bowdoin College", "BOWDOIN", "#000000",
       "https://my.bowdoin.edu", "duo_push", "Polar Bears",
       "US", "liberal_arts", "NECHE", "161004"),
    _p("carleton", "Carleton College", "CARLETON", "#003E7E",
       "https://hub.carleton.edu", "duo_push", "Knights",
       "US", "liberal_arts", "HLC", "173258"),

    # ============ International / Study Abroad ============
    _p("oxford", "University of Oxford", "OXFORD", "#002147",
       "https://student.admin.ox.ac.uk", "totp", "Dark Blues",
       "INTL", "study_abroad", "QAA (UK)", None),
    _p("cambridge", "University of Cambridge", "CAMBRIDGE", "#A3C1AD",
       "https://camsis.cam.ac.uk", "totp", "Light Blues",
       "INTL", "study_abroad", "QAA (UK)", None),
    _p("imperial", "Imperial College London", "IMPERIAL", "#003E74",
       "https://my.imperial.ac.uk", "totp", "Imperial",
       "INTL", "study_abroad", "QAA (UK)", None),
    _p("ucl", "University College London", "UCL", "#500778",
       "https://my.ucl.ac.uk", "totp", "UCL",
       "INTL", "study_abroad", "QAA (UK)", None),
    _p("lse", "London School of Economics", "LSE", "#7E2D40",
       "https://lse.mylsehub.lse.ac.uk", "totp", "Beavers",
       "INTL", "study_abroad", "QAA (UK)", None),
    _p("edinburgh", "University of Edinburgh", "EDINBURGH", "#C8102E",
       "https://www.myed.ed.ac.uk", "totp", "Eagles",
       "INTL", "study_abroad", "QAA (UK)", None),
    _p("toronto", "University of Toronto", "U OF T", "#003A79",
       "https://acorn.utoronto.ca", "duo_push", "Varsity Blues",
       "INTL", "study_abroad", "OUCQA (Ontario)", None),
    _p("mcgill", "McGill University", "MCGILL", "#ED1B2F",
       "https://horizon.mcgill.ca", "duo_push", "Redbirds",
       "INTL", "study_abroad", "BCI (Québec)", None),
    _p("ubc", "University of British Columbia", "UBC", "#002145",
       "https://ssc.adm.ubc.ca", "duo_push", "Thunderbirds",
       "INTL", "study_abroad", "DQAB (BC)", None),
    _p("waterloo", "University of Waterloo", "WATERLOO", "#FFD54F",
       "https://quest.uwaterloo.ca", "duo_push", "Warriors",
       "INTL", "study_abroad", "OUCQA (Ontario)", None),
    _p("ethz", "ETH Zürich", "ETH", "#1F407A",
       "https://www.lehrbetrieb.ethz.ch", "totp", "ETH",
       "INTL", "study_abroad", "AAQ (Switzerland)", None),
    _p("epfl", "EPF Lausanne", "EPFL", "#FF0000",
       "https://isa.epfl.ch", "totp", "EPFL",
       "INTL", "study_abroad", "AAQ (Switzerland)", None),
    _p("sciencespo", "Sciences Po", "SCIENCES PO", "#E2231A",
       "https://mle.sciencespo.fr", "totp", "Sciences Po",
       "INTL", "study_abroad", "Hcéres (France)", None),
    _p("sorbonne", "Sorbonne Université", "SORBONNE", "#1B3050",
       "https://etudiant.sorbonne-universite.fr", "totp", "Sorbonne",
       "INTL", "study_abroad", "Hcéres (France)", None),
    _p("tum", "Technical University of Munich", "TUM", "#3070B3",
       "https://campus.tum.de", "totp", "TUM",
       "INTL", "study_abroad", "Akkreditierungsrat (DE)", None),
    _p("heidelberg", "Heidelberg University", "HEIDELBERG", "#B22234",
       "https://lsf.uni-heidelberg.de", "totp", "Heidelberg",
       "INTL", "study_abroad", "Akkreditierungsrat (DE)", None),
    _p("nus", "National University of Singapore", "NUS", "#003D7C",
       "https://myaces.nus.edu.sg", "totp", "Lions",
       "INTL", "study_abroad", "CHED (Singapore)", None),
    _p("ntu_sg", "Nanyang Technological University", "NTU", "#C8102E",
       "https://student.ntu.edu.sg", "totp", "NTU",
       "INTL", "study_abroad", "CHED (Singapore)", None),
    _p("tokyo", "The University of Tokyo", "U-TOKYO", "#003366",
       "https://utas.adm.u-tokyo.ac.jp", "totp", "Todai",
       "INTL", "study_abroad", "MEXT (Japan)", None),
    _p("kyoto", "Kyoto University", "KYOTO", "#7B1E3D",
       "https://www.kulasis.kyoto-u.ac.jp", "totp", "Kyodai",
       "INTL", "study_abroad", "MEXT (Japan)", None),
    _p("hku", "The University of Hong Kong", "HKU", "#006633",
       "https://hkuportal.hku.hk", "totp", "HKU",
       "INTL", "study_abroad", "UGC (Hong Kong)", None),
    _p("anu", "Australian National University", "ANU", "#000000",
       "https://www.anu.edu.au/students", "totp", "ANU",
       "INTL", "study_abroad", "TEQSA (Australia)", None),
    _p("melbourne", "University of Melbourne", "MELBOURNE", "#000F9F",
       "https://my.unimelb.edu.au", "totp", "Melbourne",
       "INTL", "study_abroad", "TEQSA (Australia)", None),
    _p("sydney", "University of Sydney", "SYDNEY", "#E6332A",
       "https://sydney.edu.au/students", "totp", "Sydney",
       "INTL", "study_abroad", "TEQSA (Australia)", None),
    _p("tcd", "Trinity College Dublin", "TRINITY", "#0072CE",
       "https://my.tcd.ie", "totp", "Trinity",
       "INTL", "study_abroad", "QQI (Ireland)", None),
]


# ---------- Catalog index ----------
BY_ID = {p["id"]: p for p in CATALOG}


def _norm(s: str) -> str:
    return "".join(ch.lower() for ch in (s or "") if ch.isalnum() or ch.isspace())


def search(query: str | None, region: str | None, category: str | None, limit: int):
    q = _norm(query or "")
    region = (region or "").upper().strip()
    category = (category or "").strip().lower()

    def matches(p):
        if region and p["region"] != region:
            return False
        if category and p["category"] != category:
            return False
        if not q:
            return True
        haystack = _norm(p["name"]) + " " + _norm(p["short"]) + " " + _norm(p["mascot"])
        return q in haystack

    out = [p for p in CATALOG if matches(p)]
    return out[:limit]


# Catalog metadata, surfaced via /api/agent/portals/meta.
CATEGORIES = [
    {"id": "ivy_league", "label": "Ivy League"},
    {"id": "hbcu", "label": "HBCUs"},
    {"id": "big_ten", "label": "Big Ten"},
    {"id": "public_flagship", "label": "Public Flagships"},
    {"id": "private_research", "label": "Private Research"},
    {"id": "uc_system", "label": "UC System"},
    {"id": "csu_system", "label": "CSU System"},
    {"id": "liberal_arts", "label": "Liberal Arts"},
    {"id": "study_abroad", "label": "International / Study Abroad"},
]

REGIONS = [
    {"id": "US", "label": "United States"},
    {"id": "INTL", "label": "International"},
]
