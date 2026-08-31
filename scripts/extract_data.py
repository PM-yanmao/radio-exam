#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""从《业余无线电台操作技术能力验证题库》PDF 提取题目与附图，生成静态数据。

用法：
    python scripts/extract_data.py

产物：
    src/data/questions.json   题库 JSON（A/B/C/全部）
    public/figures/<TAG>.jpg  题目附图（按 [J] 标签命名）
"""
from __future__ import annotations

import json
import re
import zipfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from pypdf import PdfReader
from pypdf.generic import ArrayObject

ROOT = Path(__file__).resolve().parents[1]
ZIP_PATH = ROOT.parent / "无线电.zip"
OUT_JSON = ROOT / "src" / "data" / "questions.json"
OUT_FIG = ROOT / "public" / "figures"

FIELD_TAGS = ("[P]", "[I]", "[Q]", "[T]", "[A]", "[B]", "[C]", "[D]", "[F]")
CONTENT_FIELDS = {"P", "I", "Q", "T", "A", "B", "C", "D", "F"}

# 附图标记 PDF 中 OCR 文本的一处缺字修正（LK060 -> LK0603）
LABEL_FIX = {"LK060": "LK0603"}

CHAPTERS = {
    "1": "无线电管理相关法规",
    "2": "无线电通信程序、方法",
    "3": "无线电系统原理",
    "4": "与业余无线电台有关的安全防护技术",
    "5": "电磁兼容技术以及射频干扰的预防和消除",
}


def decode_zip_name(filename: str) -> str:
    raw = filename.encode("cp437")
    for enc in ("utf-8", "gbk"):
        try:
            return raw.decode(enc)
        except UnicodeDecodeError:
            continue
    return raw.decode("utf-8", "replace")


def get_zip_info(name: str) -> zipfile.ZipInfo:
    with zipfile.ZipFile(ZIP_PATH) as z:
        for info in z.infolist():
            if info.filename.startswith("__MACOSX"):
                continue
            if decode_zip_name(info.filename) == name:
                return info
    raise KeyError(f"zip 中未找到 {name}")


def read_pdf(name: str) -> PdfReader:
    info = get_zip_info(name)
    with zipfile.ZipFile(ZIP_PATH) as z:
        return PdfReader(z.open(info))


def extract_pdf_text(name: str) -> str:
    reader = read_pdf(name)
    pages = [(p.extract_text() or "") for p in reader.pages]
    return "\n".join(pages)


def finalize_question(cur: dict[str, str] | None) -> dict[str, Any] | None:
    if not cur:
        return None
    qid = (cur.get("I") or "").strip()
    if not qid or "Q" not in cur:
        return None
    if "," in qid:  # 个别题目有两个题号，取第一个作为主 id
        qid = qid.split(",")[0].strip()
    t = re.sub(r"\s+", "", cur.get("T", ""))
    answer = [ord(c) - ord("A") for c in t if "A" <= c <= "D"]
    m = re.match(r"MC(\d)", qid)
    correct_count = int(m.group(1)) if m else len(answer)
    options = [
        re.sub(r"\s+", " ", (cur.get(k, "") or "").strip()) for k in ("A", "B", "C", "D")
    ]
    return {
        "id": qid,
        "tag": (cur.get("tag") or "").strip(),
        "category": (cur.get("P") or "").strip(),
        "type": "single" if correct_count == 1 else "multi",
        "correctCount": correct_count,
        "question": re.sub(r"\s+", " ", (cur.get("Q") or "").strip()),
        "options": options,
        "answer": answer,
        "figureRaw": (cur.get("F") or "").strip(),
    }


def parse_questions(text: str) -> list[dict[str, Any]]:
    questions: list[dict[str, Any]] = []
    cur: dict[str, str] | None = None
    field: str | None = None

    for raw in text.split("\n"):
        line = raw.strip()
        if not line:
            continue
        jm = re.match(r"\[J\]\s*(.*)", line)
        if jm:
            prev = finalize_question(cur)
            if prev:
                questions.append(prev)
            cur = {"tag": jm.group(1).strip()}
            field = "tag"
            continue
        matched = False
        for tag in FIELD_TAGS:
            if line.startswith(tag):
                key = tag[1]
                cur[key] = line[len(tag):].strip()
                field = key
                matched = True
                break
        if matched:
            continue
        if cur is not None and field in CONTENT_FIELDS:
            cur[field] += line

    prev = finalize_question(cur)
    if prev:
        questions.append(prev)
    return questions


def get_content_bytes(page: Any) -> bytes:
    obj = page["/Contents"].get_object()
    if isinstance(obj, ArrayObject):
        return b"\n".join(x.get_data() for x in obj)
    return obj.get_data()


def extract_figure_map() -> dict[str, str]:
    """返回 {题目标签: 图片文件名}，图片同时写入 public/figures/。"""
    reader = read_pdf("总题库附图标记.pdf")
    OUT_FIG.mkdir(parents=True, exist_ok=True)
    mapping: dict[str, str] = {}

    for page in reader.pages:
        data = get_content_bytes(page)
        placements: list[tuple[float, float, str]] = []
        for m in re.finditer(
            rb"((?:[-+]?\d*\.?\d+\s+){6})cm\s*/(IM\d+)\s+Do", data
        ):
            nums = [float(x) for x in m.group(1).split()]
            x, y = nums[4], nums[5]
            name = m.group(2).decode()
            placements.append((x, y, name))
        if not placements:
            continue
        # 去重（同一图片只保留一次），按阅读顺序：从上到下、从左到右
        seen: set[str] = set()
        unique = []
        for x, y, name in placements:
            if name in seen:
                continue
            seen.add(name)
            unique.append((x, y, name))
        unique.sort(key=lambda t: (-t[1], t[0]))

        text = page.extract_text() or ""
        labels = re.findall(r"LK\d{3,4}", text)
        labels = [LABEL_FIX.get(l, l) for l in labels]

        if len(labels) != len(unique):
            raise RuntimeError(
                f"附图标记页标签数({len(labels)})与图片数({len(unique)})不一致"
            )

        images = {im.name.split(".")[0]: im.image for im in page.images}
        for label, (_, _, name) in zip(labels, unique):
            if label in mapping:
                raise RuntimeError(f"附图标签重复：{label}")
            img = images.get(name)
            if img is None:
                raise RuntimeError(f"找不到图片 {name}")
            out = OUT_FIG / f"{label}.jpg"
            if hasattr(img, "save"):
                img.save(out, format="JPEG")
            else:
                out.write_bytes(img)
            mapping[label] = f"figures/{label}.jpg"

    return mapping


def add_figures(questions: list[dict[str, Any]], mapping: dict[str, str]) -> None:
    for q in questions:
        raw = (q.pop("figureRaw", "") or "").strip()
        if raw:
            # [F] 标签形如 LK0506.jpg，统一转成 figures/ 路径
            q["figure"] = f"figures/{raw}" if not raw.startswith("figures/") else raw
        else:
            q["figure"] = mapping.get(q["tag"], None)


def main() -> None:
    figure_map = extract_figure_map()
    print(f"附图提取完成：{len(figure_map)} 张 -> {OUT_FIG}")

    classes: dict[str, Any] = {}
    for key, pdf_name, label in (
        ("A", "A类题库.pdf", "A类"),
        ("B", "B类题库.pdf", "B类"),
        ("C", "C类题库.pdf", "C类"),
        ("all", "总题库.pdf", "全部题库"),
    ):
        text = extract_pdf_text(pdf_name)
        questions = parse_questions(text)
        add_figures(questions, figure_map)
        classes[key] = {"name": label, "questions": questions}
        n_single = sum(1 for q in questions if q["type"] == "single")
        n_multi = len(questions) - n_single
        n_fig = sum(1 for q in questions if q["figure"])
        print(
            f"{pdf_name}: {len(questions)} 题（单选 {n_single} / 多选 {n_multi}，附图 {n_fig}）"
        )

    expected = {"A": 683, "B": 1143, "C": 1282, "all": 1375}
    for key, count in expected.items():
        actual = len(classes[key]["questions"])
        if actual != count:
            raise RuntimeError(f"{key} 类题数不符：期望 {count}，实际 {actual}")

    payload = {
        "generatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "chapters": CHAPTERS,
        "classes": classes,
    }
    OUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    OUT_JSON.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")
    print(f"题库已写入：{OUT_JSON}")


if __name__ == "__main__":
    main()
