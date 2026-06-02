from playwright.sync_api import sync_playwright

def get_overflowing_elements(page):
    return page.evaluate("""
    () => {
        return Array.from(document.querySelectorAll('*'))
            .filter(el => {
                const rect = el.getBoundingClientRect();
                return rect.right > window.innerWidth;
            })
            .slice(0, 20)
            .map(el => ({
                tag: el.tagName,
                id: el.id,
                className: el.className,
                right: el.getBoundingClientRect().right
            }));
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
            
        page.goto(url, wait_until="load")

        #checking for title checks
        page_title = page.title()
        missing_page_title = page_title.strip() == ""

        if missing_page_title:
            warnings.append({
                "type": "Missing Page Title",
                "details": ["No page title found"]
            })

        meta_description = page.evaluate("""
        () => {
            const meta = document.querySelector(
                'meta[name="description"]'
            );

            return meta ? meta.content : "";
        }
        """)
        if not meta_description.strip():
            warnings.append({
                "type": "Missing Meta Description",
                "details": ["No meta description found"]
            })
        print("meta_description", meta_description)


        if console_errors:
            errors.append({
                "type": "Console Errors",
                "count": len(console_errors),
                "details": console_errors
            })

        #checking if image load or not and if width is 0 after loading
        broken_images = page.evaluate("""
        () => {
            const images = Array.from(document.images);

            return images
                .filter(img => !img.complete || img.naturalWidth === 0)
                .map(img => img.src);
        }
        """)
        if broken_images:
            errors.append({
                "type": "Broken Images",
                "count": len(broken_images),
                "details": broken_images
            })

        #checking for missin alt tags
        missing_alt_tags = page.evaluate("""
        () => {
            return Array.from(document.images)
                .filter(img => !img.hasAttribute('alt') || img.alt.trim() === '')
                .map(img => img.src);
        }
        """)
        if missing_alt_tags:
            warnings.append({
                "type": "Missing Alt Tags",
                "count": len(missing_alt_tags),
                "details": missing_alt_tags
            })

        #getting all the heading tags
        headings = page.evaluate("""
        () => {
            return Array.from(
                document.querySelectorAll('h1,h2,h3,h4,h5,h6')
            ).map(h => h.tagName);
        }
        """)

        #checking if list contains atleast one heading 
        no_headings = len(headings) == 0
        if no_headings:
            warnings.append({
                "type": "No Headings",
                "details": ["No heading tags found on page"]
            })

        #checking if there is at least one H1
        missing_h1 = 'H1' not in headings
        if missing_h1:
            warnings.append({
                "type": "Missing H1",
                "details": ["No H1 heading found"]
            })

        #checking id there is more than one H1
        multiple_h1 = headings.count('H1') > 1
        if multiple_h1:
            warnings.append({
                "type": "Multiple H1",
                "details": ["More than one H1 found"]
            })

        #mobile viewPort
        page.set_viewport_size({"width":390, "height": 844})
        #tryig to check if the actual page width is more than our viewport if yes it's problem 
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
        #taking screnshot here
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

        print("Mobile Elements:", mobile_element_overflow)
        print("Tablet Elements:", tablet_element_overflow)
        print("Desktop Elements:", desktop_element_overflow)

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