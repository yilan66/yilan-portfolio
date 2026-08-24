(() => {
  const outcomes = [
    {
      title: "我的主场系列",
      zh: "围绕活动 IP、线上会场、线下小镇物料与传播素材推进视觉统一，支持系列项目实现品牌曝光 15 亿+、拉新 150 万人。",
      en: "1.5B+ brand exposure and 1.5M new users across the My Home Field campaign series."
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

  const oldTitles = ["我的主场", "极光蓝公益行动", "品牌重点物料升级", "送礼心智"];

  const leafElements = (root) => {
    const nodes = [];
    if (root instanceof Element && root.children.length === 0 && root.textContent.trim()) nodes.push(root);
    root.querySelectorAll("*").forEach((node) => {
      if (node.children.length === 0 && node.textContent.trim()) nodes.push(node);
    });
    return nodes;
  };

  const findTitleLeaf = (root, title) =>
    leafElements(root).find((node) => node.textContent.trim() === title);

  const containsAllTitles = (root) => oldTitles.every((title) => Boolean(findTitleLeaf(root, title)));

  const directChildFor = (wrapper, node) => {
    let current = node;
    while (current && current.parentElement !== wrapper) current = current.parentElement;
    return current;
  };

  const update = () => {
    if (document.body.dataset.resumeOutcomesVersion === "4") return true;

    const firstTitle = findTitleLeaf(document.body, oldTitles[0]);
    if (!firstTitle) return false;

    let wrapper = firstTitle.parentElement;
    while (wrapper && wrapper !== document.body && !containsAllTitles(wrapper)) wrapper = wrapper.parentElement;
    if (!wrapper || wrapper === document.body) return false;

    const oldItems = oldTitles
      .map((title) => directChildFor(wrapper, findTitleLeaf(wrapper, title)))
      .filter(Boolean);
    const uniqueItems = [...new Set(oldItems)];
    if (uniqueItems.length < 4) return false;

    const template = uniqueItems[0];
    const templateLeaves = leafElements(template);
    const titleIndex = templateLeaves.findIndex((node) => node.textContent.trim() === oldTitles[0]);
    const zhIndex = templateLeaves.findIndex((node, index) => index > titleIndex && /[\u3400-\u9fff]/.test(node.textContent));
    const enIndex = templateLeaves.findIndex((node, index) => index > zhIndex && /[A-Za-z]/.test(node.textContent));
    if (titleIndex < 0 || zhIndex < 0 || enIndex < 0) return false;

    const fragment = document.createDocumentFragment();
    outcomes.forEach((outcome) => {
      const item = template.cloneNode(true);
      const leaves = leafElements(item);
      leaves[titleIndex].textContent = outcome.title;
      leaves[zhIndex].textContent = outcome.zh;
      leaves[enIndex].textContent = outcome.en;
      fragment.appendChild(item);
    });

    uniqueItems.forEach((item) => item.remove());
    wrapper.appendChild(fragment);
    document.body.dataset.resumeOutcomesVersion = "4";
    return true;
  };

  const run = () => {
    if (update()) return;
    const observer = new MutationObserver(() => {
      if (update()) observer.disconnect();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
    window.setTimeout(() => observer.disconnect(), 5000);
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run, { once: true });
  } else {
    run();
  }
  [100, 400, 1000, 2000].forEach((delay) => window.setTimeout(update, delay));
})();
