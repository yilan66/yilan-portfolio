(() => {
  const outcomes = [
    {
      title: "我的主场系列",
      zh: "围绕活动 IP、线上会场、线下小镇物料与传播素材推进视觉统一，支持系列项目实现品牌曝光 15 亿+、拉新 150 万人。",
      en: "1.5B+ brand exposure and 1.5M new users across the My Home Field campaign series."
    },
    {
      title: "我的主场 2026 · AI 创意落地",
      zh: "将 AI 引入创意发散、视觉元素生成、IP 3D 化与视频片段生成，审核 100+ 线下小镇物料，延展 30+ 线上点位。",
      en: "AI-assisted ideation, 3D IP and motion generation; reviewed 100+ offline assets and extended 30+ online placements."
    },
    {
      title: "品牌视觉识别规范 3.0 / 极光篮行动",
      zh: "梳理品牌色、字体、包材防伪物料、应用场景及供应商规范，并推动极光蓝延展至公益传播、物料系统与线下场景，官方社媒 + KOL 累计曝光约 175 万。",
      en: "Built Brand Guidelines 3.0 and scaled Aurora Blue across public-welfare communications, materials and offline touchpoints, reaching about 1.75M impressions."
    },
    {
      title: "品牌重点物料升级",
      zh: "覆盖物流箱、防伪扣、防伪标、面单与鉴别证书等触点，通过优化打包流程与尺码标位置，帮助打包效率提升 15%。",
      en: "Upgraded logistics and anti-counterfeit touchpoints and improved packing efficiency by 15%."
    },
    {
      title: "送礼心智与礼盒体系",
      zh: "覆盖全年 12 个重要节庆日，并延展至商城购买与额外加购场景；圣诞礼盒/礼袋累计约 7.5k 单，GMV 约 33.3 万，新圣诞礼盒 + 礼袋售罄率达 45%。",
      en: "Covered 12 annual festivals; Christmas gift boxes and bags reached about 7.5K orders, RMB 333K GMV and a 45% sell-through rate."
    },
    {
      title: "包材流程优化",
      zh: "通过观察打包流程、梳理不同业务的使用与物流方式并优化备品包装材料，推动相关舆情下降 3%。",
      en: "Improved backup packaging materials and reduced related negative public-opinion incidents by 3%."
    },
    {
      title: "AI 设计流程建设",
      zh: "将 AI 引入品牌规范问答、物料审核、会议纪要和进度追踪，每月节省约 300 个规范答复问题，支持约 75 场会议记录与追踪。",
      en: "AI-supported brand Q&A, material review, meeting notes and tracking, saving about 300 responses per month and supporting about 75 meetings."
    },
    {
      title: "得物字体与 AI 造字",
      zh: "在 2000+ 已造字基础上梳理字体规律，推动品牌字体资产扩展与工具化。",
      en: "Systematized type rules from 2,000+ generated characters to expand and operationalize the POIZON type asset."
    }
  ];

  const oldTitles = ["我的主场", "我的主场系列", "极光蓝公益行动", "品牌重点物料升级", "送礼心智", "送礼心智与礼盒体系"];

  function textLeaves(root) {
    return Array.from(root.querySelectorAll("*"))
      .filter((node) => node.children.length === 0)
      .filter((node) => node.textContent.trim())
      .filter((node) => !/^[↳↴↵↥⌄↓↑]+$/.test(node.textContent.trim()));
  }

  function findColumn() {
    const heading = Array.from(document.querySelectorAll("body *")).find(
      (node) => node.children.length === 0 && node.textContent.trim() === "项目结果"
    );
    if (!heading) return null;

    let node = heading.parentElement;
    while (node && node !== document.body) {
      const count = oldTitles.filter((title) => node.textContent.includes(title)).length;
      if (count >= 2) return node;
      node = node.parentElement;
    }
    return null;
  }

  function directItem(column, leaf) {
    let node = leaf;
    while (node && node.parentElement !== column) node = node.parentElement;
    return node && node.parentElement === column ? node : null;
  }

  function syncOutcomes() {
    const column = findColumn();
    if (!column || column.dataset.resumeOutcomesSynced === "v2") return;

    const titleLeaves = Array.from(column.querySelectorAll("*"))
      .filter((node) => node.children.length === 0)
      .filter((node) => oldTitles.includes(node.textContent.trim()));
    const items = [...new Set(titleLeaves.map((leaf) => directItem(column, leaf)).filter(Boolean))];
    if (!items.length) return;

    const template = items[0].cloneNode(true);
    items.forEach((item) => item.remove());

    outcomes.forEach((outcome) => {
      const item = template.cloneNode(true);
      const leaves = textLeaves(item);
      if (leaves[0]) leaves[0].textContent = outcome.title;
      if (leaves[1]) leaves[1].textContent = outcome.zh;
      if (leaves[2]) leaves[2].textContent = outcome.en;
      column.appendChild(item);
    });

    column.dataset.resumeOutcomesSynced = "v2";
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => requestAnimationFrame(syncOutcomes));
  } else {
    requestAnimationFrame(syncOutcomes);
  }
})();
