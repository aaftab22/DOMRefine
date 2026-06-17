from playwright.sync_api import sync_playwright
from app.services.categories.user_facing_audit import *
from app.services.categories.security_audit import check_security_headers
from app.services.categories.accessibility_audit import *
from app.services.categories.seo_audit import *
from app.services.categories.utils import *

def capture_screenshot(url: str):
    with sync_playwright() as p:
        
        # saving the memory aggrasively to be in render's 512 limit
        browser = p.chromium.launch(
            headless=True,
            args=[
                "--disable-dev-shm-usage",
                "--disable-gpu",
                "--no-zygote",
                "--single-process",
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--js-flags=--max-old-space-size=128"
            ],
        )
        
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
                "category": "security",
                "type": "Missing Security Headers",
                "count": len(missing_security_headers),
                "details": missing_security_headers
            })

        #checking for title checks
        missing_page_title = check_page_title(page)
        if missing_page_title:
            warnings.append({
                "category": "seo",
                "type": "Missing Page Title",
                "details": ["No page title found"]
            })

        #checking for meta description
        meta_description = check_meta_description(page)
        if not meta_description.strip():
            warnings.append({
                "category": "seo",
                "type": "Missing Meta Description",
                "details": ["No meta description found"]
            })

        #checking for empty links
        empty_links = check_empty_links(page)
        if empty_links:
            warnings.append({
                "category": "seo",
                "type": "Empty Links",
                "count": len(empty_links),
                "details": empty_links
            })

        #checking if console errors
        if console_errors:
            errors.append({
                "category": "technical",
                "type": "Console Errors",
                "count": len(console_errors),
                "details": console_errors
            })

        #checking for broken images
        broken_images = check_broken_images(page)
        if broken_images:
            errors.append({
                "category": "user_facing",
                "type": "Broken Images",
                "count": len(broken_images),
                "details": broken_images
            })

        #checking for missin alt tags
        missing_alt_tags = check_missing_alt_tags(page)
        if missing_alt_tags:
            warnings.append({
                "category": "accessibility",
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
                "category": "seo",
                "type": "No Headings",
                "details": ["No heading tags found on page"]
            })

        #checking if there is at least one H1
        missing_h1 = check_missing_h1(headings)
        if missing_h1:
            warnings.append({
                "category": "seo",
                "type": "Missing H1",
                "details": ["No H1 heading found"]
            })

        #checking id there is more than one H1
        multiple_h1 = check_multiple_h1(headings)
        if multiple_h1:
            warnings.append({
                "category": "seo",
                "type": "Multiple H1",
                "details": ["More than one H1 found"]
            })

        # checking for duplicate IDs
        duplicate_ids = check_duplicate_ids(page)
        if duplicate_ids:
            warnings.append({
                "category": "accessibility",
                "type": "Duplicate IDs",
                "count": len(duplicate_ids),
                "details": duplicate_ids
            })

        # checking for inputs without labels
        inputs_without_labels = check_inputs_without_labels(page)
        if inputs_without_labels:
            warnings.append({
                "category": "accessibility",
                "type": "Inputs Without Labels",
                "count": len(inputs_without_labels),
                "details": inputs_without_labels
            })

        # checking for anchor links that point to missing IDs on the page
        broken_anchor_links = check_broken_anchor_links(page)
        if broken_anchor_links:
            warnings.append({
                "category": "user_facing",
                "type": "Broken Anchor Links",
                "count": len(broken_anchor_links),
                "details": broken_anchor_links
            })

        # checking for broken internal pages
        broken_internal_pages, unverifiable_pages = (check_internal_link(page, browser, p))
        if broken_internal_pages:
            errors.append({
                "category": "user_facing",
                "type": "Broken Internal Pages",
                "count": len(broken_internal_pages),
                "details": broken_internal_pages
            })
        if unverifiable_pages:
            warnings.append({
                "category": "user_facing",
                "type": "Unverifiable Internal Pages",
                "count": len(unverifiable_pages),
                "details": unverifiable_pages
            })

        #mobile viewPort
        page.set_viewport_size({"width":390, "height": 844})
        # taking screenshot here
        page.screenshot(
            path="screenshots/mobile.png",
            full_page=True
        )

        #trying to check if the actual page width is more than our viewport (Horizontal overflow)
        mobile_scroll_overflow = page.evaluate("""
        () => {
            return document.documentElement.scrollWidth > window.innerWidth;
        }
        """)
        if mobile_scroll_overflow:
            errors.append({
                "category": "user_facing",
                "type": "Mobile Scroll Overflow",
                "details": ["Horizontal overflow detected"]
            })

        #checking for the actual element causing the overflow
        mobile_element_overflow = get_overflowing_elements(page)
        if mobile_element_overflow:
            errors.append({
                "category": "user_facing",
                "type": "Mobile Element Overflow",
                "count": len(mobile_element_overflow),
                "details": mobile_element_overflow
            })
        mobile_overflow = (
            mobile_scroll_overflow
            or len(mobile_element_overflow) > 0
        )

        # checking for overlapping elements for mobile
        mobile_overlaps = get_overlapping_elements(page)
        if mobile_overlaps:
            errors.append({
                "category": "user_facing",
                "type": "Mobile Overlapping Elements",
                "count": len(mobile_overlaps),
                "details": mobile_overlaps
            })

        #tablet viewport
        page.set_viewport_size({"width":768, "height": 1024})
        # taking screenshot here
        page.screenshot(
            path="screenshots/tablet.png",
            full_page=True
        )

        tablet_scroll_overflow = page.evaluate("""
        () => {
            return document.documentElement.scrollWidth > window.innerWidth;
        }
        """)
        if tablet_scroll_overflow:
            errors.append({
                "category": "user_facing",
                "type": "Tablet Scroll Overflow",
                "details": ["Horizontal overflow detected"]
            })

        tablet_element_overflow = get_overflowing_elements(page)
        if tablet_element_overflow:
            errors.append({
                "category": "user_facing",
                "type": "Tablet Element Overflow",
                "count": len(tablet_element_overflow),
                "details": tablet_element_overflow
            })

        tablet_overflow = (
            tablet_scroll_overflow
            or len(tablet_element_overflow) > 0
        )

        #desktop viewport
        page.set_viewport_size({"width":1440, "height": 900})
        # taking screenshot here
        page.screenshot(
            path="screenshots/desktop.png",
            full_page=True
        )

        desktop_scroll_overflow = page.evaluate("""
        () => {
            return document.documentElement.scrollWidth > window.innerWidth;
        }
        """)
        if desktop_scroll_overflow:
            errors.append({
                "category": "user_facing",
                "type": "Desktop Scroll Overflow",
                "details": ["Horizontal overflow detected"]
            })

        desktop_element_overflow = get_overflowing_elements(page)
        if desktop_element_overflow:
            errors.append({
                "category": "user_facing",
                "type": "Desktop Element Overflow",
                "count": len(desktop_element_overflow),
                "details": desktop_element_overflow
            })

        desktop_overflow = (
            desktop_scroll_overflow
            or len(desktop_element_overflow) > 0
        )

        page.close()
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