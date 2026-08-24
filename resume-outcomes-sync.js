(function () {
  const outcomes = [
    {
      title: "我的主场系列",
      zh: "主导得物「我的主场」系列社区品牌活动视觉落地，围绕活动 IP、线上会场、线下小镇物料、传播素材等触点推进视觉统一，支持项目实现品牌曝光 15 亿+、拉新 150 万人。",
      en: "Led the My Home Field community campaign system across online and offline touchpoints, generating 1.5B+ impressions and 1.5M new users."
    },
    {
      title: "我的主场 2026 · AI 创意",
      zh: "将 AI 引入社区活动创意发散、视觉元素生成、IP 3D 化与视频片段生成；审核 100+ 线下小镇物料，延展 30+ 线上点位，保障线上创意体验与线下活动体验一致。",
      en: "Applied AI to ideation, visual generation, IP 3D development and motion assets; reviewed 100+ offline materials and extended 30+ online placements."
    },
    {
      title: "品牌视觉识别规范 3.0 / 极光篮行动",
      zh: "负责得物品牌视觉识别规范 3.0 建设，梳理品牌色、字体、包材防伪物料、应用场景及供应商执行规范；并主导「极光蓝公益行动」作为品牌色大规模应用案例，官方社媒 + KOL 传播累计曝光约 175 万。",
      en: "Built Brand Guidelines 3.0 across color, type, packaging and supplier execution; Aurora Blue reached about 1.75M impressions across official and KOL channels."
    },
    {
      title: "品牌重点物料升级",
      zh: "覆盖物流箱、防伪扣、防伪标、面单、鉴别证书等包材与防伪触点；通过观察打包流程并优化尺码标位置，帮助打包效率提升 15%。",
      en: "Upgraded logistics and anti-counterfeit touchpoints, including boxes, tags, labels and certificates; improved packing efficiency by 15%."
    },
    {
      title: "送礼心智与礼盒体系",
      zh: "覆盖全年 12 个重要节庆日，并延展至商城购买、额外加购等搜索与交易场景；以圣诞节点为例，相关礼盒/礼袋累计约 7.5k 单、GMV 约 33.3 万，新圣诞礼盒 + 礼袋售罄率达 45%。",
      en: "Built gifting touchpoints across 12 annual festivals and commerce scenarios; Christmas gift boxes and bags reached about 7.5K orders, RMB 333K GMV and a 45% sell-through rate."
    },
    {
      title: "包材相关升级",
      zh: "通过观察打包流程，了解不同业务的使用方式和物流，优化备品包装材料，相关舆情下降 3%。",
      en: "Improved backup packaging materials through workflow, usage and logistics research, contributing to a 3% reduction in related negative feedback."
    },
    {
      title: "AI 设计流程",
      zh: "将 AI 引入品牌规范问答、物料审核、会议纪要和进度追踪流程；每月节省约 300 个规范答复问题，支持约 75 场会议记录与追踪。",
      en: "Integrated AI into brand Q&A, material review, meeting notes and progress tracking, saving about 300 guideline responses per month and supporting around 75 meetings."
    },
    {
      title: "得物字体 / AI 造字",
      zh: "在 2000+ 已造字基础上梳理字体规律，推动品牌字体资产扩展与工具化。",
      en: "Systematized rules across 2,000+ generated glyphs to scale and operationalize the POIZON type asset."
    }
  ];

  const compact = (value) => (value || "").replace(/\s+/g, "").toLowerCase();

  function findLeaf(text) {
    const needle = compact(text);
    return Array.from(document.querySelectorAll("body *")).find((element) => {
      return element.children.length === 0 && compact(element.textContent) === needle;
    });
  }

  function findOutcomeItem(title, nextTitle) {
    const leaf = findLeaf(title);
    if (!leaf) return null;

    let node = leaf;
    while (node.parentElement && node.parentElement !== document.body) {
      const parent = node.parentElement;
      if (nextTitle && compact(parent.textContent).includes(compact(nextTitle))) break;
      node = parent;
    }
    return node;
  }

  function textNodes(element) {
    const nodes = [];
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    let current;
    while ((current = walker.nextNode())) {
      if (current.nodeValue.trim()) nodes.push(current);
    }
    return nodes;
  }

  function removeIds(element) {
    if (element.removeAttribute) element.removeAttribute("id");
    element.querySelectorAll("[id]").forEach((node) => node.removeAttribute("id"));
  }

  function setItemContent(item, outcome) {
    const nodes = textNodes(item);
    if (nodes.length >= 3) {
      nodes[0].nodeValue = outcome.title;
      nodes[1].nodeValue = outcome.zh;
      nodes[2].nodeValue = outcome.en;
      for (let index = 3; index < nodes.length; index += 1) {
        nodes[index].nodeValue = "";
      }
      return;
    }

    item.replaceChildren();
    const title = document.createElement("div");
    const zh = document.createElement("div");
    const en = document.createElement("div");
    title.textContent = outcome.title;
    zh.textContent = outcome.zh;
    en.textContent = outcome.en;
    en.style.color = "#b5b5b5";
    item.append(title, zh, en);
  }

  function syncOutcomes() {
    const currentTitles = ["我的主场", "极光蓝公益行动", "品牌重点物料升级", "送礼心智"];
    const currentItems = currentTitles.map((title, index) => {
      return findOutcomeItem(title, currentTitles[index + 1]);
    }).filter(Boolean);

    if (!currentItems.length) return;

    const list = currentItems[0].parentElement;
    if (!list || currentItems.some((item) => item.parentElement !== list)) return;

    const template = currentItems[0].cloneNode(true);
    removeIds(template);
    currentItems.forEach((item) => item.remove());

    outcomes.forEach((outcome) => {
      const item = template.cloneNode(true);
      removeIds(item);
      setItemContent(item, outcome);
      list.appendChild(item);
    });

    list.dataset.resumeOutcomesSynced = "true";
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", syncOutcomes, { once: true });
  } else {
    syncOutcomes();
  }
})();
