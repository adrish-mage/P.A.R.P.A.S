from services.document_parsing import parse_document
def test_document_parsing():
    document = """
    Software Engineer with experience in Python, JavaScript and React.
    Built REST APIs using Node.js and Express.
    Worked with MongoDB and PostgreSQL.
    """
    result = parse_document(document)
    skills = result["extractedSkillNames"]
    assert "Python" in skills
    assert "JavaScript" in skills
    assert "React" in skills
    assert "Node.js" in skills
    assert "Express" in skills
    assert "MongoDB" in skills
    assert "PostgreSQL" in skills
def test_document_parsing_case_insensitive():
    document = """
    PYTHON
    javascript
    REACT
    mongodb
    """
    result = parse_document(document)
    skills = result["extractedSkillNames"]
    assert "Python" in skills
    assert "JavaScript" in skills
    assert "React" in skills
    assert "MongoDB" in skills
def test_document_parsing_no_skills():
    document = """
    I enjoy working with people and solving interesting problems.
    """
    result = parse_document(document)
    assert result["extractedSkillNames"] == []