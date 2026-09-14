import re
SKILL_PATTERNS = {
    "Python": r"\bpython\b",
    "JavaScript": r"\bjavascript\b|\bjs\b",
    "TypeScript": r"\btypescript\b|\bts\b",
    "React": r"\breact(?:\.js)?\b",
    "Node.js": r"\bnode(?:\.js)?\b|\bnodejs\b",
    "Express": r"\bexpress(?:\.js)?\b",
    "MongoDB": r"\bmongodb\b|\bmongo\b",
    "SQL": r"\bsql\b",
    "PostgreSQL": r"\bpostgres(?:ql)?\b",
    "MySQL": r"\bmysql\b",
    "Docker": r"\bdocker\b",
    "Kubernetes": r"\bkubernetes\b|\bk8s\b",
    "Git": r"\bgit\b",
    "C": r"(?<![A-Za-z])c(?![A-Za-z])",
    "C++": r"\bc\+\+\b",
    "Java": r"\bjava\b",
    "FastAPI": r"\bfastapi\b",
}
def extract_skill_names(document_text: str) -> list[str]:
    found = []
    for skill_name, pattern in SKILL_PATTERNS.items():
        if re.search(pattern, document_text, flags=re.IGNORECASE):
            found.append(skill_name)
    return found
def parse_document(document_text: str):
    skills = extract_skill_names(document_text)
    return {
        "extractedSkillNames": skills,
    }