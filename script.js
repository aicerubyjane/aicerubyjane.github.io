document.documentElement.classList.add("js");

// Initialize Lenis smooth scroll if available
let lenis = null;
if (typeof Lenis !== "undefined") {
  lenis = new Lenis({
    lerp: 0.12,
    wheelMultiplier: 1.0,
    smoothWheel: true,
  });

  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }

  requestAnimationFrame(raf);

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      const targetId = this.getAttribute("href");
      if (targetId && targetId !== "#") {
        const target = document.querySelector(targetId);
        if (target) {
          e.preventDefault();
          lenis.scrollTo(target);
        }
      }
    });
  });
}

let lastScrollY = window.scrollY;
let scrollDirection = "down";

window.addEventListener(
  "scroll",
  () => {
    const currentScrollY = window.scrollY;
    scrollDirection = currentScrollY < lastScrollY ? "up" : "down";
    lastScrollY = currentScrollY;
  },
  { passive: true }
);

const navToggle = document.querySelector(".nav-toggle");
const nav = document.querySelector(".site-nav");
const navLinks = [...document.querySelectorAll(".site-nav a")];
const sections = [...document.querySelectorAll("main section[id]")];
const filterButtons = [...document.querySelectorAll(".filter-button")];
const projectCards = [...document.querySelectorAll(".project-card")];
const skillTrack = document.querySelector(".skills-track");
const skillCards = [...document.querySelectorAll("[data-skill-card]")];
const themeToggle = document.querySelector(".theme-toggle");
const designCodeSplit = document.querySelector(".design-code .hero-split");
const designSide = document.querySelector(".design-code .hero-side-design");
const codeSide = document.querySelector(".design-code .hero-side-code");

const setTheme = (theme) => {
  const nextTheme = theme === "dark" ? "dark" : "light";
  document.documentElement.dataset.theme = nextTheme;
  localStorage.setItem("portfolio-theme", nextTheme);
  themeToggle?.setAttribute("aria-pressed", String(nextTheme === "dark"));
  themeToggle?.setAttribute("aria-label", nextTheme === "dark" ? "Switch to light mode" : "Switch to dark mode");
};

setTheme(localStorage.getItem("portfolio-theme") || "light");

themeToggle?.addEventListener("click", () => {
  const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";

  if (document.startViewTransition && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    document.startViewTransition(() => setTheme(nextTheme));
    return;
  }

  setTheme(nextTheme);
});

navToggle?.addEventListener("click", () => {
  const isOpen = nav?.classList.toggle("open");
  navToggle.setAttribute("aria-expanded", String(Boolean(isOpen)));
});

navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    nav?.classList.remove("open");
    navToggle?.setAttribute("aria-expanded", "false");
  });
});

const revealSections = [...document.querySelectorAll("main .section")];
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting && entry.intersectionRatio > 0.16) {
        entry.target.dataset.revealDir = scrollDirection;
        entry.target.classList.add("section-in-view");
        return;
      }

      if (entry.intersectionRatio < 0.04) {
        entry.target.classList.remove("section-in-view");
      }
    });
  },
  { rootMargin: "-8% 0px -10% 0px", threshold: [0, 0.04, 0.16, 0.32] }
);

revealSections.forEach((section) => revealObserver.observe(section));

const activeObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.forEach((link) => {
        link.classList.toggle("active", link.getAttribute("href") === `#${entry.target.id}`);
      });
    });
  },
  { rootMargin: "-42% 0px -52% 0px", threshold: 0 }
);

sections.forEach((section) => activeObserver.observe(section));

let activeSkill = 0;
let skillStepLocked = false;
let skillClickLocked = false;
let skillResizeTimer;

const skillPointer = {
  id: null,
  down: false,
  mode: null,
  stepped: false,
  startX: 0,
  startY: 0,
};

const skillViewport = (() => {
  if (!skillTrack) return null;
  if (skillTrack.parentElement?.classList.contains("skills-viewport")) {
    return skillTrack.parentElement;
  }

  const viewport = document.createElement("div");
  viewport.className = "skills-viewport";
  skillTrack.parentNode?.insertBefore(viewport, skillTrack);
  viewport.appendChild(skillTrack);
  return viewport;
})();

const applySkillBaseStyles = () => {
  if (!skillTrack || !skillViewport) return;

  Object.assign(skillViewport.style, {
    overflow: "hidden",
    width: "100%",
    position: "relative",
    touchAction: "pan-y",
  });

  Object.assign(skillTrack.style, {
    overflow: "visible",
    scrollBehavior: "auto",
    scrollSnapType: "none",
    touchAction: "pan-y",
    willChange: "transform",
    transition: "transform 340ms cubic-bezier(0.22, 1, 0.36, 1)",
  });
};

const clampSkillIndex = (index) => Math.max(0, Math.min(index, skillCards.length - 1));

const setActiveSkill = (index) => {
  if (!skillCards.length) return;
  activeSkill = clampSkillIndex(index);

  skillCards.forEach((card, cardIndex) => {
    const isActive = cardIndex === activeSkill;
    card.classList.toggle("is-active", isActive);
    card.setAttribute("aria-current", isActive ? "true" : "false");
  });
};

const getSkillTranslateX = (index) => {
  if (!skillTrack || !skillViewport || !skillCards[index]) return 0;

  const card = skillCards[index];
  const viewportCenter = skillViewport.clientWidth / 2;
  const cardCenter = card.offsetLeft + card.offsetWidth / 2;

  return viewportCenter - cardCenter;
};

