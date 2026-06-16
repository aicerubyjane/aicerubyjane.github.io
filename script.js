document.documentElement.classList.add("js");

let lastScrollY = window.scrollY;
let scrollDirection = "down";
document.documentElement.classList.add("scroll-down");

window.addEventListener(
  "scroll",
  () => {
    const currentScrollY = window.scrollY;
    scrollDirection = currentScrollY < lastScrollY ? "up" : "down";
    document.documentElement.classList.toggle("scroll-up", scrollDirection === "up");
    document.documentElement.classList.toggle("scroll-down", scrollDirection === "down");
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
let skillPointerX = 0;
let skillHovering = false;
let skillDragging = false;
let skillDragStartX = 0;
let skillDragStartScroll = 0;
let skillDragTriggered = false;
let skillRaf;
let skillHoverReady = true;
let skillTouchSuppressClick = false;

const getSkillCenterScroll = (index) => {
  if (!skillTrack || !skillCards[index]) return 0;
  const card = skillCards[index];
  return card.offsetLeft - (skillTrack.clientWidth - card.offsetWidth) / 2;
};

const focusSkill = (index, shouldScroll = true, behavior = "smooth") => {
  if (!skillCards.length) return;
  activeSkill = (index + skillCards.length) % skillCards.length;

  skillCards.forEach((card, cardIndex) => {
    const isActive = cardIndex === activeSkill;
    card.classList.toggle("is-active", isActive);
    card.setAttribute("aria-current", isActive ? "true" : "false");
  });

  if (shouldScroll) {
    skillTrack?.scrollTo({
      left: getSkillCenterScroll(activeSkill),
      behavior,
    });
  }
};

const isMobileSkill = () => window.matchMedia("(max-width: 720px)").matches;

skillCards.forEach((card, index) => {
  card.setAttribute("role", "button");
  card.setAttribute("tabindex", "0");
  card.addEventListener("click", (event) => {
    if (skillTouchSuppressClick) {
      event.preventDefault();
      return;
    }

    focusSkill(index);
  });
  card.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    focusSkill(index);
  });
});

skillTrack?.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft") {
    event.preventDefault();
    focusSkill(activeSkill - 1);
  }

  if (event.key === "ArrowRight") {
    event.preventDefault();
    focusSkill(activeSkill + 1);
  }
});

const updateFocusedSkillFromScroll = () => {
  if (!skillTrack || !skillCards.length) return;
  const trackCenter = skillTrack.scrollLeft + skillTrack.clientWidth / 2;
  const cardWidth = skillCards[activeSkill]?.offsetWidth || 1;
  const currentCenter = skillCards[activeSkill].offsetLeft + cardWidth / 2;
  const progressFromCurrent = (trackCenter - currentCenter) / cardWidth;

  if (progressFromCurrent > 0.32 && activeSkill < skillCards.length - 1) {
    focusSkill(activeSkill + 1, false);
    return;
  }

  if (progressFromCurrent < -0.32 && activeSkill > 0) {
    focusSkill(activeSkill - 1, false);
    return;
  }

  const closestIndex = skillCards.reduce((closest, card, index) => {
    const cardCenter = card.offsetLeft + card.offsetWidth / 2;
    const distance = Math.abs(trackCenter - cardCenter);
    return distance < closest.distance ? { index, distance } : closest;
  }, { index: activeSkill, distance: Infinity }).index;

  if (closestIndex !== activeSkill) {
    focusSkill(closestIndex, false);
  }
};

const animateSkillHoverScroll = () => {
  if (!skillTrack || !skillHovering || skillDragging) {
    skillRaf = null;
    return;
  }

  const rect = skillTrack.getBoundingClientRect();
  const relativeX = (skillPointerX - rect.left) / rect.width;
  const edgeZone = 0.18;
  let direction = 0;

  if (relativeX < edgeZone) {
    direction = (relativeX - edgeZone) / edgeZone;
  }

  if (relativeX > 1 - edgeZone) {
    direction = (relativeX - (1 - edgeZone)) / edgeZone;
  }

  if (Math.abs(direction) > 0.45 && skillHoverReady) {
    skillHoverReady = false;
    focusSkill(activeSkill + (direction > 0 ? 1 : -1));
    window.setTimeout(() => {
      skillHoverReady = true;
    }, 380);
  }

  skillRaf = window.requestAnimationFrame(animateSkillHoverScroll);
};

skillTrack?.addEventListener("pointerenter", (event) => {
  if (event.pointerType !== "mouse") return;
  skillHovering = true;
  skillPointerX = event.clientX;
  if (!skillRaf) {
    skillRaf = window.requestAnimationFrame(animateSkillHoverScroll);
  }
});

