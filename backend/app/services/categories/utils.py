def trigger_lazy_loading(page):
    page.evaluate("""
    async () => {
        await new Promise((resolve) => {
            let totalHeight = 0;
            const distance = 100;

            const timer = setInterval(() => {
                const scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;

                if (totalHeight >= scrollHeight - window.innerHeight) {
                    clearInterval(timer);
                    resolve();
                }
            }, 50);
        });
    }
    """)

    page.wait_for_timeout(750)
    page.evaluate("window.scrollTo(0, 0)")

def get_overflowing_elements(page):
    return page.evaluate("""
    () => {
        const clientWidth = document.documentElement.clientWidth || window.innerWidth;
        const rootWidth = document.documentElement.scrollWidth;

        function isElementVisibleAndOnScreen(el, rect) {
            if (rect.width === 0 || rect.height === 0) return false;

            const style = window.getComputedStyle(el);
            if (style.display === 'none' || style.visibility === 'hidden') return false;

            // Protection 1: Ignore transparent slides
            if (parseFloat(style.opacity) < 0.1) return false;

            if (rect.left > (rootWidth + 15) || rect.right < -15 || rect.bottom < -15) return false;
            return true;
        }

        // Protection 2: The Containment Check (Fixes Swiper carousels)
        function isContainedByHiddenParent(el) {
            let parent = el.parentElement;
            while (parent && parent !== document.body && parent !== document.documentElement) {
                const pStyle = window.getComputedStyle(parent);
                // If a parent has overflow hidden...
                if (pStyle.overflowX === 'hidden' || pStyle.overflow === 'hidden') {
                    const pRect = parent.getBoundingClientRect();
                    // AND that parent fits on the screen, it safely clips the child.
                    if (pRect.right <= clientWidth + 5) {
                        return true; 
                    }
                }
                parent = parent.parentElement;
            }
            return false;
        }

        const selectors = 'div, img, table, form, h1, h2, h3, p, a';

        return Array.from(document.querySelectorAll(selectors))
            .filter(el => {
                const rect = el.getBoundingClientRect();
                if (!isElementVisibleAndOnScreen(el, rect)) return false;

                // Visual Overflow Check
                if (rect.right > clientWidth + 5) {
                    // If it overflows, check if a parent is safely clipping it
                    if (isContainedByHiddenParent(el)) return false;
                    return true; // True page-breaking overflow!
                }
                return false;
            })
            .slice(0, 15)
            .map(el => {
                const rect = el.getBoundingClientRect();
                const selector = el.id ? `#${el.id}` : el.className ? `.${el.className.split(' ')[0]}` : el.tagName.toLowerCase();
                return {
                    tag: el.tagName,
                    text: el.innerText?.trim().slice(0, 50) || "",
                    selector: selector,
                    right: Math.round(rect.right),
                    overflowBy: Math.round(rect.right - clientWidth)
                };
            });
    }
    """)

def get_overlapping_elements(page):
    return page.evaluate("""
    () => {
        const clientWidth = document.documentElement.clientWidth || window.innerWidth;

        // NEW: Walks up the DOM to ensure no parent is hiding the element
        function isEffectivelyVisible(el, rect) {
            if (rect.width === 0 || rect.height === 0) return false;

            // Ignore if pushed completely off-screen horizontally (fixes translation carousels)
            if (rect.left > clientWidth || rect.right < 0 || rect.bottom < 0) return false;

            let current = el;
            while (current && current !== document.body && current !== document.documentElement) {
                const style = window.getComputedStyle(current);

                if (style.display === 'none' || style.visibility === 'hidden') return false;

                // Ignore elements inside transparent parents (fixes fade carousels)
                if (parseFloat(style.opacity) < 0.1) return false;

                // Ignore fixed/sticky elements (navbars, chat widgets)
                if (current === el && (style.position === 'fixed' || style.position === 'sticky')) return false;

                current = current.parentElement;
            }
            return true;
        }

        function isAncestor(parent, child) {
            let node = child.parentNode;
            while (node != null) {
                if (node == parent) return true;
                node = node.parentNode;
            }
            return false;
        }

        const rawElements = Array.from(document.querySelectorAll('button, a, input, textarea, select'));
        const validElements = [];

        for (const el of rawElements) {
            const rect = el.getBoundingClientRect();
            if (isEffectivelyVisible(el, rect)) {
                validElements.push({ el, rect });
            }
        }

        const overlaps = [];

        for (let i = 0; i < validElements.length; i++) {
            for (let j = i + 1; j < validElements.length; j++) {
                const itemA = validElements[i];
                const itemB = validElements[j];

                if (isAncestor(itemA.el, itemB.el) || isAncestor(itemB.el, itemA.el)) continue;

                const rectA = itemA.rect;
                const rectB = itemB.rect;

                const overlapX = Math.max(0, Math.min(rectA.right, rectB.right) - Math.max(rectA.left, rectB.left));
                const overlapY = Math.max(0, Math.min(rectA.bottom, rectB.bottom) - Math.max(rectA.top, rectB.top));
                const overlapArea = overlapX * overlapY;

                if (overlapArea > 0) {
                    const smallerArea = Math.min(rectA.width * rectA.height, rectB.width * rectB.height);

                    // Threshold: Overlap must be at least 15% of smaller element
                    if (overlapArea >= (smallerArea * 0.15)) {
                        const overlapCenterX = Math.max(rectA.left, rectB.left) + (overlapX / 2);
                        const overlapCenterY = Math.max(rectA.top, rectB.top) + (overlapY / 2);

                        const topHitElement = document.elementFromPoint(overlapCenterX, overlapCenterY);

                        if (topHitElement) {
                            const hitsA = topHitElement === itemA.el || isAncestor(itemA.el, topHitElement);
                            const hitsB = topHitElement === itemB.el || isAncestor(itemB.el, topHitElement);

                            if (hitsA || hitsB) {
                                overlaps.push({
                                    element1: { tag: itemA.el.tagName, text: itemA.el.innerText?.trim().slice(0, 50) || "" },
                                    element2: { tag: itemB.el.tagName, text: itemB.el.innerText?.trim().slice(0, 50) || "" },
                                    overlapArea: Math.round(overlapArea)
                                });
                            }
                        }
                    }
                }
                if (overlaps.length >= 20) break;
            }
            if (overlaps.length >= 20) break;
        }

        return overlaps;
    }
    """)