const renderSkillPosition = (withTransition = true) => {
  if (!skillTrack) return;

  skillTrack.style.transition = withTransition
    ? "transform 340ms cubic-bezier(0.22, 1, 0.36, 1)"
    : "none";

  skillTrack.style.transform = `translate3d(${getSkillTranslateX(activeSkill)}px, 0, 0)`;

  if (!withTransition) {
    skillTrack.offsetHeight;
    skillTrack.style.transition = "transform 340ms cubic-bezier(0.22, 1, 0.36, 1)";
  }
};

const focusSkill = (index, withTransition = true) => {
  if (!skillTrack || !skillCards.length) return;
  setActiveSkill(index);
  renderSkillPosition(withTransition);
};

const unlockSkillStep = () => {
  window.setTimeout(() => {
    skillStepLocked = false;
  }, 360);
};

const stepSkill = (direction) => {
  if (!skillCards.length || direction === 0 || skillStepLocked) return;

  const nextIndex = clampSkillIndex(activeSkill + direction);
  if (nextIndex === activeSkill) return;

  skillStepLocked = true;
  focusSkill(nextIndex, true);
  unlockSkillStep();
};

skillCards.forEach((card, index) => {
  card.setAttribute("role", "button");
  card.setAttribute("tabindex", "0");

  card.addEventListener("click", (event) => {
    if (skillClickLocked) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    focusSkill(index, true);
  });

  card.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    focusSkill(index, true);
  });
});

skillTrack?.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft") {
    event.preventDefault();
    stepSkill(-1);
  }

  if (event.key === "ArrowRight") {
    event.preventDefault();
    stepSkill(1);
  }
});

const skillSurface = skillViewport || skillTrack;

skillSurface?.addEventListener("pointerdown", (event) => {
  if (!event.isPrimary) return;
  if (event.pointerType === "mouse" && event.button !== 0) return;

  skillPointer.id = event.pointerId;
  skillPointer.down = true;
  skillPointer.mode = null;
  skillPointer.stepped = false;
  skillPointer.startX = event.clientX;
  skillPointer.startY = event.clientY;

  skillSurface.setPointerCapture?.(event.pointerId);
});

skillSurface?.addEventListener("pointermove", (event) => {
  if (!skillPointer.down || event.pointerId !== skillPointer.id) return;

  const deltaX = event.clientX - skillPointer.startX;
  const deltaY = event.clientY - skillPointer.startY;
  const absX = Math.abs(deltaX);
  const absY = Math.abs(deltaY);

  if (!skillPointer.mode) {
    if (absX > 12 && absX > absY * 1.18) {
      skillPointer.mode = "horizontal";
      skillClickLocked = true;
      skillSurface.classList.add("is-dragging");
    } else if (absY > 12 && absY >= absX) {
      skillPointer.mode = "vertical";
    }
  }

  if (skillPointer.mode !== "horizontal") return;

  if (event.cancelable) event.preventDefault();

  if (!skillPointer.stepped && absX > 26) {
    skillPointer.stepped = true;
    stepSkill(deltaX < 0 ? 1 : -1);
  }
});

const finishSkillPointer = (event) => {
  if (!skillPointer.down || event.pointerId !== skillPointer.id) return;

  const deltaX = event.clientX - skillPointer.startX;
  const deltaY = event.clientY - skillPointer.startY;
  const absX = Math.abs(deltaX);
  const absY = Math.abs(deltaY);

  if (skillPointer.mode === "horizontal") {
    if (event.cancelable) event.preventDefault();

    if (!skillPointer.stepped && absX > 26 && absX > absY * 1.15) {
      stepSkill(deltaX < 0 ? 1 : -1);
    }
  }

  skillPointer.id = null;
  skillPointer.down = false;
  skillPointer.mode = null;
  skillPointer.stepped = false;

  skillSurface?.classList.remove("is-dragging");
  skillSurface?.releasePointerCapture?.(event.pointerId);

  window.setTimeout(() => {
    skillClickLocked = false;
  }, 160);
};

skillSurface?.addEventListener("pointerup", finishSkillPointer);
skillSurface?.addEventListener("pointercancel", finishSkillPointer);
skillSurface?.addEventListener("lostpointercapture", () => {
  skillPointer.id = null;
  skillPointer.down = false;
  skillPointer.mode = null;
  skillPointer.stepped = false;
  skillSurface?.classList.remove("is-dragging");

  window.setTimeout(() => {
    skillClickLocked = false;
  }, 160);
});

skillSurface?.addEventListener(
  "wheel",
  (event) => {
    const movement = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
    if (Math.abs(movement) < 8) return;

    event.preventDefault();
    stepSkill(movement > 0 ? 1 : -1);
  },
  { passive: false }
);

window.addEventListener(
  "resize",
  () => {
    window.clearTimeout(skillResizeTimer);
    skillResizeTimer = window.setTimeout(() => {
      renderSkillPosition(false);
    }, 120);
  },
  { passive: true }
);

window.requestAnimationFrame(() => {
  applySkillBaseStyles();
  focusSkill(0, false);
});

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const filter = button.dataset.filter;

    filterButtons.forEach((item) => item.classList.toggle("active", item === button));
    projectCards.forEach((card) => {
      const categories = card.dataset.category?.split(" ") ?? [];
      card.classList.toggle("is-hidden", filter !== "all" && !categories.includes(filter));
    });
  });
});

const setDesignCodeFocus = (focus) => {
  if (!designCodeSplit) return;

  designCodeSplit.classList.toggle("is-design-focus", focus === "design");
  designCodeSplit.classList.toggle("is-code-focus", focus === "code");
};

if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
  designSide?.addEventListener("pointerenter", () => setDesignCodeFocus("design"));
  codeSide?.addEventListener("pointerenter", () => setDesignCodeFocus("code"));
  designCodeSplit?.addEventListener("pointerleave", () => setDesignCodeFocus(null));
}
