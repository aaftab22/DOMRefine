from playwright.sync_api import sync_playwright

def capture_screenshot(url: str):
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        console_errors = []        

        #attaching to console before loading the page
        page.on(
            "console",
            lambda msg: console_errors.append(msg.text)
            if msg.type == "error"
            else None
        )

        page.goto(url)

        #checking if image load or not and if width is 0 after loading
        broken_images = page.evaluate("""
        () => {
            const images = Array.from(document.images);

            return images
                .filter(img => !img.complete || img.naturalWidth === 0)
                .map(img => img.src);
        }
        """)

        #checking for missin alt tags
        missing_alt_tags = page.evaluate("""
        () => {
            return Array.from(document.images)
                .filter(img => !img.hasAttribute('alt') || img.alt.trim() === '')
                .map(img => img.src);
        }
        """)

        #mobile viewPort
        page.set_viewport_size({"width":390, "height": 844})
        #tryig to check if the actual page width is more than our viewport if yes it's problem 
        mobile_overflow = page.evaluate("""
        () => {
            return document.documentElement.scrollWidth > window.innerWidth;
        }
        """)
        page.screenshot(
            path="screenshots/mobile.png",
            full_page=True
        )

        #tablet viewport
        page.set_viewport_size({"width":768, "height": 1024})
        tablet_overflow = page.evaluate("""
        () => {
            return document.documentElement.scrollWidth > window.innerWidth;
        }
        """)
        page.screenshot(
            path="screenshots/tablet.png",
            full_page=True
        )

        #laptop viewport
        page.set_viewport_size({"width":1440, "height": 900})
        desktop_overflow = page.evaluate("""
        () => {
            return document.documentElement.scrollWidth > window.innerWidth;
        }
        """)
        page.screenshot(
            path="screenshots/desktop.png",
            full_page=True
        )

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
            "brokenImages": broken_images,
            "brokenImageCount": len(broken_images),
            "consoleErrors": console_errors,
            "consoleErrorCount": len(console_errors),
            "missingAltTags": missing_alt_tags,
            "missingAltTagCount": len(missing_alt_tags)
        }