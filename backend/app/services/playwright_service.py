from playwright.sync_api import sync_playwright
from app.services.categories.user_facing_audit import *
from app.services.categories.security_audit import check_security_headers
from app.services.categories.accessibility_audit import *
from app.services.categories.seo_audit import *

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

def capture_screenshot(url: str):
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        errors = []
        warnings = []
        console_errors = []

        #attaching to console before loading the page
        page.on(
            "console",
            lambda msg: console_errors.append(msg.text)
            if msg.type == "error"
            else None
        )

        response = page.goto(url, wait_until="domcontentloaded")
        trigger_lazy_loading(page)

        #security audit
        missing_security_headers = check_security_headers(response)
        if missing_security_headers:
            warnings.append({
                "type": "Missing Security Headers",
                "count": len(missing_security_headers),
                "details": missing_security_headers
            })

        #checking for title checks
        missing_page_title = check_page_title(page)
        if missing_page_title:
            warnings.append({
                "type": "Missing Page Title",
                "details": ["No page title found"]
            })

        #checking for meta description
        meta_description = check_meta_description(page)
        if not meta_description.strip():
            warnings.append({
                "type": "Missing Meta Description",
                "details": ["No meta description found"]
            })

        #checking for empty links
        empty_links = check_empty_links(page)
        if empty_links:
            warnings.append({
                "type": "Empty Links",
                "count": len(empty_links),
                "details": empty_links
            })

        #checking if console errors
        if console_errors:
            errors.append({
                "type": "Console Errors",
                "count": len(console_errors),
                "details": console_errors
            })

        #checking for broken images
        broken_images = check_broken_images(page)
        if broken_images:
            errors.append({
                "type": "Broken Images",
                "count": len(broken_images),
                "details": broken_images
            })

        #checking for missin alt tags
        missing_alt_tags = check_missing_alt_tags(page)
        if missing_alt_tags:
            warnings.append({
                "type": "Missing Alt Tags",
                "count": len(missing_alt_tags),
                "details": missing_alt_tags
            })

        #getting all the heading tags
        headings = get_headings(page)

        #checking if list contains at least one heading
        no_headings = check_no_headings(headings)
        if no_headings:
            warnings.append({
                "type": "No Headings",
                "details": ["No heading tags found on page"]
            })

        #checking if there is at least one H1
        missing_h1 = check_missing_h1(headings)
        if missing_h1:
            warnings.append({
                "type": "Missing H1",
                "details": ["No H1 heading found"]
            })

        #checking id there is more than one H1
        multiple_h1 = check_multiple_h1(headings)
        if multiple_h1:
            warnings.append({
                "type": "Multiple H1",
                "details": ["More than one H1 found"]
            })

        # checking for duplicate IDs
        duplicate_ids = check_duplicate_ids(page)
        if duplicate_ids:
            warnings.append({
                "type": "Duplicate IDs",
                "count": len(duplicate_ids),
                "details": duplicate_ids
            })

        # checking for inputs without labels
        inputs_without_labels = check_inputs_without_labels(page)
        if inputs_without_labels:
            warnings.append({
                "type": "Inputs Without Labels",
                "count": len(inputs_without_labels),
                "details": inputs_without_labels
            })

        # checking for anchor links that point to missing IDs on the page
        broken_anchor_links = check_broken_anchor_links(page)
        if broken_anchor_links:
            warnings.append({
                "type": "Broken Anchor Links",
                "count": len(broken_anchor_links),
                "details": broken_anchor_links
            })

        # checking for broken internal pages
        broken_internal_pages, unverifiable_pages = (check_internal_link(page, browser, p))
        if broken_internal_pages:
            errors.append({
                "type": "Broken Internal Pages",
                "count": len(broken_internal_pages),
                "details": broken_internal_pages
            })
        if unverifiable_pages:
            warnings.append({
                "type": "Unverifiable Internal Pages",
                "count": len(unverifiable_pages),
                "details": unverifiable_pages
            })

        #mobile viewPort
        page.set_viewport_size({"width":390, "height": 844})

        # checking for overlapping elements for mobile
        mobile_overlaps = get_overlapping_elements(page)

        if mobile_overlaps:
            errors.append({
                "type": "Mobile Overlapping Elements",
                "count": len(mobile_overlaps),
                "details": mobile_overlaps
            })

        #trying to check if the actual page width is more than our viewport
        mobile_overflow = page.evaluate("""
        () => {
            return document.documentElement.scrollWidth > window.innerWidth;
        }
        """)
        mobile_element_overflow = get_overflowing_elements(page)
        if mobile_element_overflow:
            errors.append({
                "type": "Mobile Element Overflow",
                "count": len(mobile_element_overflow),
                "details": mobile_element_overflow
            })

        #taking screenshot here
        page.screenshot(
            path="screenshots/mobile.png",
            full_page=True
        )
        if mobile_overflow:
            errors.append({
                "type": "Mobile Overflow",
                "details": ["Horizontal overflow detected"]
            })

        #tablet viewport
        page.set_viewport_size({"width":768, "height": 1024})

        tablet_overflow = page.evaluate("""
        () => {
            return document.documentElement.scrollWidth > window.innerWidth;
        }
        """)
        tablet_element_overflow = get_overflowing_elements(page)
        if tablet_element_overflow:
            errors.append({
                "type": "Tablet Element Overflow",
                "count": len(tablet_element_overflow),
                "details": tablet_element_overflow
            })
        page.screenshot(
            path="screenshots/tablet.png",
            full_page=True
        )
        if tablet_overflow:
            errors.append({
                "type": "Tablet Overflow",
                "details": ["Horizontal overflow detected"]
            })

        #laptop viewport
        page.set_viewport_size({"width":1440, "height": 900})

        desktop_overflow = page.evaluate("""
        () => {
            return document.documentElement.scrollWidth > window.innerWidth;
        }
        """)

        desktop_element_overflow = get_overflowing_elements(page)

        if desktop_element_overflow:
            errors.append({
                "type": "Desktop Element Overflow",
                "count": len(desktop_element_overflow),
                "details": desktop_element_overflow
            })
        page.screenshot(
            path="screenshots/desktop.png",
            full_page=True
        )
        if desktop_overflow:
            errors.append({
                "type": "Desktop Overflow",
                "details": ["Horizontal overflow detected"]
            })

        browser.close()

        return {
            "images" : [
                "screenshots/mobile.png",
                "screenshots/tablet.png",
                "screenshots/desktop.png"
            ],
            "overflow" : {
                "mobile" : mobile_overflow,
                "tablet": tablet_overflow,
                "desktop": desktop_overflow
            },
            "errors": errors,
            "warnings": warnings
        }