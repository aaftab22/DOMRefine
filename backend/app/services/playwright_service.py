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

        #checking for meta description
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

        #checking for empty links
        empty_links = page.evaluate("""
        () => {
            return Array.from(document.querySelectorAll('a'))
                .filter(a =>
                    !a.textContent.trim() &&
                    a.children.length === 0
                )
                .map(a => a.href);
        }
        """)
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
        broken_images = page.evaluate("""
        () => {
            const images = Array.from(document.images);

            return images
                .filter(img => !img.complete || img.naturalWidth === 0)
                .map(img => ({
                    src: img.src,
                    alt: img.alt || ""
                }));
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

        #checking if list contains at least one heading
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

        # checking for duplicate IDs
        duplicate_ids = page.evaluate("""
            () => {
                const idGroups = {};
                document.querySelectorAll('[id]').forEach(el => {
                    if (!el.id) return;
                    if (!idGroups[el.id]) idGroups[el.id] = [];
                    const selector = `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${el.className ? '.' + el.className.trim().split(/\\s+/).join('.') : ''}`;
                    idGroups[el.id].push({
                        tag: el.tagName,
                        className: el.className || '',
                        selector: selector
                    });
                });
    
                return Object.entries(idGroups)
                    .filter(([, els]) => els.length > 1)
                    .map(([id, els]) => ({id, count: els.length, elements: els}));
            }
            """)
        if duplicate_ids:
            warnings.append({
                "type": "Duplicate IDs",
                "count": len(duplicate_ids),
                "details": duplicate_ids
            })

        # checking for inputs without labels
        inputs_without_labels = page.evaluate("""
        () => {
            return Array.from(
                document.querySelectorAll('input, textarea, select')
            )
            .filter(el => {
                const hasLabel =
                    document.querySelector(`label[for="${el.id}"]`) ||
                    el.closest('label');

                return !hasLabel;
            })
            .map(el => ({
                tag: el.tagName,
                id: el.id || "",
                type: el.type || ""
            }));
        }
        """)
        if inputs_without_labels:
            warnings.append({
                "type": "Inputs Without Labels",
                "count": len(inputs_without_labels),
                "details": inputs_without_labels
            })

        # checking for anchor links that point to missing IDs on the page
        broken_anchor_links = page.evaluate("""
        () => {
            return Array.from(
                document.querySelectorAll('a[href^="#"]')
            )
            .filter(link => {
                const href = link.getAttribute('href');
                if (href === '#' || href === '#!') {
                    return false;
                }
                const targetId = href.slice(1);
                if (!targetId) return false;
                return !document.getElementById(targetId);
            })
            .map(link => ({
                text: link.textContent.trim(),
                href: link.getAttribute('href')
            }));
        }
        """)
        if broken_anchor_links:
            warnings.append({
                "type": "Broken Anchor Links",
                "count": len(broken_anchor_links),
                "details": broken_anchor_links
            })

        # checking for broken internal pages (404, 500, unreachable)
        checker_page = browser.new_page()
        internal_links = page.evaluate("""
        () => {
            return Array.from(document.querySelectorAll('a[href]'))
                .map(a => a.href)
                .filter(href => 
                    href.startsWith(window.location.origin)
                ); 
        }
        """)
        broken_internal_pages = []
        for link in set(internal_links):
            try:
                response = checker_page.goto(
                    link,
                    wait_until="domcontentloaded"
                )

                if response and response.status >= 400:
                    broken_internal_pages.append({
                        "url": link,
                        "status": response.status
                    })
            except Exception as e:
                broken_internal_pages.append({
                    "url": link,
                    "status": str(e)
                })
        checker_page.close()

        if broken_internal_pages:
            errors.append({
                "type": "Broken Internal Pages",
                "count": len(broken_internal_pages),
                "details": broken_internal_pages
            })
        #mobile viewPort
        page.set_viewport_size({"width":390, "height": 844})

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