skillTrack?.addEventListener("pointermove", (event) => {
  if (event.pointerType !== "mouse") return;

  if (event.pointerType === "mouse") {
    skillPointerX = event.clientX;
  }

  if (!skillDragging) return;
  if (event.cancelable) {
    event.preventDefault();
  }

  if (skillDragTriggered) return;

  const deltaX = event.clientX - skillDragStartX;
  skillTrack.scrollLeft = skillDragStartScroll - deltaX;

  if (Math.abs(deltaX) > 30) {
    skillDragTriggered = true;
    focusSkill(activeSkill + (deltaX < 0 ? 1 : -1));
  }
});

skillTrack?.addEventListener("pointerleave", () => {
  skillHovering = false;
});

skillTrack?.addEventListener("pointerdown", (event) => {
  if (event.pointerType !== "mouse" || event.button !== 0) return;
  skillDragging = true;
  skillDragTriggered = false;
  skillDragStartX = event.clientX;
  skillDragStartScroll = skillTrack.scrollLeft;
  skillTrack.classList.add("is-dragging");
  skillTrack.setPointerCapture?.(event.pointerId);
});

skillTrack?.addEventListener("pointerup", (event) => {
  if (event.pointerType !== "mouse") return;
  if (!skillDragging) return;
  skillDragging = false;
  skillTrack.classList.remove("is-dragging");
  skillTrack.releasePointerCapture?.(event.pointerId);

  if (!skillDragTriggered) {
    updateFocusedSkillFromScroll();
  }

  focusSkill(activeSkill);
});

skillTrack?.addEventListener("pointercancel", () => {
  skillDragging = false;
  skillDragTriggered = false;
  skillTrack?.classList.remove("is-dragging");
});

let skillTouchStartX = 0;
let skillTouchStartY = 0;
let skillTouchStartIndex = 0;
let skillTouchMode = null;
let skillTouchMoved = false;
let skillTouchLockedScroll = 0;
let skillTouchCurrentX = 0;
let skillTouchCurrentY = 0;

skillTrack?.addEventListener(
  "touchstart",
  (event) => {
    if (event.touches.length !== 1) return;
    const touch = event.touches[0];
    skillTouchStartX = touch.clientX;
    skillTouchStartY = touch.clientY;
    skillTouchCurrentX = touch.clientX;
    skillTouchCurrentY = touch.clientY;
    skillTouchStartIndex = activeSkill;
    skillTouchMode = null;
    skillTouchMoved = false;
    skillTouchLockedScroll = getSkillCenterScroll(activeSkill);
  },
  { passive: true }
);

skillTrack?.addEventListener(
  "touchmove",
  (event) => {
    if (event.touches.length !== 1) return;
    const touch = event.touches[0];
    const deltaX = touch.clientX - skillTouchStartX;
    const deltaY = touch.clientY - skillTouchStartY;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);
    skillTouchCurrentX = touch.clientX;
    skillTouchCurrentY = touch.clientY;

    if (!skillTouchMode) {
      if (absX > 82 && absX > absY * 2.6) {
        skillTouchMode = "horizontal";
      } else if (absY > 8 && absY >= absX) {
        skillTouchMode = "vertical";
      }
    }

    if (skillTouchMode === "vertical") {
      skillTouchSuppressClick = true;
      return;
    }

    if (skillTouchMode !== "horizontal") {
      return;
    }

    if (event.cancelable) {
      event.preventDefault();
    }
    skillTouchSuppressClick = true;
  },
  { passive: false }
);

const finishSkillTouch = (event) => {
  const deltaX = skillTouchCurrentX - skillTouchStartX;
  const deltaY = skillTouchCurrentY - skillTouchStartY;
  const absX = Math.abs(deltaX);
  const absY = Math.abs(deltaY);
  const isHorizontalSwipe = skillTouchMode === "horizontal" && absX > 82 && absX > absY * 2.2;

  if (isHorizontalSwipe) {
    if (event.cancelable) {
      event.preventDefault();
    }
    skillTouchSuppressClick = true;
    skillTouchMoved = true;
    focusSkill(skillTouchStartIndex + (deltaX < 0 ? 1 : -1), true, isMobileSkill() ? "auto" : "smooth");
    skillTouchLockedScroll = getSkillCenterScroll(activeSkill);
  }

  skillTouchMode = null;
  skillTouchMoved = false;
  window.setTimeout(() => {
    skillTouchSuppressClick = false;
  }, 80);
};

skillTrack?.addEventListener("touchend", finishSkillTouch, { passive: false });
skillTrack?.addEventListener("touchcancel", finishSkillTouch, { passive: false });

let skillWheelReady = true;

skillTrack?.addEventListener(
  "wheel",
  (event) => {
    const movement = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
    if (Math.abs(movement) < 10) return;

    event.preventDefault();
    if (!skillWheelReady) return;

    skillWheelReady = false;
    focusSkill(activeSkill + (movement > 0 ? 1 : -1));
    window.setTimeout(() => {
      skillWheelReady = true;
    }, 420);
  },
  { passive: false }
);

window.requestAnimationFrame(() => {
  focusSkill(0, false);
  skillTrack?.scrollTo({ left: getSkillCenterScroll(0), behavior: "auto" });
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
