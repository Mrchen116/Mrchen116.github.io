(() => {
  const article = document.querySelector(".art-body");
  const desktopToc = document.querySelector("[data-article-toc]");
  const inlineToc = document.querySelector("[data-article-toc-inline]");
  const modeControl = desktopToc?.querySelector("[data-toc-mode-control]");
  const modeButton = desktopToc?.querySelector("[data-toc-mode]");

  if (!article || !desktopToc || !inlineToc) return;

  const headings = [...article.querySelectorAll("h2, h3")];
  if (headings.length < 2) return;

  const usedIds = new Set(
    [...document.querySelectorAll("[id]")].map((element) => element.id),
  );

  headings.forEach((heading, index) => {
    if (heading.id) return;

    let candidate = `article-section-${index + 1}`;
    let suffix = 2;
    while (usedIds.has(candidate)) {
      candidate = `article-section-${index + 1}-${suffix}`;
      suffix += 1;
    }
    heading.id = candidate;
    usedIds.add(candidate);
  });

  const sections = [];
  let currentSection = null;

  headings.forEach((heading) => {
    if (heading.tagName === "H2") {
      currentSection = { heading, subsections: [] };
      sections.push(currentSection);
      return;
    }

    if (currentSection) {
      currentSection.subsections.push(heading);
    }
  });

  if (!sections.length) return;

  if (
    modeControl &&
    sections.some(({ subsections }) => subsections.length > 0)
  ) {
    modeControl.hidden = false;
  }

  const createLink = (heading, className) => {
    const link = document.createElement("a");
    link.className = `article-toc__link ${className}`;
    link.href = `#${heading.id}`;
    link.textContent = heading.textContent.trim();
    link.dataset.tocTarget = heading.id;
    return link;
  };

  const populate = (list) => {
    const fragment = document.createDocumentFragment();

    sections.forEach(({ heading, subsections }) => {
      const item = document.createElement("li");
      item.className = "article-toc__section";
      item.dataset.tocSection = heading.id;
      item.append(createLink(heading, "article-toc__link--section"));

      if (subsections.length) {
        const sublist = document.createElement("ol");
        sublist.className = "article-toc__sublist";

        subsections.forEach((subheading) => {
          const subitem = document.createElement("li");
          subitem.append(
            createLink(subheading, "article-toc__link--subsection"),
          );
          sublist.append(subitem);
        });

        item.append(sublist);
      }

      fragment.append(item);
    });

    list.append(fragment);
  };

  document.querySelectorAll("[data-toc-list]").forEach(populate);
  desktopToc.hidden = false;
  inlineToc.hidden = false;

  const links = [...document.querySelectorAll("[data-toc-target]")];
  const sectionItems = [
    ...document.querySelectorAll("[data-toc-section]"),
  ];
  const progressLabels = [
    ...document.querySelectorAll("[data-toc-progress]"),
  ];

  let ticking = false;

  const keepActiveLinkVisible = (activeHeadingId) => {
    const activeLink = desktopToc.querySelector(
      `[data-toc-target="${CSS.escape(activeHeadingId)}"]`,
    );
    if (!activeLink) return;

    const tocBounds = desktopToc.getBoundingClientRect();
    const linkBounds = activeLink.getBoundingClientRect();
    const edgePadding = 18;
    const isOutside =
      linkBounds.top < tocBounds.top + edgePadding ||
      linkBounds.bottom > tocBounds.bottom - edgePadding;

    if (isOutside) {
      activeLink.scrollIntoView({ block: "nearest" });
    }
  };

  const updateCurrentHeading = () => {
    const threshold = Math.min(220, window.innerHeight * 0.28);
    let activeHeading = headings[0];

    for (const heading of headings) {
      if (heading.getBoundingClientRect().top > threshold) break;
      activeHeading = heading;
    }

    const activeSection =
      activeHeading.tagName === "H2"
        ? activeHeading
        : [...headings]
            .slice(0, headings.indexOf(activeHeading))
            .reverse()
            .find((heading) => heading.tagName === "H2");

    links.forEach((link) => {
      const isCurrent = link.dataset.tocTarget === activeHeading.id;
      link.classList.toggle("is-current", isCurrent);
      if (isCurrent) {
        link.setAttribute("aria-current", "location");
      } else {
        link.removeAttribute("aria-current");
      }
    });

    sectionItems.forEach((item) => {
      item.classList.toggle(
        "is-current",
        item.dataset.tocSection === activeSection?.id,
      );
    });

    const sectionIndex = Math.max(
      0,
      sections.findIndex(({ heading }) => heading.id === activeSection?.id),
    );
    const progress = `${String(sectionIndex + 1).padStart(2, "0")} / ${String(
      sections.length,
    ).padStart(2, "0")}`;
    progressLabels.forEach((label) => {
      label.textContent = progress;
    });

    if (desktopToc.classList.contains("is-expanded")) {
      keepActiveLinkVisible(activeHeading.id);
    }

    ticking = false;
  };

  const scheduleUpdate = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(updateCurrentHeading);
  };

  window.addEventListener("scroll", scheduleUpdate, { passive: true });
  window.addEventListener("resize", scheduleUpdate);
  window.addEventListener("hashchange", scheduleUpdate);

  modeButton?.addEventListener("click", () => {
    const showAll = !desktopToc.classList.contains("is-expanded");
    desktopToc.classList.toggle("is-expanded", showAll);
    modeButton.textContent = showAll ? "聚焦" : "全部";
    modeButton.setAttribute(
      "aria-label",
      showAll ? "只展开当前章节" : "展开完整目录",
    );
    modeButton.title = showAll ? "只展开当前章节" : "展开完整目录";

    const activeLink = desktopToc.querySelector(
      ".article-toc__link.is-current",
    );
    if (activeLink) {
      keepActiveLinkVisible(activeLink.dataset.tocTarget);
    }
  });

  inlineToc.addEventListener("click", (event) => {
    if (event.target.closest("[data-toc-target]")) {
      inlineToc.open = false;
    }
  });

  updateCurrentHeading();
})();
