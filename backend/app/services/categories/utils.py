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
        function isElementVisibleAndOnScreen(el, rect) {
            const style = window.getComputedStyle(el);
            if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
            if (rect.width === 0 || rect.height === 0) return false;
            if (rect.right < 0 || rect.left > document.documentElement.scrollWidth || rect.bottom < 0) return false;
            return true;
        }

        // NEW: Check if element is safely inside a scrolling container (Carousel)
        function hasScrollableParent(el) {
            let parent = el.parentElement;
            while (parent) {
                const style = window.getComputedStyle(parent);
                // auto/scroll = native scroller. hidden = JS controlled carousel
                if (style.overflowX === 'auto' || style.overflowX === 'scroll' || style.overflowX === 'hidden') {
                    return true; 
                }
                parent = parent.parentElement;
            }
            return false;
        }

        return Array.from(document.querySelectorAll('button, a, input, textarea, select'))
            .filter(el => {
                const rect = el.getBoundingClientRect();
                if (!isElementVisibleAndOnScreen(el, rect)) return false;

                // Overflow check
                if (rect.right > window.innerWidth + 10) {
                    // NEW: If it overflows, is it inside a carousel?
                    if (hasScrollableParent(el)) {
                        return false; // Safely contained, ignore it
                    }
                    return true; // True page-breaking overflow!
                }
                return false;
            })
            .slice(0, 20)
            .map(el => {
                const rect = el.getBoundingClientRect();
                return {
                    tag: el.tagName,
                    text: el.innerText?.trim().slice(0, 50) || "",
                    selector: el.id ? `#${el.id}` : el.className ? `.${el.className.split(' ')[0]}` : el.tagName.toLowerCase(),
                    right: rect.right,
                    overflowBy: Math.round(rect.right - window.innerWidth)
                };
            });
    }
    """)

def get_overlapping_elements(page):
    return page.evaluate("""
    () => {
        function isElementVisibleAndOnScreen(el, rect) {
            const style = window.getComputedStyle(el);
            if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;

            // NEW: Ignore floating/sticky elements (like WhatsApp buttons or bottom navs)
            if (style.position === 'fixed' || style.position === 'sticky') return false;

            if (rect.width === 0 || rect.height === 0) return false;
            if (rect.right < 0 || rect.left > document.documentElement.scrollWidth || rect.bottom < 0) return false;
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
            if (isElementVisibleAndOnScreen(el, rect)) {
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
